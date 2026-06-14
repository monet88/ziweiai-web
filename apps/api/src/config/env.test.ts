import fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadWorkspaceEnvFile } from './env';

describe('loadWorkspaceEnvFile', () => {
  const originalLoadEnvFile = process.loadEnvFile;

  afterEach(() => {
    vi.restoreAllMocks();
    process.loadEnvFile = originalLoadEnvFile;
    delete process.env.GEMINI_API_BASE_URL;
    delete process.env.GEMINI_SDK_BASE_URL;
  });

  it('nạp file .env gần nhất khi runtime khởi động từ thư mục package con', () => {
    const loadEnvFile = vi.fn();
    process.loadEnvFile = loadEnvFile;
    vi.spyOn(fs, 'existsSync').mockImplementation((candidate) => String(candidate) === 'F:\\CodeBase\\ziweiai\\.env');

    const envPath = loadWorkspaceEnvFile(['F:\\CodeBase\\ziweiai\\apps\\api']);

    expect(envPath).toBe('F:\\CodeBase\\ziweiai\\.env');
    expect(loadEnvFile).toHaveBeenCalledWith('F:\\CodeBase\\ziweiai\\.env');
  });

  it('trả null khi không tìm thấy .env trong các thư mục cha', () => {
    const loadEnvFile = vi.fn();
    process.loadEnvFile = loadEnvFile;
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    const envPath = loadWorkspaceEnvFile(['F:\\CodeBase\\ziweiai\\apps\\api']);

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
