/**
 * Validate biến môi trường PUBLIC_* cho client bundle.
 *
 * Bất biến bảo mật (docs/product/invariants.md §1): chỉ PUBLIC_* được lộ ra client.
 * Tuyệt đối KHÔNG đọc process.env, $env/static/private, hay bất kỳ secret server nào
 * (SUPABASE_SERVICE_ROLE_KEY, *_API_KEY, JWT secret...).
 */
import {
  PUBLIC_API_BASE_URL,
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from '$env/static/public';

export interface PublicEnv {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

function requireEnv(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `[env] Thiếu biến môi trường bắt buộc: ${name}. ` +
        `Khai báo trong apps/web/.env (chỉ dùng PUBLIC_* cho client).`,
    );
  }
  return value;
}

export const env: PublicEnv = {
  apiBaseUrl: requireEnv('PUBLIC_API_BASE_URL', PUBLIC_API_BASE_URL),
  supabaseUrl: requireEnv('PUBLIC_SUPABASE_URL', PUBLIC_SUPABASE_URL),
  supabaseAnonKey: requireEnv('PUBLIC_SUPABASE_ANON_KEY', PUBLIC_SUPABASE_ANON_KEY),
};
