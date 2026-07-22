import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { isPublicRouteKey } from '../auth/decorators/public.decorator';
import { ShareController } from './share.controller';

describe('ShareController public routes', () => {
  it('đánh dấu share redirect và OG image là public (crawler không có bearer)', () => {
    const reflector = new Reflector();

    expect(reflector.get<boolean>(isPublicRouteKey, ShareController.prototype.handleShareRedirect)).toBe(
      true,
    );
    expect(reflector.get<boolean>(isPublicRouteKey, ShareController.prototype.generateOgImage)).toBe(true);
  });
});
