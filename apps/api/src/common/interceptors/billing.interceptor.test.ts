import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { of, throwError, lastValueFrom } from 'rxjs';
import { RequireXU } from './billing.interceptor';

describe('RequireXU Interceptor', () => {
  const mockUser = { userId: 'user-test-123' };
  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => ({ authenticatedUser: mockUser }),
    }),
  } as ExecutionContext;

  it('bypasses deduction when cost is 0', async () => {
    const InterceptorClass = RequireXU(0);
    const profilesRepo = { findProfileByUserId: vi.fn() };
    const walletEngine = { deductXU: vi.fn(), addXU: vi.fn() };
    const interceptor = new InterceptorClass(profilesRepo as any, walletEngine as any);

    const callHandler: CallHandler = { handle: () => of({ success: true }) };
    const result = await lastValueFrom(interceptor.intercept(mockContext, callHandler));

    expect(result).toEqual({ success: true });
    expect(walletEngine.deductXU).not.toHaveBeenCalled();
  });

  it('deducts XU and auto-refunds if downstream handler throws an error', async () => {
    const InterceptorClass = RequireXU(10);
    const profilesRepo = { findProfileByUserId: vi.fn().mockResolvedValue({ xuBalance: 20 }) };
    const walletEngine = {
      deductXU: vi.fn().mockResolvedValue(true),
      addXU: vi.fn().mockResolvedValue(true),
    };
    const interceptor = new InterceptorClass(profilesRepo as any, walletEngine as any);

    const callHandler: CallHandler = {
      handle: () => throwError(() => new Error('AI Vision model timeout')),
    };

    await expect(lastValueFrom(interceptor.intercept(mockContext, callHandler))).rejects.toThrow(
      'AI Vision model timeout',
    );

    expect(walletEngine.deductXU).toHaveBeenCalledWith('user-test-123', 10, 'ai_usage');
    expect(walletEngine.addXU).toHaveBeenCalledWith('user-test-123', 10, 'ai_refund');
  });

  it('throws 402 PAYMENT_REQUIRED when user has insufficient XU', async () => {
    const InterceptorClass = RequireXU(10);
    const profilesRepo = { findProfileByUserId: vi.fn().mockResolvedValue({ xuBalance: 5 }) };
    const walletEngine = { deductXU: vi.fn(), addXU: vi.fn() };
    const interceptor = new InterceptorClass(profilesRepo as any, walletEngine as any);

    const callHandler: CallHandler = { handle: () => of({ success: true }) };

    await expect(lastValueFrom(interceptor.intercept(mockContext, callHandler))).rejects.toThrow(
      HttpException,
    );
    expect(walletEngine.deductXU).not.toHaveBeenCalled();
  });
});
