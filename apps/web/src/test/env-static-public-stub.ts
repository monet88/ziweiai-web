// Stub cho virtual module $env/static/public khi chạy vitest (SvelteKit chỉ cấp module
// này lúc build/dev thật). Giá trị giả lập cho unit test — KHÔNG phải secret, chỉ là
// PUBLIC_* placeholder để env.ts qua được requireEnv mà không cần dev server.
export const PUBLIC_API_BASE_URL = 'http://localhost:3000';
export const PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
export const PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
