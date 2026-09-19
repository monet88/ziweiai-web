/**
 * Validate biến môi trường PUBLIC_* cho client bundle.
 *
 * Bất biến bảo mật (docs/product/invariants.md §1): chỉ PUBLIC_* được lộ ra client.
 * Tuyệt đối KHÔNG đọc process.env, $env/static/private, hay bất kỳ secret server nào
 * (SUPABASE_SERVICE_ROLE_KEY, *_API_KEY, JWT secret...).
 */
import { env as dynamicEnv } from '$env/dynamic/public';
import {
  PUBLIC_API_BASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_SUPABASE_URL,
} from '$env/static/public';

export interface PublicEnv {
  siteUrl: string;
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  vietqrBankId: string;
  vietqrAccountNo: string;
  vietqrAccountName: string;
}

const DEFAULT_SUPABASE_URL = 'https://uaicvwttnajeglxiorpb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaWN2d3R0bmFqZWdseGlvcnBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MjgxNzIsImV4cCI6MjEwNTE4ODE3Mn0.placeholder';

export const publicEnv = {
  apiBaseUrl: PUBLIC_API_BASE_URL || '/api',
  supabaseUrl: PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
  supabaseAnonKey: PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
};

export const env: PublicEnv = {
  siteUrl: dynamicEnv.PUBLIC_SITE_URL || 'https://ziweiai.vercel.app',
  apiBaseUrl: dynamicEnv.PUBLIC_API_BASE_URL || publicEnv.apiBaseUrl,
  supabaseUrl: dynamicEnv.PUBLIC_SUPABASE_URL || publicEnv.supabaseUrl,
  supabaseAnonKey: dynamicEnv.PUBLIC_SUPABASE_ANON_KEY || publicEnv.supabaseAnonKey,
  vietqrBankId: dynamicEnv.PUBLIC_VIETQR_BANK_ID || 'mb',
  vietqrAccountNo: dynamicEnv.PUBLIC_VIETQR_ACCOUNT_NO || '0123456789',
  vietqrAccountName: dynamicEnv.PUBLIC_VIETQR_ACCOUNT_NAME || 'NGUYEN VAN A',
};
