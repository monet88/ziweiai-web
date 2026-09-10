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
import { isDisposableEmail } from '@ziweiai/contracts';
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

export function getUserRoles(user: User | null): string[] {
  if (!user) return [];
  const role = user.app_metadata?.role;
  if (Array.isArray(role)) return role;
  if (typeof role === 'string') return [role];
  return [];
}

export function isAdminUser(user: User | null): boolean {
  return getUserRoles(user).includes('admin');
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

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      
      if (data.session) {
        this.session = data.session;
        this.user = data.session.user;
        this.isInitializing = false;
      } else {
        // Tự động tạo phiên ẩn danh nếu không có session
        const { data: anonData, error } = await supabase.auth.signInAnonymously();
        if (!active) return;
        
        if (anonData.session) {
          this.session = anonData.session;
          this.user = anonData.session.user;
        } else {
          this.session = null;
          this.user = null;
          if (error) console.error('Auto anonymous sign-in failed:', error);
        }
        this.isInitializing = false;
      }
    });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      
      if (event === 'SIGNED_OUT') {
        this.session = null;
        this.user = null;
        this.isInitializing = true;
        void supabase.auth.signInAnonymously().catch(console.error);
      } else if (nextSession) {
        this.session = nextSession;
        this.user = nextSession.user;
        this.isInitializing = false;
      }
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

  get roles(): string[] {
    return getUserRoles(this.session?.user ?? null);
  }

  get isAdmin(): boolean {
    return this.roles.includes('admin');
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
    if (isDisposableEmail(email)) {
      throw new Error(
        'Hệ thống không chấp nhận email tạm thời. Vui lòng sử dụng Gmail hoặc đăng nhập Google 1-Click để nhận XU thưởng an toàn.',
      );
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      throw new Error(error.message || 'Tạo tài khoản thất bại. Vui lòng thử lại.');
    }
    return { needsEmailConfirmation: data.session === null };
  }

  /** Nâng cấp tài khoản anonymous lên tài khoản chính thức với email/password, bảo toàn nguyên vẹn user.id, lá số và XU */
  async upgradeAnonymousToPermanentAccount(
    email: string,
    password: string,
  ): Promise<void> {
    if (isDisposableEmail(email)) {
      throw new Error(
        'Hệ thống không chấp nhận email tạm thời. Vui lòng sử dụng email thật để bảo vệ lá số và số dư XU của bạn.',
      );
    }
    const { error } = await supabase.auth.updateUser({ email, password });
    if (error) {
      throw new Error(error.message || 'Nâng cấp tài khoản thất bại. Vui lòng thử lại.');
    }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message || 'Đăng xuất thất bại. Vui lòng thử lại.');
    }
  }
}
