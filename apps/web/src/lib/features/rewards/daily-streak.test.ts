import { describe, it, expect } from 'vitest';
import { paywallStore } from '$lib/stores/paywall.svelte';

describe('Daily Check-in Streak & Rewards Logic', () => {
  const streakDays = [
    { day: 1, reward: 5, label: 'Ngày 1' },
    { day: 2, reward: 5, label: 'Ngày 2' },
    { day: 3, reward: 5, label: 'Ngày 3' },
    { day: 4, reward: 5, label: 'Ngày 4' },
    { day: 5, reward: 5, label: 'Ngày 5' },
    { day: 6, reward: 5, label: 'Ngày 6' },
    { day: 7, reward: 10, label: 'Ngày 7', jackpot: true }
  ];

  it('has 7 streak days with day 7 designated as jackpot (10 XU)', () => {
    expect(streakDays.length).toBe(7);
    expect(streakDays[0].reward).toBe(5);
    expect(streakDays[5].reward).toBe(5);
    expect(streakDays[6].reward).toBe(10);
    expect(streakDays[6].jackpot).toBe(true);
  });

  it('calculates cycle rewards correctly', () => {
    const totalWeeklyReward = streakDays.reduce((acc, d) => acc + d.reward, 0);
    expect(totalWeeklyReward).toBe(40); // 5*6 + 10 = 40 XU
  });

  it('updates paywallStore with rich options for One-Click Topup Modal', () => {
    paywallStore.close();
    expect(paywallStore.isOpen).toBe(false);

    paywallStore.open({
      message: 'Thiếu XU mở khóa',
      featureName: 'Hợp Hôn So Mệnh',
      requiredXu: 50,
      suggestedPackageXu: 50,
    });

    expect(paywallStore.isOpen).toBe(true);
    expect(paywallStore.featureName).toBe('Hợp Hôn So Mệnh');
    expect(paywallStore.requiredXu).toBe(50);
    expect(paywallStore.suggestedPackageXu).toBe(50);

    paywallStore.close();
    expect(paywallStore.isOpen).toBe(false);
  });
});
