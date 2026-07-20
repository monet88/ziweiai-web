import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ApiErrorHttpException } from '../http/api-error';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly persistenceGateway: SupabasePersistenceGateway) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.authenticatedUser; // Assumes SupabaseAuthGuard runs before this

    if (!user || !user.email) {
      throw new ApiErrorHttpException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Vui lòng đăng nhập.');
    }

    const role = await this.persistenceGateway.checkAdminRole(user.email);
    
    if (role !== 'SUPER_ADMIN') {
      throw new ApiErrorHttpException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'Bạn không có quyền Super Admin.');
    }

    return true;
  }
}
