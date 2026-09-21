import { describe, expect, it } from 'vitest';
import { resolveVipPromotion } from './vip-tier';

describe('resolveVipPromotion', () => {
  it('qualifies 1000 XU (B2B pack 790k) as B2B Thượng Khách VIP', () => {
    const promo = resolveVipPromotion(1000);
    expect(promo.isVip).toBe(true);
    expect(promo.vipTitle).toContain('B2B');
    expect(promo.vipBadge).toContain('B2B');
    expect(promo.vipDescription).toBeDefined();
  });

  it('qualifies 600 XU (VIP pack 500k) as Đại Thần VIP', () => {
    const promo = resolveVipPromotion(600);
    expect(promo.isVip).toBe(true);
    expect(promo.vipTitle).toContain('Đại Thần');
  });

  it('qualifies 100 XU (Combo Bính Ngọ 2026 - 79k) as VIP', () => {
    const promo = resolveVipPromotion(100);
    expect(promo.isVip).toBe(true);
    expect(promo.vipTitle).toContain('Bính Ngọ 2026');
  });

  it('does NOT qualify normal small topups (< 100 XU or non-qualifying)', () => {
    expect(resolveVipPromotion(10).isVip).toBe(false);
    expect(resolveVipPromotion(20).isVip).toBe(false);
    expect(resolveVipPromotion(50).isVip).toBe(false);
    expect(resolveVipPromotion(120).isVip).toBe(false);
  });
});
