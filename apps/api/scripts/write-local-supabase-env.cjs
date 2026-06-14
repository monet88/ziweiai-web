const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const envFile = path.join(repoRoot, '.env');
const supabaseCommand = process.platform === 'win32' ? 'supabase.exe' : 'supabase';

function parseEnvBlock(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && line.includes('='))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        const rawValue = line.slice(separatorIndex + 1);
        const value =
          rawValue.startsWith('"') && rawValue.endsWith('"')
            ? rawValue.slice(1, -1)
            : rawValue;
        return [line.slice(0, separatorIndex), value];
      }),
  );
}

const statusOutput = execFileSync(
  supabaseCommand,
  ['status', '-o', 'env'],
  {
    cwd: packageRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

const statusEnv = parseEnvBlock(statusOutput);
const apiUrl = statusEnv.API_URL;
const anonKey = statusEnv.ANON_KEY;
const serviceRoleKey = statusEnv.SERVICE_ROLE_KEY;
const jwtSecret = statusEnv.JWT_SECRET;

if (!apiUrl || !anonKey || !serviceRoleKey || !jwtSecret) {
  throw new Error('Supabase status output is missing one or more required variables: API_URL, ANON_KEY, SERVICE_ROLE_KEY, JWT_SECRET.');
}

const envContents = [
  '# Generated from apps/api/supabase via `supabase status -o env`.',
  'EXPO_PUBLIC_API_BASE_URL=http://localhost:3000',
  `EXPO_PUBLIC_SUPABASE_URL=${apiUrl}`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`,
  '',
  'API_PORT=3000',
  `SUPABASE_URL=${apiUrl}`,
  `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`,
  `SUPABASE_JWT_SECRET=${jwtSecret}`,
  '',
  '# Optional AI providers',
  'DEEPSEEK_API_KEY=',
  'GEMINI_API_KEY=',
  '',
].join('\n');

fs.writeFileSync(envFile, envContents, 'utf8');
process.stdout.write(`Wrote ${envFile}\n`);
