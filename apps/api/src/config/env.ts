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
  API_CORS_ORIGINS: z
    .string()
    .default(
      'http://localhost:8081,http://localhost:19006,http://localhost:3000,http://localhost:5173,http://localhost:4173',
    ),
  API_REQUESTS_PER_MINUTE_PER_IP: z.coerce.number().int().positive().default(60),
  API_REQUESTS_PER_MINUTE_PER_USER: z.coerce.number().int().positive().default(30),
  API_CHARTS_PER_DAY_PER_USER: z.coerce.number().int().positive().default(20),
  API_EXPLANATIONS_PER_DAY_PER_USER: z.coerce.number().int().positive().default(50),
  AI_PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  SUPABASE_URL: z.url().default('http://127.0.0.1:54321'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('test-service-role-key'),
  SUPABASE_JWT_SECRET: z.string().min(1).default('test-jwt-secret'),
  DEEPSEEK_API_KEY: z.string().default(''),
  DEEPSEEK_MODEL: z.string().min(1).default('deepseek-v4-pro'),
  OPENAI_COMPAT_API_KEY: z.string().default(''),
  OPENAI_COMPAT_BASE_URL: z.string().url().default('https://api.openai.com'),
  OPENAI_COMPAT_MODEL: z.string().min(1).default('gpt-4o-mini'),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_SDK_BASE_URL: z.preprocess((value) => value ?? process.env.GEMINI_API_BASE_URL, z.string().url().optional()),
  GEMINI_MODEL: z.string().min(1).default('gemini-3.5-flash'),
  AI_DEFAULT_PROVIDER: z.enum(['auto', 'deepseek', 'openai-compat', 'gemini']).default('auto'),
  // z.stringbool (zod v4): "false"/"0"/"no" → false, "true"/"1"/"yes" → true.
  // KHÔNG dùng z.coerce.boolean() — nó chạy Boolean(string) nên mọi chuỗi non-empty
  // (kể cả "false") đều thành true, khiến AI_EXPLANATION_FREE_FOR_ALL=false vô hiệu ở prod.
  AI_EXPLANATION_FREE_FOR_ALL: z.stringbool().default(true),

  // US-017: 6 feature flags for extended divination systems (default false = disabled)
  EXTENDED_SYSTEM_HEPAN_ENABLED: z.stringbool().default(false),
  EXTENDED_SYSTEM_MANGPAI_ENABLED: z.stringbool().default(false),
  EXTENDED_SYSTEM_TAROT_ENABLED: z.stringbool().default(false),
  EXTENDED_SYSTEM_MBTI_ENABLED: z.stringbool().default(false),
  EXTENDED_SYSTEM_FACE_ENABLED: z.stringbool().default(false),
  EXTENDED_SYSTEM_PALM_ENABLED: z.stringbool().default(false),

  // Separate daily quota for vision (face/palm) — vision is much more expensive
  API_VISION_REQUESTS_PER_DAY_PER_USER: z.coerce.number().int().positive().default(5),

  npm_package_version: z.string().min(1).optional(),
});

export const apiEnv = apiEnvSchema.parse(process.env);

export const apiVersion = apiEnv.npm_package_version ?? '0.1.0';

export const allowedCorsOrigins = apiEnv.API_CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
