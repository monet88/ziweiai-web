import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { apiEnv } from '../config/env';

// DI token cho SupabaseClient (service-role). Tách khỏi gateway để seam nằm ở ranh giới DI thay vì
// trong constructor: test có thể cấp client thay thế qua token này, gateway không tự `createClient`.
export const SUPABASE_CLIENT = Symbol('SUPABASE_CLIENT');

// Factory dựng service-role client (autoRefresh/persistSession tắt — server-side, không có phiên).
// Giữ nguyên cấu hình cũ của gateway để hành vi runtime không đổi.
export function createSupabaseServiceRoleClient(): SupabaseClient {
  return createClient(apiEnv.SUPABASE_URL, apiEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
