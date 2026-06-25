import { describe, expect, it } from 'vitest';
import { QuotasService } from './quotas.service';
import { MemoryQuotaCounterStore } from './counter-stores/memory';

type PersistenceStub = {
  countChartSnapshotsSince?: () => Promise<number>;
  countExplanationRequestsSince?: () => Promise<number>;
  countConversationUserMessagesSince?: () => Promise<number>;
};

// Mỗi service mới đi kèm một MemoryQuotaCounterStore mới (cô lập trạng thái đếm giữa các test).
function makeService(persistence: PersistenceStub): QuotasService {
  return new QuotasService(persistence as never, new MemoryQuotaCounterStore());
}

describe('QuotasService', () => {
  it('allows requests while usage stays under configured limits', async () => {
    const service = makeService({
      countChartSnapshotsSince: async () => 0,
      countExplanationRequestsSince: async () => 0,
      countConversationUserMessagesSince: async () => 0,
    });

    await expect(service.assertCanCreateChart('user-a', '127.0.0.1')).resolves.toBeUndefined();
    await expect(service.assertCanCreateExplanation('user-a', '127.0.0.1')).resolves.toBeUndefined();
  });

  it('blocks when daily chart quota is exhausted', async () => {
    const service = makeService({
      countChartSnapshotsSince: async () => 20,
      countExplanationRequestsSince: async () => 0,
    });

    await expect(service.assertCanCreateChart('user-a', '127.0.0.1')).rejects.toThrow('Daily chart quota exceeded.');
  });

  it('đường anon KHÔNG đếm quota daily theo DB (đếm qua counter store theo IP)', async () => {
    // DB báo đã quá hạn theo userId, nhưng anon bỏ qua nhánh DB → vẫn cho qua vì IP còn dư.
    const service = makeService({
      countChartSnapshotsSince: async () => 999,
      countExplanationRequestsSince: async () => 999,
    });

    await expect(service.assertCanCreateChart('anon-1', '10.0.0.1', true)).resolves.toBeUndefined();
    await expect(service.assertCanCreateExplanation('anon-1', '10.0.0.1', true)).resolves.toBeUndefined();
  });

  it('đường anon chặn theo trần daily-per-IP dù userId đổi liên tục (chống reset phiên)', async () => {
    const service = makeService({
      countChartSnapshotsSince: async () => 0,
      countExplanationRequestsSince: async () => 0,
    });

    // Mỗi lần dùng userId anon mới (mô phỏng xoá localStorage / incognito) nhưng cùng IP.
    // Trần API_CHARTS_PER_DAY_PER_USER mặc định = 20 → lần thứ 21 trên cùng IP bị chặn.
    for (let i = 0; i < 20; i += 1) {
      await expect(service.assertCanCreateChart(`anon-${i}`, '10.0.0.2', true)).resolves.toBeUndefined();
    }
    await expect(service.assertCanCreateChart('anon-20', '10.0.0.2', true)).rejects.toThrow(
      'Daily chart quota exceeded.',
    );
  });

  it('user thường vẫn đếm daily theo DB, không dính trần anon-per-IP', async () => {
    const service = makeService({
      countChartSnapshotsSince: async () => 0,
      countExplanationRequestsSince: async () => 0,
    });

    // isAnonymous=false (mặc định) → đi nhánh DB; DB trả 0 nên luôn qua, không chạm bucket anon.
    for (let i = 0; i < 25; i += 1) {
      await expect(service.assertCanCreateChart('user-stable', '10.0.0.3')).resolves.toBeUndefined();
    }
  });

  describe('assertCanCreateAnnualReport (US-016)', () => {
    it('cho qua khi dưới hạn (mặc định 2/ngày) rồi chặn ở lần thứ 3 cho user thường', async () => {
      const service = makeService({
        countChartSnapshotsSince: async () => 0,
        countExplanationRequestsSince: async () => 0,
      });

      await expect(service.assertCanCreateAnnualReport('user-annual', '10.0.1.1')).resolves.toBeUndefined();
      await expect(service.assertCanCreateAnnualReport('user-annual', '10.0.1.1')).resolves.toBeUndefined();
      await expect(service.assertCanCreateAnnualReport('user-annual', '10.0.1.1')).rejects.toThrow(
        'Daily annual report quota exceeded.',
      );
    });

    it('anon đếm theo IP: đổi userId vẫn chặn ở lần thứ 3 trên cùng IP (chống reset phiên)', async () => {
      const service = makeService({
        countChartSnapshotsSince: async () => 0,
        countExplanationRequestsSince: async () => 0,
      });

      await expect(service.assertCanCreateAnnualReport('anon-a', '10.0.1.2', true)).resolves.toBeUndefined();
      await expect(service.assertCanCreateAnnualReport('anon-b', '10.0.1.2', true)).resolves.toBeUndefined();
      await expect(service.assertCanCreateAnnualReport('anon-c', '10.0.1.2', true)).rejects.toThrow(
        'Daily annual report quota exceeded.',
      );
    });

    it('quota annual độc lập với quota explanations (user thường, key tách biệt)', async () => {
      const service = makeService({
        countChartSnapshotsSince: async () => 0,
        // DB báo explanations đã đầy, nhưng annual đếm qua counter store riêng → vẫn cho qua.
        countExplanationRequestsSince: async () => 999,
      });

      await expect(service.assertCanCreateAnnualReport('user-iso', '10.0.1.3')).resolves.toBeUndefined();
    });
  });

  describe('assertCanCreateVisionAnalysis (US-017e/f)', () => {
    it('cho qua khi dưới trần vision (mặc định 5/ngày) rồi chặn ở lần thứ 6 theo userId', async () => {
      const service = makeService({
        countChartSnapshotsSince: async () => 0,
        countExplanationRequestsSince: async () => 0,
      });

      for (let i = 0; i < 5; i += 1) {
        await expect(service.assertCanCreateVisionAnalysis('user-vision', '10.0.2.1')).resolves.toBeUndefined();
      }
      await expect(service.assertCanCreateVisionAnalysis('user-vision', '10.0.2.1')).rejects.toThrow(
        'Daily vision quota exceeded.',
      );
    });

    it('quota vision độc lập với quota explanations (key tách biệt)', async () => {
      const service = makeService({
        countChartSnapshotsSince: async () => 0,
        // DB báo explanations đã đầy, nhưng vision đếm qua counter store riêng → vẫn cho qua.
        countExplanationRequestsSince: async () => 999,
      });

      await expect(service.assertCanCreateVisionAnalysis('user-vision-iso', '10.0.2.2')).resolves.toBeUndefined();
    });
  });

  describe('assertCanCreateConversationMessage (US-018)', () => {
    it('cho qua khi dưới trần (mặc định 30) cho user thường', async () => {
      const service = makeService({
        countConversationUserMessagesSince: async () => 29,
      });

      await expect(service.assertCanCreateConversationMessage('user-conv', '10.0.3.1')).resolves.toBeUndefined();
    });

    it('chặn khi vượt quá trần cho user thường', async () => {
      const service = makeService({
        countConversationUserMessagesSince: async () => 30,
      });

      await expect(service.assertCanCreateConversationMessage('user-conv', '10.0.3.1')).rejects.toThrow(
        'Daily conversation quota exceeded.',
      );
    });

    it('anon đếm qua IP: bỏ qua nhánh DB, chặn ở lần thứ 31 trên cùng IP', async () => {
      const service = makeService({
        countConversationUserMessagesSince: async () => 999, // DB báo rất nhiều nhưng anon bỏ qua
      });

      for (let i = 0; i < 30; i += 1) {
        await expect(service.assertCanCreateConversationMessage(`anon-${i}`, '10.0.3.2', true)).resolves.toBeUndefined();
      }
      await expect(service.assertCanCreateConversationMessage('anon-30', '10.0.3.2', true)).rejects.toThrow(
        'Daily conversation quota exceeded.',
      );
    });
  });
});
