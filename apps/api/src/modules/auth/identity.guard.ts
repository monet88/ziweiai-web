import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import type { AuthenticatedRequest } from './types/authenticated-request';

function throwIdentityRequired(): never {
  throw new ApiErrorHttpException(
    HttpStatus.FORBIDDEN,
    'IDENTITY_REQUIRED',
    'Tính năng này yêu cầu danh tính email (không hỗ trợ tài khoản ẩn danh).',
  );
}

/**
 * Guard/helper yêu cầu danh tính email thật.
 * Dùng cho face/palm theo decision 0009 + 0012: phiên ẩn danh có email=null nên bị chặn.
 */
@Injectable()
export class EmailIdentityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.authenticatedUser) {
      throwIdentityRequired();
    }
    assertEmailIdentityRequired(request.authenticatedUser);
    return true;
  }
}

export function assertEmailIdentityRequired(user: Pick<AuthenticatedUser, 'email'>): void {
  if (!user.email) {
    throwIdentityRequired();
  }
}
