import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCachedDossier, setCachedDossier, clearCachedDossier } from './dossier-cache';

describe('dossier-cache', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handles empty chartId safely', async () => {
    const result = await getCachedDossier('');
    expect(result).toBeNull();
  });

  it('stores and retrieves cache entry via fallback', async () => {
    const chartId = 'test-chart-cache-123';
    await setCachedDossier(chartId, { userName: 'Đoàn Dự' });

    const cached = await getCachedDossier(chartId);
    expect(cached).not.toBeNull();
    expect(cached?.chartId).toBe(chartId);
    expect(cached?.userName).toBe('Đoàn Dự');
    expect(cached?.version).toBe(1);
  });

  it('clears cache entry properly', async () => {
    const chartId = 'test-chart-cache-delete';
    await setCachedDossier(chartId, { userName: 'Hư Trúc' });

    let cached = await getCachedDossier(chartId);
    expect(cached?.userName).toBe('Hư Trúc');

    await clearCachedDossier(chartId);
    cached = await getCachedDossier(chartId);
    expect(cached).toBeNull();
  });
});
