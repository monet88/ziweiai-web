/**
 * Supabase browser client (client-only, lưu session ở localStorage).
 *
 * Bất biến token tươi (invariants.md §3): autoRefreshToken bật + persistSession để
 * tránh 401 ngầm khi session dài. Chỉ dùng anon key (public theo thiết kế Supabase),
 * KHÔNG bao giờ service role key ở client.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$lib/env';

export const supabase: SupabaseClient = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
