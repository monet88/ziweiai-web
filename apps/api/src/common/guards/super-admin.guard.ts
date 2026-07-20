import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { adminEmailsList } from '../../config/env';
import { ApiErrorHttpException } from '../http/api-error';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assumes AuthGuard runs before this

    if (!user || !user.email) {
      throw new ApiErrorHttpException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Vui lòng đăng nhập.');
    }

    if (!adminEmailsList.includes(user.email)) {
      throw new ApiErrorHttpException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'Bạn không có quyền truy cập trang quản trị.');
    }

    return true;
  }
}
