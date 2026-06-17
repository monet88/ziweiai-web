/**
 * Unit test AuthStore: state transitions + getAccessToken đọc tươi.
 *
 * Mock $lib/supabase/supabase-client để tách Supabase thật + tránh kéo $env virtual
 * module. Chỉ kiểm chứng logic store (init/signIn/signOut/getAccessToken).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mock supabase client (vi.mock hoist lên đầu file → khai báo mock qua vi.hoisted) ---
const mockAuth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signInAnonymously: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('$lib/supabase/supabase-client', () => ({
  supabase: { auth: mockAuth },
}));

import { AuthStore } from './auth-store.svelte';

function makeSession(token: string, isAnonymous = false) {
  return {
    access_token: token,
    user: { id: 'u1', email: 'a@b.com', is_anonymous: isAnonymous },
  };
}

function makeAnonSession(token: string) {
  return {
    access_token: token,
    user: { id: 'anon-1', email: undefined, is_anonymous: true },
  };
}

describe('AuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.getSession.mockResolvedValue({ data: { session: null } });
    mockAuth.signInAnonymously.mockResolvedValue({ data: { session: null }, error: null });
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('khởi tạo với trạng thái rỗng và đang initializing', () => {
    const store = new AuthStore();
    expect(store.session).toBeNull();
    expect(store.user).toBeNull();
    expect(store.isInitializing).toBe(true);
    expect(store.isAuthenticated).toBe(false);
    expect(store.getAccessToken()).toBeNull();
  });

  it('init() nạp session hiện có và tắt cờ initializing', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: makeSession('tok-1') } });
    const store = new AuthStore();
    store.init();
    await vi.waitFor(() => expect(store.isInitializing).toBe(false));
    expect(store.isAuthenticated).toBe(true);
    expect(store.getAccessToken()).toBe('tok-1');
    expect(store.user?.email).toBe('a@b.com');
  });

  it('onAuthStateChange cập nhật session khi đăng nhập muộn', async () => {
    let handler: (event: string, session: unknown) => void = () => {};
    mockAuth.onAuthStateChange.mockImplementation((cb) => {
      handler = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    const store = new AuthStore();
    store.init();
    await vi.waitFor(() => expect(store.isInitializing).toBe(false));

    handler('SIGNED_IN', makeSession('tok-2'));
    expect(store.getAccessToken()).toBe('tok-2');
    expect(store.isAuthenticated).toBe(true);
  });

  it('getAccessToken đọc token TƯƠI tại thời điểm gọi', async () => {
    let handler: (event: string, session: unknown) => void = () => {};
    mockAuth.onAuthStateChange.mockImplementation((cb) => {
      handler = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    const store = new AuthStore();
    store.init();
    handler('TOKEN_REFRESHED', makeSession('old'));
    expect(store.getAccessToken()).toBe('old');
    handler('TOKEN_REFRESHED', makeSession('new'));
    expect(store.getAccessToken()).toBe('new');
  });

  it('init() cấp phiên ẩn danh khi chưa có session (decision 0009)', async () => {
    mockAuth.signInAnonymously.mockResolvedValue({
      data: { session: makeAnonSession('anon-tok') },
      error: null,
    });
    const store = new AuthStore();
    store.init();
    await vi.waitFor(() => expect(store.isInitializing).toBe(false));
    expect(mockAuth.signInAnonymously).toHaveBeenCalledOnce();
    expect(store.isAuthenticated).toBe(true);
    expect(store.isAnonymous).toBe(true);
    expect(store.getAccessToken()).toBe('anon-tok');
  });

  it('init() KHÔNG gọi signInAnonymously khi đã có session', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: makeSession('tok-1') } });
    const store = new AuthStore();
    store.init();
    await vi.waitFor(() => expect(store.isInitializing).toBe(false));
    expect(mockAuth.signInAnonymously).not.toHaveBeenCalled();
    expect(store.isAnonymous).toBe(false);
  });

  it('init() tắt cờ initializing khi anonymous sign-in lỗi (không treo UI)', async () => {
    mockAuth.signInAnonymously.mockResolvedValue({
      data: { session: null },
      error: { message: 'Anonymous sign-ins are disabled' },
    });
    const store = new AuthStore();
    store.init();
    await vi.waitFor(() => expect(store.isInitializing).toBe(false));
    expect(store.isAuthenticated).toBe(false);
    expect(store.isAnonymous).toBe(false);
  });

  it('isAnonymous false cho phiên email thường', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: makeSession('tok-1', false) } });
    const store = new AuthStore();
    store.init();
    await vi.waitFor(() => expect(store.isInitializing).toBe(false));
    expect(store.isAnonymous).toBe(false);
  });

  it('init() cleanup hủy subscription', () => {
    const unsubscribe = vi.fn();
    mockAuth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
    const store = new AuthStore();
    const cleanup = store.init();
    cleanup();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('signInWithPassword ném lỗi khi Supabase trả error', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ error: { message: 'Sai thông tin' } });
    const store = new AuthStore();
    await expect(store.signInWithPassword('a@b.com', 'x')).rejects.toThrow('Sai thông tin');
  });

  it('signUpWithPassword báo cần xác nhận email khi chưa có session', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const store = new AuthStore();
    const result = await store.signUpWithPassword('a@b.com', 'x');
    expect(result.needsEmailConfirmation).toBe(true);
  });

  it('signOut ném lỗi khi Supabase trả error', async () => {
    mockAuth.signOut.mockResolvedValue({ error: { message: 'Lỗi đăng xuất' } });
    const store = new AuthStore();
    await expect(store.signOut()).rejects.toThrow('Lỗi đăng xuất');
  });
});
