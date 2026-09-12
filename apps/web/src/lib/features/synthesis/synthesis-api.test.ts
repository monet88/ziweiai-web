import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchExistingSynthesis, requestGenerateSynthesis } from './synthesis-api';
import { supabase } from '$lib/supabase/supabase-client';

describe('synthesis-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchExistingSynthesis', () => {
    it('returns null if user has no session token', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });
      const res = await fetchExistingSynthesis('test-chart-id');
      expect(res).toBeNull();
    });

    it('fetches and returns synthesis data when authenticated', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: { access_token: 'valid-token' } as any },
        error: null,
      });
      const mockData = { chartId: 'test-chart-id', consensusScore: 88 };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const res = await fetchExistingSynthesis('test-chart-id');
      expect(res).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/synthesis/test-chart-id',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        }),
      );
    });
  });

  describe('requestGenerateSynthesis', () => {
    it('sends POST request and returns synthesis result', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: { access_token: 'valid-token' } as any },
        error: null,
      });
      const mockResult = { chartId: 'uuid', consensusScore: 92 };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      });

      const res = await requestGenerateSynthesis({
        chartId: 'uuid',
        includeBazi: true,
        includeNumerology: true,
        focusAreas: ['career'],
      });

      expect(res).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/synthesis/generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            chartId: 'uuid',
            includeBazi: true,
            includeNumerology: true,
            focusAreas: ['career'],
          }),
        }),
      );
    });

    it('throws error on failure with message', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: { access_token: 'valid-token' } as any },
        error: null,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 402,
        json: async () => ({ message: 'Không đủ XU', code: 'INSUFFICIENT_XU' }),
      });

      await expect(
        requestGenerateSynthesis({
          chartId: 'uuid',
          includeBazi: true,
          includeNumerology: true,
          focusAreas: ['career'],
        }),
      ).rejects.toThrow('Không đủ XU');
    });
  });
});
