/**
 * Unit test cho redirectOnExpiredSession (hardening 401 → /sign-in).
 *
 * Mock $app/navigation để bắt goto; $app/paths đã alias sang stub (resolve = identity,
 * base = ''). window.location.pathname đặt thủ công cho từng case. Chỉ kiểm logic guard:
 * - chỉ redirect khi ApiError.kind === 'unauthorized'
 * - bỏ qua khi đã ở /sign-in (tránh vòng lặp)
 * - bỏ qua lỗi không phải 401 (network/server/parse...)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { gotoMock } = vi.hoisted(() => ({ gotoMock: vi.fn(() => Promise.resolve()) }));

vi.mock('$app/navigation', () => ({ goto: gotoMock }));

import { ApiError } from '$lib/api-client';
import { redirectOnExpiredSession } from './query-client';

describe('redirectOnExpiredSession', () => {
  beforeEach(() => {
    gotoMock.mockClear();
    window.history.replaceState({}, '', '/dashboard');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('redirects to /sign-in on a 401 ApiError', () => {
    redirectOnExpiredSession(new ApiError('unauthorized', 'Phiên hết hạn.', 401));
    expect(gotoMock).toHaveBeenCalledTimes(1);
    expect(gotoMock).toHaveBeenCalledWith('/sign-in', { replaceState: true });
  });

  it('ignores non-401 ApiError kinds', () => {
    for (const kind of ['network', 'server', 'parse', 'forbidden', 'not-found'] as const) {
      redirectOnExpiredSession(new ApiError(kind, 'lỗi khác'));
    }
    expect(gotoMock).not.toHaveBeenCalled();
  });

  it('ignores non-ApiError values', () => {
    redirectOnExpiredSession(new Error('boom'));
    redirectOnExpiredSession('nope');
    redirectOnExpiredSession(null);
    expect(gotoMock).not.toHaveBeenCalled();
  });

  it('does not redirect when already on /sign-in (avoids a loop)', () => {
    window.history.replaceState({}, '', '/sign-in');
    redirectOnExpiredSession(new ApiError('unauthorized', 'Phiên hết hạn.', 401));
    expect(gotoMock).not.toHaveBeenCalled();
  });
});
