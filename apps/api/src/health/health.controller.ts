import { Controller, Get } from '@nestjs/common';
import { healthResponseSchema, type HealthResponse } from '@ziweiai/contracts';
import { Public } from '../modules/auth/decorators/public.decorator';
import { apiEnv, apiVersion } from '../config/env';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  getHealth(): HealthResponse {
    return healthResponseSchema.parse({
      service: apiEnv.API_SERVICE_NAME,
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: apiVersion,
    });
  }
}
