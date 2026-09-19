import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ApiErrorHttpException } from '../../common/http/api-error';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';

function throwIdentifiedUserRequired(): never {
  throw new ApiErrorHttpException(
    HttpStatus.FORBIDDEN,
    'FORBIDDEN',
    'Tính năng Đồng Bộ Thư Viện Hoàng Triều Đám Mây yêu cầu tài khoản đã đăng nhập định danh (Email).',
  );
}

/**
 * Guard bảo vệ tính năng Royal Gallery Cloud Sync.
 * Yêu cầu:
 * 1. Phải đăng nhập có JWT hợp lệ.
 * 2. Phải có email định danh (không cho phép phiên anonymous vô danh truy cập cloud sync).
 */
@Injectable()
export class IdentifiedUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.authenticatedUser;
    
    if (!user || !user.userId) {
      throwIdentifiedUserRequired();
    }

    // Chặn hoàn toàn anonymous user (email là null)
    if (!user.email) {
      throwIdentifiedUserRequired();
    }

    return true;
  }
}

/**
 * Alias cho backwards compatibility trong module và test
 */
export const RoyalGalleryProGuard = IdentifiedUserGuard;
