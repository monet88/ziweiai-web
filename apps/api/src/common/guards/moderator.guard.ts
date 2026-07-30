import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ApiErrorHttpException } from '../http/api-error';
import { AdminRepository } from '../../database/repositories/admin.repository';

@Injectable()
export class ModeratorGuard implements CanActivate {
  constructor(private readonly adminRepository: AdminRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.authenticatedUser;

    if (!user || !user.email) {
      throw new ApiErrorHttpException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Vui lòng đăng nhập.');
    }

    const role = await this.adminRepository.checkAdminRole(user.email);
    
    if (role !== 'SUPER_ADMIN' && role !== 'MODERATOR') {
      throw new ApiErrorHttpException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'Bạn không có quyền truy cập trang quản trị.');
    }

    return true;
  }
}
