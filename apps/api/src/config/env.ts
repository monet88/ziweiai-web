import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

function walkUpForEnvFile(startDir: string, fileName = '.env', maxLevels = 8): string | null {
  let currentDir = path.resolve(startDir);

  for (let level = 0; level <= maxLevels; level += 1) {
    const candidate = path.join(currentDir, fileName);
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  return null;
}

export function loadWorkspaceEnvFile(searchRoots: string[] = [process.cwd(), __dirname]): string | null {
  if (typeof process.loadEnvFile !== 'function') {
    return null;
  }

  const visitedRoots = new Set<string>();
  for (const root of searchRoots) {
    const normalizedRoot = path.resolve(root);
    if (visitedRoots.has(normalizedRoot)) {
      continue;
    }
    visitedRoots.add(normalizedRoot);

    const envPath = walkUpForEnvFile(normalizedRoot);
    if (envPath) {
      process.loadEnvFile(envPath);
      return envPath;
    }
  }

  return null;
}

loadWorkspaceEnvFile();

export const apiEnvSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(3000),
  API_SERVICE_NAME: z.string().min(1).default('ziweiai-api'),
  // Mặc định chỉ gồm origin dev/preview của web SvelteKit hiện tại: Vite dev (:5173),
  // Vite preview (:4173) và API tự gọi (:3000). Đã bỏ :8081/:19006 (Metro + Expo web của
  // app cũ — không còn dùng sau khi migrate sang SvelteKit). Khớp với .env.example.
  API_CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:4173,http://localhost:3000'),
  API_REQUESTS_PER_MINUTE_PER_IP: z.coerce.number().int().positive().default(60),
  API_REQUESTS_PER_MINUTE_PER_USER: z.coerce.number().int().positive().default(30),
  API_CHARTS_PER_DAY_PER_USER: z.coerce.number().int().positive().default(20),
  API_EXPLANATIONS_PER_DAY_PER_USER: z.coerce.number().int().positive().default(50),
  AI_PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  // US-016: timeout riêng cho đường báo cáo năm. Báo cáo năm tổng hợp lưu niên + 12 lưu nguyệt
  // (~600-1200 từ) nên thời gian sinh thực tế của LLM thường vượt 15s mặc định (đo deepseek ~18s) →
  // 504 PROVIDER_TIMEOUT, tính năng gần như không dùng được. Cho phép phanh độc lập, mặc định 60s.
  AI_ANNUAL_REPORT_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  // Defaults Supabase CHỈ phục vụ unit test / local holdout (supabase start). Cloud là môi
  // trường primary (decision 0016): phải đặt giá trị thật trong .env root, nếu thiếu backend
  // sẽ boot êm vào endpoint local không tồn tại → lỗi runtime khó hiểu thay vì fail rõ.
  SUPABASE_URL: z.url().default('http://127.0.0.1:54321'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('test-service-role-key'),
  SUPABASE_JWT_SECRET: z.string().min(1).default('test-jwt-secret'),
  DEEPSEEK_API_KEY: z.string().default(''),
  DEEPSEEK_MODEL: z.string().min(1).default('deepseek-v4-pro'),
  OPENAI_COMPAT_API_KEY: z.string().default(''),
  // z.preprocess chuyển '' → undefined: env khai báo nhưng để trống (OPENAI_COMPAT_BASE_URL=)
  // đọc ra chuỗi rỗng, z.url() reject '' và default KHÔNG áp dụng (vì '' ≠ undefined) → crash khởi động.
  OPENAI_COMPAT_BASE_URL: z.preprocess((val) => (val === '' ? undefined : val), z.url().default('https://api.openai.com')),
  OPENAI_COMPAT_MODEL: z.string().min(1).default('gpt-4o-mini'),
  GEMINI_API_KEY: z.string().default(''),
  // z.preprocess gộp fallback GEMINI_API_BASE_URL + chuẩn hoá '' → undefined (env để trống không
  // làm z.url() reject rồi crash); kết quả undefined để .optional() cho qua an toàn.
  GEMINI_SDK_BASE_URL: z.preprocess((value) => {
    const val = value ?? process.env.GEMINI_API_BASE_URL;
    return val === '' ? undefined : val;
  }, z.url().optional()),
  GEMINI_MODEL: z.string().min(1).default('gemini-3.5-flash'),
  // 'auto' dùng thứ tự chain gốc của router: [openai-compat, deepseek, gemini]
  // (openai-compat mặc định, deepseek fallback kế, gemini cuối). Đặt giá trị khác để ép một
  // provider cụ thể lên đầu chain mà vẫn giữ phần còn lại làm fallback.
  AI_DEFAULT_PROVIDER: z.enum(['auto', 'deepseek', 'openai-compat', 'gemini']).default('auto'),
  // z.stringbool (zod v4): "false"/"0"/"no" → false, "true"/"1"/"yes" → true.
  // KHÔNG dùng z.coerce.boolean() — nó chạy Boolean(string) nên mọi chuỗi non-empty
  // (kể cả "false") đều thành true, khiến AI_EXPLANATION_FREE_FOR_ALL=false vô hiệu ở prod.
  AI_EXPLANATION_FREE_FOR_ALL: z.stringbool().default(true),
  AI_CONVERSATION_ENABLED: z.stringbool().default(false),
  // z.preprocess '' → undefined: env khai báo nhưng để trống (VAR=) đọc ra '' khiến
  // z.coerce.number() ép thành 0, fail .positive() → crash khởi động và .default() KHÔNG áp
  // (vì '' ≠ undefined). Chuẩn hoá '' → undefined để default(30)/default(12) áp đúng.
  API_CONVERSATION_MESSAGES_PER_DAY_PER_USER: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().int().positive().default(30),
  ),
  AI_CONVERSATION_BUFFER_MESSAGES: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().int().positive().default(12),
  ),

  // US-017 + B6: feature flags for extended divination systems. US-042: default `true` =
  // fail-OPEN. Mọi hệ thuật số bật sẵn cho user; cờ chỉ còn để TẮT có chủ đích (đặt =false
  // trong .env) cho môi trường đặc thù, không còn dùng để ẩn mặc định. z.stringbool vẫn dùng
  // (z.coerce.boolean() khiến "false" → true, vô hiệu hoá việc tắt thủ công).
  EXTENDED_SYSTEM_HEPAN_ENABLED: z.stringbool().default(true),
  EXTENDED_SYSTEM_MANGPAI_ENABLED: z.stringbool().default(true),
  EXTENDED_SYSTEM_TAROT_ENABLED: z.stringbool().default(true),
  EXTENDED_SYSTEM_MBTI_ENABLED: z.stringbool().default(true),
  EXTENDED_SYSTEM_FACE_ENABLED: z.stringbool().default(true),
  EXTENDED_SYSTEM_PALM_ENABLED: z.stringbool().default(true),
  EXTENDED_SYSTEM_LENORMAND_ENABLED: z.stringbool().default(true),
  EXTENDED_SYSTEM_DREAM_ENABLED: z.stringbool().default(true),
  EXTENDED_SYSTEM_STICKS_ENABLED: z.stringbool().default(true),
  EXTENDED_SYSTEM_ALMANAC_ENABLED: z.stringbool().default(true),

  // Separate daily quota for vision (face/palm) — vision is much more expensive
  API_VISION_REQUESTS_PER_DAY_PER_USER: z.coerce.number().int().positive().default(5),

  // US-016: cờ riêng cho đường báo cáo năm (LLM tổng hợp lưu niên + 12 lưu nguyệt) — tốn token
  // gấp ~3-5 lần một explanation nên cần phanh độc lập với AI_EXPLANATION_FREE_FOR_ALL. Mặc định
  // `false` (fail-closed): bật lên mới sinh báo cáo mới được. Dùng z.stringbool cùng lý do ở trên
  // (z.coerce.boolean() khiến "false" → true). Annual gate fail-closed cả hai cờ: một on một off → 402.
  AI_ANNUAL_REPORT_ENABLED: z.stringbool().default(false),
  // US-016: quota riêng cho báo cáo năm, KHÔNG dùng chung API_EXPLANATIONS_PER_DAY_PER_USER.
  // Số thấp (mặc định 2/ngày/user) vì mỗi báo cáo đốt token đáng kể.
  API_ANNUAL_REPORTS_PER_DAY_PER_USER: z.coerce.number().int().positive().default(2),
  // US-013: bền hoá quota anon daily-per-IP qua store chia sẻ (thay Map in-memory).
  // memory = dev/test (default, không cần dependency ngoài); upstash = REST qua fetch (prod);
  // redis = giữ enum mở, chưa triển khai (factory ném khi chọn). Validate giá trị URL/token
  // cho driver thật ở resolve-time (factory) để default `memory` không cần env mới.
  QUOTA_STORE_DRIVER: z.enum(['memory', 'redis', 'upstash']).default('memory'),
  QUOTA_REDIS_URL: z.string().optional(),
  // z.preprocess '' → undefined: env optional thường để trống (QUOTA_UPSTASH_REST_URL=), chuỗi rỗng
  // không qua z.url() dù có .optional() → crash khởi động. Chỉ áp khi driver=upstash mới cần URL thật.
  QUOTA_UPSTASH_REST_URL: z.preprocess((val) => (val === '' ? undefined : val), z.url().optional()),
  QUOTA_UPSTASH_REST_TOKEN: z.string().optional(),
  // Khi store ngoài mất kết nối: open = cho qua + log warn (mặc định, ưu tiên ổn định —
  // quota là chống lạm dụng, không phải hàng rào bảo mật); closed = chặn (ném quota error).
  QUOTA_FAIL_MODE: z.enum(['open', 'closed']).default('open'),
  npm_package_version: z.string().min(1).optional(),
});

export const apiEnv = apiEnvSchema.parse(process.env);

export const apiVersion = apiEnv.npm_package_version ?? '0.1.0';

export const allowedCorsOrigins = apiEnv.API_CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
