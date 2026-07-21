import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Inject,
  mixin,
  Type,
} from '@nestjs/common';
import { Observable, from, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';

export function RequireXU(costOrFn: number | ((req: any) => number)): Type<NestInterceptor> {
  @Injectable()
  class MixinBillingInterceptor implements NestInterceptor {
    constructor(
      @Inject(SupabasePersistenceGateway)
      private readonly persistence: SupabasePersistenceGateway,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      
      const cost = typeof costOrFn === 'function' ? costOrFn(request) : costOrFn;
      
      if (cost <= 0) {
        return next.handle();
      }

      if (!user || !user.sub) {
        return next.handle();
      }

      // Bypass check if configured (e.g. env var)
      if (process.env.AI_EXPLANATION_FREE_FOR_ALL === 'true') {
        return next.handle();
      }

      return from(this.persistence.findProfileByUserId(user.sub)).pipe(
        switchMap((profile) => {
          if (!profile || profile.xuBalance < cost) {
            return throwError(
              () =>
                new HttpException(
                  {
                    statusCode: HttpStatus.PAYMENT_REQUIRED,
                    message: `Không đủ XU (Yêu cầu: ${cost} XU). Vui lòng nạp thêm.`,
                    error: 'Payment Required',
                    code: 'INSUFFICIENT_XU',
                  },
                  HttpStatus.PAYMENT_REQUIRED,
                ),
            );
          }

          // Deduct XU first to prevent double-spending in race conditions
          return from(this.persistence.deductXU(user.sub, cost)).pipe(
            switchMap((success) => {
              if (!success) {
                return throwError(
                  () =>
                    new HttpException(
                      {
                        statusCode: HttpStatus.PAYMENT_REQUIRED,
                        message: `Không đủ XU (Yêu cầu: ${cost} XU). Vui lòng nạp thêm.`,
                        error: 'Payment Required',
                        code: 'INSUFFICIENT_XU',
                      },
                      HttpStatus.PAYMENT_REQUIRED,
                    ),
                );
              }
              // After successful deduction, proceed with the request
              return next.handle();
            })
          );
        })
      );
    }
  }

  return mixin(MixinBillingInterceptor);
}
