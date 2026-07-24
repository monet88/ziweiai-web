/**
 * Auth store client-only (Svelte 5 runes) — bọc Supabase browser client.
 *
 * Bất biến token tươi (invariants.md §3): getAccessToken() đọc session.access_token
 * ngay tại thời điểm gọi (KHÔNG snapshot lúc mount). autoRefreshToken + onAuthStateChange
 * giữ token tươi để tránh 401 ngầm. Logout phải clear cache query (gọi ở UI layer).
 *
 * Rewrite từ Expo: apps/app/src/features/auth/{auth-context,auth-provider}.* sang runes.
 */
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '$lib/supabase/supabase-client';

function isAnonymousUser(user: User | null): boolean {
  if (!user) {
    return false;
  }
  if (user.is_anonymous === true) {
    return true;
  }
  if (user.app_metadata?.provider === 'anonymous') {
    return true;
  }
  if (user.identities?.some((identity) => identity.provider === 'anonymous')) {
    return true;
  }
  return !user.email && !user.phone;
}

export class AuthStore {
  session = $state<Session | null>(null);
  user = $state<User | null>(null);
  /** true cho tới khi getSession() đầu tiên hoàn tất — guard chờ cờ này. */
  isInitializing = $state(true);

  /**
   * Khởi tạo: nạp session hiện có + subscribe onAuthStateChange.
   * Gọi trong $effect ở layout root; trả về hàm cleanup để hủy subscribe.
   */
  init(): () => void {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      if (data.session) {
        this.session = data.session;
        this.user = data.session.user;
      } else {
        this.session = null;
        this.user = null;
      }
      this.isInitializing = false;
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) {
        return;
      }
      this.session = nextSession;
      this.user = nextSession?.user ?? null;
      this.isInitializing = false;
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }

  /** Token tươi đọc tại thời điểm gọi — dùng ngay trước mỗi request Bearer. */
  getAccessToken(): string | null {
    return this.session?.access_token ?? null;
  }

  get isAuthenticated(): boolean {
    return this.session !== null;
  }

  /** true khi phiên hiện tại là phiên ẩn danh (Supabase anonymous sign-in, decision 0009). */
  get isAnonymous(): boolean {
    return isAnonymousUser(this.session?.user ?? null);
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      throw new Error(error.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
    }
  }

  /** Trả về cờ cần xác nhận email (signUp thành công nhưng chưa có session). */
  async signUpWithPassword(
    email: string,
    password: string,
  ): Promise<{ needsEmailConfirmation: boolean }> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      throw new Error(error.message || 'Tạo tài khoản thất bại. Vui lòng thử lại.');
    }
    return { needsEmailConfirmation: data.session === null };
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message || 'Đăng xuất thất bại. Vui lòng thử lại.');
    }
  }
}
