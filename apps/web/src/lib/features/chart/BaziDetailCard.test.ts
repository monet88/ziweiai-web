import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { ChartDetailResponse } from '@ziweiai/contracts';
import BaziDetailCard from './BaziDetailCard.svelte';

const createMockBaziSnapshot = (): ChartDetailResponse['snapshot'] => {
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
    solarDate: '1990-09-15',
    lunarDate: 'Canh Ngọ',
    gender: 'male',
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
  } as unknown as ChartDetailResponse['snapshot'];
};

describe('BaziDetailCard', () => {
  it('renders royal four pillars board when snapshot has bazi data', () => {
    const snapshot = createMockBaziSnapshot();
    render(BaziDetailCard, { props: { snapshot } });

    // Kiểm tra các tiêu đề chính của Đồ hình Hoàng Gia
    expect(screen.getByText(/ĐỒ HÌNH BÁT TỰ TỨ TRỤ TIÊN THIÊN/i)).toBeInTheDocument();
    expect(screen.getByText(/NHẬT CHỦ BẢN MỆNH/i)).toBeInTheDocument();
    expect(screen.getByText(/CÂN BẰNG NGŨ HÀNH/i)).toBeInTheDocument();
    expect(screen.getByText(/TỨ PHỤ CUNG TIÊN THIÊN/i)).toBeInTheDocument();

    // Kiểm tra nhãn 4 trụ
    expect(screen.getAllByText(/Trụ Năm/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Trụ Tháng/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Trụ Ngày/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Trụ Giờ/i).length).toBeGreaterThan(0);
  });

  it('toggles between board view and list view smoothly', async () => {
    const snapshot = createMockBaziSnapshot();
    render(BaziDetailCard, { props: { snapshot } });

    // Ban đầu ở chế độ board
    const toggleToListBtn = screen.getByRole('button', { name: /Xem dạng tóm tắt/i });
    expect(toggleToListBtn).toBeInTheDocument();

    // Chuyển sang list view
    await fireEvent.click(toggleToListBtn);
    expect(screen.getByRole('button', { name: /Mở Đồ Hình Tứ Trụ Hoàng Gia/i })).toBeInTheDocument();

    // Chuyển ngược lại board view
    const toggleToBoardBtn = screen.getByRole('button', { name: /Mở Đồ Hình Tứ Trụ Hoàng Gia/i });
    await fireEvent.click(toggleToBoardBtn);
    expect(screen.getByText(/ĐỒ HÌNH BÁT TỰ TỨ TRỤ TIÊN THIÊN/i)).toBeInTheDocument();
  });

  it('falls back to classic summary cards when snapshot has pillars but no rich bazi', () => {
    const fallbackSnapshot = {
      solarDate: '1990-09-15',
      pillars: [
        { slot: 'year', heavenlyStemKey: 'gengHeavenly', earthlyBranchKey: 'wuEarthly' },
      ],
      palaces: [],
    } as unknown as ChartDetailResponse['snapshot'];

    render(BaziDetailCard, { props: { snapshot: fallbackSnapshot } });

    // Không render bảng đồ hình hoàng gia mà render SummaryCard fallback
    expect(screen.queryByText(/ĐỒ HÌNH BÁT TỰ TỨ TRỤ TIÊN THIÊN/i)).not.toBeInTheDocument();
    expect(screen.getByText('Tứ trụ')).toBeInTheDocument();
  });

  it('renders EmptyStateCard when snapshot has no bazi and empty pillars', () => {
    const emptySnapshot = {
      solarDate: '1990-09-15',
      pillars: [],
      palaces: [],
    } as unknown as ChartDetailResponse['snapshot'];

    render(BaziDetailCard, { props: { snapshot: emptySnapshot } });

    expect(screen.queryByText(/ĐỒ HÌNH BÁT TỰ TỨ TRỤ TIÊN THIÊN/i)).not.toBeInTheDocument();
    expect(screen.getByText('Chưa thể dựng đồ hình Tứ Trụ')).toBeInTheDocument();
  });
});
