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
      if (!active) {
        return;
      }
      if (data.session) {
        this.session = data.session;
        this.user = data.session.user;
        this.isInitializing = false;
        return;
      }
      // Chưa có phiên → cấp danh tính ẩn danh (decision 0009): khách lập/xem lá số
      // không cần đăng nhập, vẫn có JWT thật → contract Bearer + ownership không đổi.
      // Nếu anonymous sign-in chưa bật / lỗi mạng thì vẫn tắt cờ initializing để UI
      // không treo (layout hiện trạng thái fallback thay vì màn chờ vô hạn).
      try {
        const { data: anonData, error } = await supabase.auth.signInAnonymously();
        if (!active) {
          return;
        }
        // Chỉ gán khi CHƯA có session: signInAnonymously() thành công cũng fire
        // onAuthStateChange('SIGNED_IN'). Nếu trong lúc anon đang bay mà một phiên thật
        // (email) đã được set qua handler → this.session !== null → KHÔNG ghi đè bằng anon
        // (tránh race nuốt mất phiên thật). Lỗi anon → giữ session null, chỉ tắt cờ.
        if (this.session === null) {
          const anonSession = error ? null : (anonData.session ?? null);
          this.session = anonSession;
          this.user = anonSession?.user ?? null;
        }
        this.isInitializing = false;
      } catch {
        if (!active) {
          return;
        }
        this.isInitializing = false;
      }
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
    return this.session?.user.is_anonymous === true;
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
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
