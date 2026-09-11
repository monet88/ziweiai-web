import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import type { ChartSnapshot } from '@ziweiai/contracts';
import RoyalBaziPosterModal from './RoyalBaziPosterModal.svelte';

const createMockBaziSnapshot = (): ChartSnapshot => {
  const makePillar = (slot: 'year' | 'month' | 'day' | 'hour') => ({
    slot,
    heavenlyStemKey: slot === 'day' ? ('bingHeavenly' as const) : ('gengHeavenly' as const),
    earthlyBranchKey: 'wuEarthly' as const,
    heavenlyStemElementKey: slot === 'day' ? ('fire' as const) : ('metal' as const),
    earthlyBranchElementKey: 'fire' as const,
    heavenlyStemTenGodKey: slot === 'day' ? ('companion' as const) : ('directOfficer' as const),
    earthlyBranchTenGodKeys: ['companion' as const],
    hiddenStems: [
      {
        heavenlyStemKey: 'dingHeavenly' as const,
        elementKey: 'fire' as const,
        tenGodKey: 'robWealth' as const,
      },
    ],
    naYin: 'Lộ Bàng Thổ',
  });

  const stemBranch = {
    heavenlyStemKey: 'jiaHeavenly' as const,
    earthlyBranchKey: 'ziEarthly' as const,
    naYin: 'Hải Trung Kim',
  };

  return {
    birth: {
      resolvedDateTime: {
        date: { year: 1990, month: 9, day: 20 },
        time: { hour: 11, minute: 30 },
      },
      originalInput: {
        sexOrGenderForChart: 'male',
      },
    },
    summary: {
      solarDate: '20/09/1990',
      lunarDate: '一九九〇年八月二十', // Raw Chinese string that must be sanitized
    },
    bazi: {
      dayMasterHeavenlyStemKey: 'bingHeavenly',
      pillars: [
        makePillar('year'),
        makePillar('month'),
        makePillar('day'),
        makePillar('hour'),
      ],
      taiYuan: stemBranch,
      taiXi: stemBranch,
      mingGong: stemBranch,
      shenGong: stemBranch,
    },
    pillars: [],
    palaces: [],
  } as unknown as ChartSnapshot;
};

describe('RoyalBaziPosterModal', () => {
  it('renders modal toolbar with title and High-DPI badge', () => {
    const snapshot = createMockBaziSnapshot();
    render(RoyalBaziPosterModal, {
      props: {
        snapshot,
        chartId: 'ea569e7d-122c-49e3-b6f3-449db42debb0',
        userName: 'galaxypro710',
        onClose: vi.fn(),
      },
    });

    expect(screen.getByText(/Xuất Ảnh Bát Tự Hoàng Gia/i)).toBeInTheDocument();
    expect(screen.getByText(/High-DPI 2x Retina/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Chia sẻ lá số trực tiếp qua mạng xã hội/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Tải ảnh PNG chất lượng in ấn/i)).toBeInTheDocument();
  });

  it('renders full royal bazi poster with 4 pillars, day master and sanitized lunar date', () => {
    const snapshot = createMockBaziSnapshot();
    const { container } = render(RoyalBaziPosterModal, {
      props: {
        snapshot,
        chartId: 'ea569e7d-122c-49e3-b6f3-449db42debb0',
        userName: 'galaxypro710',
        onClose: vi.fn(),
      },
    });

    // Header & User Name
    expect(screen.getByText(/BẢN ĐỒ MỆNH LÝ BÁT TỰ HOÀNG GIA/i)).toBeInTheDocument();
    expect(screen.getByText('galaxypro710')).toBeInTheDocument();

    // Four pillars section
    expect(screen.getByText(/ĐỒ HÌNH TỨ TRỤ TIÊN THIÊN/i)).toBeInTheDocument();
    expect(screen.getByText('NHẬT CHỦ')).toBeInTheDocument();

    // Security Code
    expect(screen.getByText('VIOS-BAZI-EA569E7D')).toBeInTheDocument();

    // Lunar date sanitization check: NO raw Chinese Han characters
    const html = container.innerHTML;
    expect(html).not.toContain('一九九〇年');
    expect(html).toContain('20/08/1990 Canh Ngọ');
  });

  it('invokes onClose when clicking the close button', async () => {
    const snapshot = createMockBaziSnapshot();
    const onClose = vi.fn();
    render(RoyalBaziPosterModal, {
      props: {
        snapshot,
        chartId: 'ea569e7d-122c-49e3-b6f3-449db42debb0',
        userName: 'galaxypro710',
        onClose,
      },
    });

    const closeBtn = screen.getByLabelText(/Đóng/i);
    await fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
