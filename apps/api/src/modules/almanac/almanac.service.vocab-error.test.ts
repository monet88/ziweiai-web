import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type AuthenticatedUser } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import type { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import type { QuotasService } from '../quotas/quotas.service';

// Mock engine: giữ nguyên class lỗi thật, nhưng cho generateAlmanacSelection ném AlmanacVocabError
// (defect dữ liệu nội bộ — Han-gate thiếu mục). Tách file riêng vì vi.mock áp cho toàn file: các test
// khác dùng engine thật nên không thể mock chung.
vi.mock('./almanac-engine', async () => {
  const actual = await vi.importActual<typeof import('./almanac-engine')>('./almanac-engine');
  return {
    ...actual,
    generateAlmanacSelection: vi.fn(() => {
      throw new actual.AlmanacVocabError('Bảng tra Hoàng lịch thiếu bản dịch cho "X".');
    }),
  };
});

const { AlmanacService } = await import('./almanac.service');

describe('AlmanacService — phân loại lỗi từ điển (Han-gate)', () => {
  const originalEnabled = apiEnv.EXTENDED_SYSTEM_ALMANAC_ENABLED;
  const originalFreeForAll = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;
  const user: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };
  let quotasService: Pick<QuotasService, 'assertCanCreateAlmanacSelection'>;
  let providerRouter: Pick<ExplanationProviderRouter, 'generate'>;
  let service: InstanceType<typeof AlmanacService>;

  beforeEach(() => {
    apiEnv.EXTENDED_SYSTEM_ALMANAC_ENABLED = true;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = true;
    quotasService = { assertCanCreateAlmanacSelection: vi.fn().mockResolvedValue(undefined) };
    providerRouter = { generate: vi.fn() };
    service = new AlmanacService(quotasService as QuotasService, providerRouter as ExplanationProviderRouter);
  });

  afterEach(() => {
    apiEnv.EXTENDED_SYSTEM_ALMANAC_ENABLED = originalEnabled;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = originalFreeForAll;
    vi.restoreAllMocks();
  });

  // Bất biến cốt lõi của fix: lỗi từ điển nội bộ KHÔNG bị gộp vào nhánh 400 INVALID_INPUT. Nó propagate
  // nguyên (không phải ApiErrorHttpException) để ApiErrorFilter trả 500 INTERNAL_ERROR — không đổ lỗi
  // cho client, và không gọi LLM vì engine vỡ trước.
  it('để AlmanacVocabError propagate nguyên (không map 400)', async () => {
    await expect(
      service.select(user, '127.0.0.1', 'marriage', '2026-01-01', '2026-01-05'),
    ).rejects.toThrow('Bảng tra Hoàng lịch thiếu bản dịch');

    try {
      await service.select(user, '127.0.0.1', 'marriage', '2026-01-01', '2026-01-05');
      throw new Error('expected vocab error to throw');
    } catch (error) {
      expect(error).not.toBeInstanceOf(ApiErrorHttpException);
    }
    expect(providerRouter.generate).not.toHaveBeenCalled();
  });
});
