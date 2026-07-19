import { Inject, Injectable, Logger } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { HttpStatus } from '@nestjs/common';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient,
    private readonly gateway: SupabasePersistenceGateway,
  ) {}

  async deleteAccount(userId: string): Promise<void> {
    this.logger.log(`Deleting account for user: ${userId}`);
    const { error } = await this.client.auth.admin.deleteUser(userId);
    
    if (error) {
      this.logger.error(`Failed to delete account for user ${userId}: ${error.message}`);
      throw new ApiErrorHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', 'Failed to delete user account');
    }
    
    this.logger.log(`Account deleted successfully for user: ${userId}`);
  }
  async getWalletBalance(userId: string): Promise<number> {
    const profile = await this.gateway.findProfileByUserId(userId);

    if (!profile) {
      this.logger.error(`Failed to get wallet balance for user ${userId}: Profile not found`);
      throw new ApiErrorHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', 'Failed to fetch wallet balance');
    }

    return profile.xuBalance;
  }
}
