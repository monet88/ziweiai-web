import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadWorkspaceEnvFile } from './env';

describe('loadWorkspaceEnvFile', () => {
  const originalLoadEnvFile = process.loadEnvFile;

  // Build paths through `path` so the test is OS-portable: the function walks up via
  // path.dirname/path.join, which use POSIX separators on Linux CI and `\` on Windows.
  // Hardcoded `F:\...` literals only resolved correctly on Windows and broke under CI.
  const repoRoot = path.resolve(path.sep === '\\' ? 'F:\\CodeBase\\ziweiai' : '/tmp/ziweiai');
  const apiDir = path.join(repoRoot, 'apps', 'api');
  const rootEnvFile = path.join(repoRoot, '.env');

  afterEach(() => {
    vi.restoreAllMocks();
    process.loadEnvFile = originalLoadEnvFile;
    delete process.env.GEMINI_API_BASE_URL;
    delete process.env.GEMINI_SDK_BASE_URL;
  });

  it('nạp file .env gần nhất khi runtime khởi động từ thư mục package con', () => {
    const loadEnvFile = vi.fn();
    process.loadEnvFile = loadEnvFile;
    vi.spyOn(fs, 'existsSync').mockImplementation((candidate) => String(candidate) === rootEnvFile);

    const envPath = loadWorkspaceEnvFile([apiDir]);

    expect(envPath).toBe(rootEnvFile);
    expect(loadEnvFile).toHaveBeenCalledWith(rootEnvFile);
  });

  it('trả null khi không tìm thấy .env trong các thư mục cha', () => {
    const loadEnvFile = vi.fn();
    process.loadEnvFile = loadEnvFile;
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    const envPath = loadWorkspaceEnvFile([apiDir]);

    expect(envPath).toBeNull();
    expect(loadEnvFile).not.toHaveBeenCalled();
  });

  it('fallback từ GEMINI_API_BASE_URL legacy sang GEMINI_SDK_BASE_URL khi parse env', async () => {
    process.loadEnvFile = undefined;
    process.env.GEMINI_API_BASE_URL = 'https://legacy-gemini.example.com';
    delete process.env.GEMINI_SDK_BASE_URL;

    vi.resetModules();
    const { apiEnv } = await import('./env');

    expect(apiEnv.GEMINI_SDK_BASE_URL).toBe('https://legacy-gemini.example.com');
  });
});
