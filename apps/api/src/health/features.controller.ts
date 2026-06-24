import { Controller, Get } from '@nestjs/common';
import { Public } from '../modules/auth/decorators/public.decorator';
import { apiEnv } from '../config/env';

export interface FeaturesStatus {
  // 6 extended systems flags (US-017)
  hepan: boolean;
  mangpai: boolean;
  tarot: boolean;
  mbti: boolean;
  face: boolean;
  palm: boolean;
}

@Controller('features')
export class FeaturesController {
  @Public()
  @Get()
  getFeatures(): FeaturesStatus {
    return {
      hepan: apiEnv.EXTENDED_SYSTEM_HEPAN_ENABLED,
      mangpai: apiEnv.EXTENDED_SYSTEM_MANGPAI_ENABLED,
      tarot: apiEnv.EXTENDED_SYSTEM_TAROT_ENABLED,
      mbti: apiEnv.EXTENDED_SYSTEM_MBTI_ENABLED,
      face: apiEnv.EXTENDED_SYSTEM_FACE_ENABLED,
      palm: apiEnv.EXTENDED_SYSTEM_PALM_ENABLED,
    };
  }
}
