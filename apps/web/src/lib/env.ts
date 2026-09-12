/**
 * Validate biến môi trường PUBLIC_* cho client bundle.
 *
 * Bất biến bảo mật (docs/product/invariants.md §1): chỉ PUBLIC_* được lộ ra client.
 * Tuyệt đối KHÔNG đọc process.env, $env/static/private, hay bất kỳ secret server nào
 * (SUPABASE_SERVICE_ROLE_KEY, *_API_KEY, JWT secret...).
 */
import { env as dynamicEnv } from '$env/dynamic/public';

export interface PublicEnv {
  siteUrl: string;
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  vietqrBankId: string;
  vietqrAccountNo: string;
  vietqrAccountName: string;
}

const DEFAULT_SUPABASE_URL = 'https://nachzhkeuzwiqmbtelrp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2h6aGtldXp3aXFtYnRlbHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0ODE3NzAsImV4cCI6MjEwMDA1Nzc3MH0.b4Lt8IgkbxfurLKiApuwEOCBMsihV6_0Rn8EiMNL_mc';

export const env: PublicEnv = {
  siteUrl: dynamicEnv.PUBLIC_SITE_URL || 'https://tuvitoantap.online',
  apiBaseUrl: dynamicEnv.PUBLIC_API_BASE_URL || '/api',
  supabaseUrl: dynamicEnv.PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
  supabaseAnonKey: dynamicEnv.PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
  vietqrBankId: dynamicEnv.PUBLIC_VIETQR_BANK_ID || 'mb',
  vietqrAccountNo: dynamicEnv.PUBLIC_VIETQR_ACCOUNT_NO || '0123456789',
  vietqrAccountName: dynamicEnv.PUBLIC_VIETQR_ACCOUNT_NAME || 'NGUYEN VAN A',
};
