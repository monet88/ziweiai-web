import { describe, expect, it } from 'vitest';
import { QuotasService } from './quotas.service';
import { MemoryQuotaCounterStore } from './counter-stores/memory';
import { QuotasRegistry } from './quotas.registry';
import { apiEnv } from '../../config/env';

// Mỗi test đi kèm một registry và service riêng để cô lập trạng thái.
function makeService(): { service: QuotasService; registry: QuotasRegistry } {
  const registry = new QuotasRegistry();
  const service = new QuotasService(registry, new MemoryQuotaCounterStore());
  return { service, registry };
}

describe('QuotasService (Rules Engine)', () => {
  it('allows requests while usage stays under configured limits', async () => {
    const { service, registry } = makeService();
    registry.register({
      featureKey: 'chart',
      dailyLimit: apiEnv.API_CHARTS_PER_DAY_PER_USER,
      dailyErrorMessage: 'Daily chart quota exceeded.',
      countSignedInDailyUsage: async () => 0,
    });
    registry.register({
      featureKey: 'explanation',
      dailyLimit: apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER,
      dailyErrorMessage: 'Daily explanation quota exceeded.',
      countSignedInDailyUsage: async () => 0,
    });

    await expect(service.assertCanExecute('chart', 'user-a', '127.0.0.1')).resolves.toBeUndefined();
    await expect(service.assertCanExecute('explanation', 'user-a', '127.0.0.1')).resolves.toBeUndefined();
  });

  it('blocks when daily chart quota is exhausted (signed-in user with custom count)', async () => {
    const { service, registry } = makeService();
    registry.register({
      featureKey: 'chart',
      dailyLimit: 20,
      dailyErrorMessage: 'Daily chart quota exceeded.',
      countSignedInDailyUsage: async () => 20, // DB limit hit
    });

    await expect(service.assertCanExecute('chart', 'user-a', '127.0.0.1')).rejects.toThrow('Daily chart quota exceeded.');
  });

  it('đường anon KHÔNG đếm quota daily theo DB (đếm qua counter store theo IP)', async () => {
    const { service, registry } = makeService();
    registry.register({
      featureKey: 'chart',
      dailyLimit: apiEnv.API_CHARTS_PER_DAY_PER_USER,
      dailyErrorMessage: 'Daily chart quota exceeded.',
      countSignedInDailyUsage: async () => 999, // DB báo đã quá hạn
    });

    // anon bỏ qua nhánh DB → vẫn cho qua vì counter theo IP còn dư.
    await expect(service.assertCanExecute('chart', 'anon-1', '10.0.0.1', true)).resolves.toBeUndefined();
  });

  it('đường anon chặn theo trần daily-per-IP dù userId đổi liên tục (chống reset phiên)', async () => {
    const { service, registry } = makeService();
    registry.register({
      featureKey: 'chart',
      dailyLimit: 20,
      dailyErrorMessage: 'Daily chart quota exceeded.',
      countSignedInDailyUsage: async () => 0,
    });

    // Mỗi lần dùng userId anon mới (mô phỏng xoá localStorage / incognito) nhưng cùng IP.
    for (let i = 0; i < 20; i += 1) {
      await expect(service.assertCanExecute('chart', `anon-${i}`, '10.0.0.2', true)).resolves.toBeUndefined();
    }
    await expect(service.assertCanExecute('chart', 'anon-20', '10.0.0.2', true)).rejects.toThrow(
      'Daily chart quota exceeded.',
    );
  });

  it('user thường vẫn đếm daily theo DB, không dính trần anon-per-IP', async () => {
    const { service, registry } = makeService();
    registry.register({
      featureKey: 'chart',
      dailyLimit: 20,
      dailyErrorMessage: 'Daily chart quota exceeded.',
      countSignedInDailyUsage: async () => 0,
    });

    // isAnonymous=false (mặc định) → đi nhánh DB; DB trả 0 nên luôn qua, không chạm bucket anon.
    for (let i = 0; i < 25; i += 1) {
      await expect(service.assertCanExecute('chart', 'user-stable', '10.0.0.3')).resolves.toBeUndefined();
    }
  });

  describe('assertCanExecute (US-016)', () => {
    it('cho qua khi dưới hạn rồi chặn cho user thường (đếm qua generic counter)', async () => {
      const { service, registry } = makeService();
      registry.register({
        featureKey: 'annual-report',
        dailyLimit: 2, // Limit
        dailyErrorMessage: 'Daily annual report quota exceeded.',
      });

      await expect(service.assertCanExecute('annual-report', 'user-annual', '10.0.1.1')).resolves.toBeUndefined();
      await expect(service.assertCanExecute('annual-report', 'user-annual', '10.0.1.1')).resolves.toBeUndefined();
      await expect(service.assertCanExecute('annual-report', 'user-annual', '10.0.1.1')).rejects.toThrow(
        'Daily annual report quota exceeded.',
      );
    });

    it('anon đếm theo IP: đổi userId vẫn chặn ở lần thứ 3 trên cùng IP (chống reset phiên)', async () => {
      const { service, registry } = makeService();
      registry.register({
        featureKey: 'annual-report',
        dailyLimit: 2,
        dailyErrorMessage: 'Daily annual report quota exceeded.',
      });

      await expect(service.assertCanExecute('annual-report', 'anon-a', '10.0.1.2', true)).resolves.toBeUndefined();
      await expect(service.assertCanExecute('annual-report', 'anon-b', '10.0.1.2', true)).resolves.toBeUndefined();
      await expect(service.assertCanExecute('annual-report', 'anon-c', '10.0.1.2', true)).rejects.toThrow(
        'Daily annual report quota exceeded.',
      );
    });
  });

  describe('anonDailyLimit vs dailyLimit (Tách bạch hạn mức)', () => {
    it('áp dụng anonDailyLimit nghiêm ngặt hơn cho khách ẩn danh, trong khi user đăng nhập dùng dailyLimit', async () => {
      const { service, registry } = makeService();
      registry.register({
        featureKey: 'custom-ai',
        dailyLimit: 10,
        anonDailyLimit: 2,
        dailyErrorMessage: 'Custom AI quota exceeded.',
      });

      // Khách ẩn danh: chỉ được 2 lần
      await expect(service.assertCanExecute('custom-ai', 'anon-1', '192.168.1.1', true)).resolves.toBeUndefined();
      await expect(service.assertCanExecute('custom-ai', 'anon-2', '192.168.1.1', true)).resolves.toBeUndefined();
      await expect(service.assertCanExecute('custom-ai', 'anon-3', '192.168.1.1', true)).rejects.toThrow(
        'Custom AI quota exceeded.',
      );

      // User đã đăng nhập (isAnonymous=false): được tới 10 lần
      for (let i = 0; i < 10; i++) {
        await expect(service.assertCanExecute('custom-ai', 'user-vip', '192.168.1.100', false)).resolves.toBeUndefined();
      }
      await expect(service.assertCanExecute('custom-ai', 'user-vip', '192.168.1.100', false)).rejects.toThrow(
        'Custom AI quota exceeded.',
      );
    });

    it('chuẩn hóa prefix key cho tính năng ẩn danh mở rộng (anon:featureKey)', async () => {
      const { service, registry } = makeService();
      registry.register({
        featureKey: 'tarot-draw',
        dailyLimit: 3,
        dailyErrorMessage: 'Tarot quota exceeded.',
      });

      await expect(service.assertCanExecute('tarot-draw', 'anon-x', '10.0.99.1', true)).resolves.toBeUndefined();
      await expect(service.assertCanExecute('tarot-draw', 'anon-x', '10.0.99.1', true)).resolves.toBeUndefined();
      await expect(service.assertCanExecute('tarot-draw', 'anon-x', '10.0.99.1', true)).resolves.toBeUndefined();
      await expect(service.assertCanExecute('tarot-draw', 'anon-x', '10.0.99.1', true)).rejects.toThrow(
        'Tarot quota exceeded.',
      );
    });
  });

  describe('Unknown features', () => {
    it('throws error if rule not registered', async () => {
      const { service } = makeService();
      await expect(service.assertCanExecute('unknown', 'user-x', '10.0.0.1')).rejects.toThrow(
        'Unknown quota feature: unknown',
      );
    });
  });
});

