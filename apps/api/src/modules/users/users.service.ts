import { Inject, Injectable, Logger } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { HttpStatus } from '@nestjs/common';
import { WalletEngineService } from '../wallet/wallet-engine.service';
import { ProfilesRepository } from '../../database/repositories/profiles.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient,
    private readonly walletEngine: WalletEngineService,
    private readonly profilesRepo: ProfilesRepository,
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
    try {
      return await this.walletEngine.getBalance(userId);
    } catch (err: any) {
      this.logger.error(`Failed to get wallet balance for user ${userId}: ${err.message}`);
      throw new ApiErrorHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', 'Failed to fetch wallet balance');
    }
  }

  async updateFcmToken(userId: string, token: string, platform?: string): Promise<void> {
    this.logger.log(`Registering FCM token for user ${userId} (${platform || 'unknown'})`);
    try {
      await this.profilesRepo.updateFcmToken(userId, token, platform);
      this.logger.log(`Successfully persisted FCM token for user ${userId}`);
    } catch (err: any) {
      this.logger.warn(`Could not persist FCM token for user ${userId}: ${err.message}. Graceful fallback.`);
    }
  }
}
