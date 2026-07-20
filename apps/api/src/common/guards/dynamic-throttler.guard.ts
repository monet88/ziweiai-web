import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';

@Injectable()
export class DynamicThrottlerGuard extends ThrottlerGuard {
  private configCache: Record<string, any> = {};
  private lastCacheTime = 0;
  private readonly CACHE_TTL_MS = 60000; // Cache config for 60 seconds

  @Inject(SupabasePersistenceGateway)
  private readonly persistenceGateway!: SupabasePersistenceGateway;

  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ips?.length ? req.ips[0] : req.ip; 
  }

  protected async handleRequest(requestProps: any): Promise<boolean> {
    const { context, limit, ttl, throttler, getTracker, generateKey } = requestProps;
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const isAuth = !!(user && user.email);
    const configKey = isAuth ? 'RATE_LIMIT_AUTH' : 'RATE_LIMIT_ANON';

    const now = Date.now();
    if (now - this.lastCacheTime > this.CACHE_TTL_MS) {
      try {
        this.configCache = await this.persistenceGateway.getSystemConfigs();
        this.lastCacheTime = now;
      } catch (e) {
        console.error('Failed to refresh throttler configs', e);
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
