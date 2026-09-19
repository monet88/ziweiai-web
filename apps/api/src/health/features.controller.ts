import { Controller, Get } from '@nestjs/common';
import type { FeaturesResponse } from '@ziweiai/contracts';
import { Public } from '../modules/auth/decorators/public.decorator';
import { apiEnv } from '../config/env';

export type FeaturesStatus = FeaturesResponse;

@Controller('features')
export class FeaturesController {
  @Public()
  @Get()
  getFeatures(): FeaturesResponse {
    return {
      hepan: apiEnv.EXTENDED_SYSTEM_HEPAN_ENABLED,
      mangpai: apiEnv.EXTENDED_SYSTEM_MANGPAI_ENABLED,
      tarot: apiEnv.EXTENDED_SYSTEM_TAROT_ENABLED,
      mbti: apiEnv.EXTENDED_SYSTEM_MBTI_ENABLED,
      face: apiEnv.EXTENDED_SYSTEM_FACE_ENABLED,
      palm: apiEnv.EXTENDED_SYSTEM_PALM_ENABLED,
      lenormand: apiEnv.EXTENDED_SYSTEM_LENORMAND_ENABLED,
      dream: apiEnv.EXTENDED_SYSTEM_DREAM_ENABLED,
      sticks: apiEnv.EXTENDED_SYSTEM_STICKS_ENABLED,
      almanac: apiEnv.EXTENDED_SYSTEM_ALMANAC_ENABLED,
      numerology: true,
      xiaoliuren: apiEnv.EXTENDED_SYSTEM_XIAOLIUREN_ENABLED,
    };
  }
}
