import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ApiErrorHttpException } from '../../common/http/api-error';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';

function throwGalleryProRequired(): never {
  throw new ApiErrorHttpException(
    HttpStatus.FORBIDDEN,
    'FORBIDDEN',
    'Tính năng Đồng Bộ Thư Viện Hoàng Triều Đám Mây yêu cầu tài khoản định danh email và đặc quyền VIP PRO.',
  );
}

/**
 * Guard bảo vệ tính năng Royal Gallery Cloud Sync.
 * Yêu cầu:
 * 1. Phải đăng nhập có JWT hợp lệ.
 * 2. Phải có email (không cho phép phiên anonymous vô danh truy cập cloud sync).
 */
@Injectable()
export class RoyalGalleryProGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.authenticatedUser;
    
    if (!user || !user.userId) {
      throwGalleryProRequired();
    }

    // Chặn hoàn toàn anonymous user (email là null)
    if (!user.email) {
      throwGalleryProRequired();
    }

    return true;
  }
}
