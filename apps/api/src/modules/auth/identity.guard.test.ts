import { HttpStatus, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ApiErrorHttpException } from '../../common/http/api-error';
import type { AuthenticatedRequest } from './types/authenticated-request';
import { EmailIdentityGuard, assertEmailIdentityRequired } from './identity.guard';

function createHttpContext(request: Partial<AuthenticatedRequest>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function expectIdentityRequired(error: unknown): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string; message: string };

  expect(apiError.getStatus()).toBe(HttpStatus.FORBIDDEN);
  expect(response.code).toBe('IDENTITY_REQUIRED');
  expect(response.message).toContain('email');
}

describe('EmailIdentityGuard', () => {
  it('assertEmailIdentityRequired cho qua khi user có email', () => {
    expect(() => assertEmailIdentityRequired({ email: 'user@example.com' })).not.toThrow();
  });

  it('assertEmailIdentityRequired chặn user ẩn danh email=null', () => {
    try {
      assertEmailIdentityRequired({ email: null });
      throw new Error('expected identity guard to throw');
    } catch (error) {
      expectIdentityRequired(error);
    }
  });

  it('canActivate chặn khi request chưa có authenticatedUser', () => {
    const guard = new EmailIdentityGuard();

    try {
      guard.canActivate(createHttpContext({}));
      throw new Error('expected identity guard to throw');
    } catch (error) {
      expectIdentityRequired(error);
    }
  });

  it('canActivate chặn phiên ẩn danh', () => {
    const guard = new EmailIdentityGuard();

    try {
      guard.canActivate(createHttpContext({ authenticatedUser: { userId: 'user-1', email: null } }));
      throw new Error('expected identity guard to throw');
    } catch (error) {
      expectIdentityRequired(error);
    }
  });

  it('canActivate cho qua user có email', () => {
    const guard = new EmailIdentityGuard();

    expect(
      guard.canActivate(createHttpContext({ authenticatedUser: { userId: 'user-1', email: 'user@example.com' } })),
    ).toBe(true);
  });
});
