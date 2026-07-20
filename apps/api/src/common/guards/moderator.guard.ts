import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ApiErrorHttpException } from '../http/api-error';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';

@Injectable()
export class ModeratorGuard implements CanActivate {
  constructor(private readonly persistenceGateway: SupabasePersistenceGateway) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.email) {
      throw new ApiErrorHttpException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Vui lòng đăng nhập.');
    }

    const role = await this.persistenceGateway.checkAdminRole(user.email);
    
    if (role !== 'SUPER_ADMIN' && role !== 'MODERATOR') {
      throw new ApiErrorHttpException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'Bạn không có quyền truy cập trang quản trị.');
    }

    return true;
  }
}
