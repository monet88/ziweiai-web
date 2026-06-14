import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { isPublicRouteKey } from '../decorators/public.decorator';
import { SupabaseAuthService } from '../supabase-auth.service';
import type { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: SupabaseAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(isPublicRouteKey, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.readBearerToken(request);
    if (!token) {
      throw new ApiErrorHttpException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Thiếu bearer token.', request.requestId ?? null);
    }

    try {
      request.authenticatedUser = await this.authService.verifyAccessToken(token);
      return true;
    } catch {
      throw new ApiErrorHttpException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Bearer token không hợp lệ.', request.requestId ?? null);
    }
  }

  private readBearerToken(request: Request): string | null {
    const authorization = request.header('authorization')?.trim();
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.slice('Bearer '.length).trim();
    return token.length > 0 ? token : null;
  }
}
