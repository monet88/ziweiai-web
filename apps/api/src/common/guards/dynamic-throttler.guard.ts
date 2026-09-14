import { Injectable, Inject } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminRepository } from '../../database/repositories/admin.repository';

@Injectable()
export class DynamicThrottlerGuard extends ThrottlerGuard {
  private configCache: Record<string, any> = {
    RATE_LIMIT_AUTH: { ttl: 60, limit: 60 },
    RATE_LIMIT_ANON: { ttl: 60, limit: 10 },
  };
  private lastCacheTime = 0;
  private readonly CACHE_TTL_MS = 60000; // Cache config for 60 seconds

  @Inject(AdminRepository)
  private readonly adminRepository!: AdminRepository;

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const user = req.authenticatedUser || req.user;
    if (user?.userId || user?.id) {
      return `usr_${user.userId || user.id}`;
    }
    return req.ips?.length ? req.ips[0] : req.ip; 
  }

  protected async handleRequest(requestProps: any): Promise<boolean> {
    const { context, limit, ttl } = requestProps;
    const request = context.switchToHttp().getRequest();
    const user = request.authenticatedUser || request.user;
    const isAuth = !!(user && user.email);
    const configKey = isAuth ? 'RATE_LIMIT_AUTH' : 'RATE_LIMIT_ANON';

    const now = Date.now();
    if (now - this.lastCacheTime > this.CACHE_TTL_MS) {
      try {
        this.configCache = await this.adminRepository.getSystemConfigs();
        this.lastCacheTime = now;
      } catch (e) {
        console.error('Failed to refresh throttler configs', e);
        // Backoff 30s before trying again to prevent cascading timeouts
        this.lastCacheTime = now - this.CACHE_TTL_MS + 30000;
      }
    }

    let dynamicLimit = limit;
    let dynamicTtl = ttl;

    const dbConfig = this.configCache[configKey];
    if (dbConfig && typeof dbConfig.limit === 'number' && typeof dbConfig.ttl === 'number') {
      dynamicLimit = dbConfig.limit;
      dynamicTtl = dbConfig.ttl;
    }

    return super.handleRequest({
      ...requestProps,
      limit: dynamicLimit,
      ttl: dynamicTtl,
    });
  }
}
