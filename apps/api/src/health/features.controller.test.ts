import { HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { apiEnv } from '../config/env';
import { ApiErrorHttpException } from '../common/http/api-error';
import { isPublicRouteKey } from '../modules/auth/decorators/public.decorator';
import { FeaturesController } from './features.controller';

type ExtendedFeatureEnvKey =
  | 'EXTENDED_SYSTEM_HEPAN_ENABLED'
  | 'EXTENDED_SYSTEM_MANGPAI_ENABLED'
  | 'EXTENDED_SYSTEM_TAROT_ENABLED'
  | 'EXTENDED_SYSTEM_MBTI_ENABLED'
  | 'EXTENDED_SYSTEM_FACE_ENABLED'
  | 'EXTENDED_SYSTEM_PALM_ENABLED'
  | 'EXTENDED_SYSTEM_LENORMAND_ENABLED'
  | 'EXTENDED_SYSTEM_DREAM_ENABLED'
  | 'EXTENDED_SYSTEM_STICKS_ENABLED';

const FEATURE_KEYS: readonly ExtendedFeatureEnvKey[] = [
  'EXTENDED_SYSTEM_HEPAN_ENABLED',
  'EXTENDED_SYSTEM_MANGPAI_ENABLED',
  'EXTENDED_SYSTEM_TAROT_ENABLED',
  'EXTENDED_SYSTEM_MBTI_ENABLED',
  'EXTENDED_SYSTEM_FACE_ENABLED',
  'EXTENDED_SYSTEM_PALM_ENABLED',
  'EXTENDED_SYSTEM_LENORMAND_ENABLED',
  'EXTENDED_SYSTEM_DREAM_ENABLED',
  'EXTENDED_SYSTEM_STICKS_ENABLED',
];

function withFeatureFlags<T>(values: Record<ExtendedFeatureEnvKey, boolean>, callback: () => T): T {
  const previous = Object.fromEntries(FEATURE_KEYS.map((key) => [key, apiEnv[key]])) as Record<ExtendedFeatureEnvKey, boolean>;

  try {
    for (const key of FEATURE_KEYS) {
      apiEnv[key] = values[key];
    }
    return callback();
  } finally {
    for (const key of FEATURE_KEYS) {
      apiEnv[key] = previous[key];
    }
  }
}

describe('FeaturesController', () => {
  it('trả đúng trạng thái 9 cờ hệ mở rộng', () => {
    const controller = new FeaturesController();

    const result = withFeatureFlags(
      {
        EXTENDED_SYSTEM_HEPAN_ENABLED: true,
        EXTENDED_SYSTEM_MANGPAI_ENABLED: false,
        EXTENDED_SYSTEM_TAROT_ENABLED: true,
        EXTENDED_SYSTEM_MBTI_ENABLED: false,
        EXTENDED_SYSTEM_FACE_ENABLED: true,
        EXTENDED_SYSTEM_PALM_ENABLED: false,
        EXTENDED_SYSTEM_LENORMAND_ENABLED: true,
        EXTENDED_SYSTEM_DREAM_ENABLED: false,
        EXTENDED_SYSTEM_STICKS_ENABLED: true,
      },
      () => controller.getFeatures(),
    );

    expect(result).toEqual({
      hepan: true,
      mangpai: false,
      tarot: true,
      mbti: false,
      face: true,
      palm: false,
      lenormand: true,
      dream: false,
      sticks: true,
    });
  });

  it('đánh dấu endpoint /features là public', () => {
    const reflector = new Reflector();
    const isPublic = reflector.get<boolean>(isPublicRouteKey, FeaturesController.prototype.getFeatures);

    expect(isPublic).toBe(true);
  });

  it('ApiErrorHttpException vẫn parse được mã lỗi FEATURE_DISABLED cho feature flag', () => {
    const error = new ApiErrorHttpException(HttpStatus.FORBIDDEN, 'FEATURE_DISABLED', 'Tính năng chưa bật.');
    const response = error.getResponse() as { code: string };

    expect(response.code).toBe('FEATURE_DISABLED');
  });
});
