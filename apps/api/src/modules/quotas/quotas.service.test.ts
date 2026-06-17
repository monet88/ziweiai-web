import { describe, expect, it } from 'vitest';
import { QuotasService } from './quotas.service';

describe('QuotasService', () => {
  it('allows requests while usage stays under configured limits', async () => {
    const service = new QuotasService({
      countChartSnapshotsSince: async () => 0,
      countExplanationRequestsSince: async () => 0,
    } as never);

    await expect(service.assertCanCreateChart('user-a', '127.0.0.1')).resolves.toBeUndefined();
    await expect(service.assertCanCreateExplanation('user-a', '127.0.0.1')).resolves.toBeUndefined();
  });

  it('blocks when daily chart quota is exhausted', async () => {
    const service = new QuotasService({
      countChartSnapshotsSince: async () => 20,
      countExplanationRequestsSince: async () => 0,
    } as never);

    await expect(service.assertCanCreateChart('user-a', '127.0.0.1')).rejects.toThrow('Daily chart quota exceeded.');
  });

  it('đường anon KHÔNG đếm quota daily theo DB (đếm in-memory theo IP)', async () => {
    // DB báo đã quá hạn theo userId, nhưng anon bỏ qua nhánh DB → vẫn cho qua vì IP còn dư.
    const service = new QuotasService({
      countChartSnapshotsSince: async () => 999,
      countExplanationRequestsSince: async () => 999,
    } as never);

    await expect(service.assertCanCreateChart('anon-1', '10.0.0.1', true)).resolves.toBeUndefined();
    await expect(service.assertCanCreateExplanation('anon-1', '10.0.0.1', true)).resolves.toBeUndefined();
  });

  it('đường anon chặn theo trần daily-per-IP dù userId đổi liên tục (chống reset phiên)', async () => {
    const service = new QuotasService({
      countChartSnapshotsSince: async () => 0,
      countExplanationRequestsSince: async () => 0,
    } as never);

    // Mỗi lần dùng userId anon mới (mô phỏng xoá localStorage / incognito) nhưng cùng IP.
    // Trần API_CHARTS_PER_DAY_PER_USER mặc định = 20 → lần thứ 21 trên cùng IP bị chặn.
    for (let i = 0; i < 20; i += 1) {
      await expect(service.assertCanCreateChart(`anon-${i}`, '10.0.0.2', true)).resolves.toBeUndefined();
    }
    await expect(service.assertCanCreateChart('anon-21', '10.0.0.2', true)).rejects.toThrow(
      'Daily chart quota exceeded.',
    );
  });

  it('user thường vẫn đếm daily theo DB, không dính trần anon-per-IP', async () => {
    const service = new QuotasService({
      countChartSnapshotsSince: async () => 0,
      countExplanationRequestsSince: async () => 0,
    } as never);

    // isAnonymous=false (mặc định) → đi nhánh DB; DB trả 0 nên luôn qua, không chạm bucket anon.
    for (let i = 0; i < 25; i += 1) {
      await expect(service.assertCanCreateChart('user-stable', '10.0.0.3')).resolves.toBeUndefined();
    }
  });
});
