import { describe, expect, it } from 'vitest';
import { tryTranslateZiweiKey } from '../../../../apps/web/src/lib/i18n/ziwei-terms-vi';
import { iztroEmittedLocaleKeys } from './iztro-key-maps';

describe('iztro locale key coverage', () => {
  it('covers every iztro-derived key with a Vietnamese frontend translation', () => {
    for (const [group, keys] of Object.entries(iztroEmittedLocaleKeys)) {
      for (const key of keys) {
        expect(tryTranslateZiweiKey(key), `missing VN translation for ${group}:${key}`).toBeTruthy();
      }
    }
  });
});
