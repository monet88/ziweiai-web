import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import BlurTeaserExplanation from './BlurTeaserExplanation.svelte';

describe('BlurTeaserExplanation (Freemium Hook 20/80)', () => {
  it('renders teaser preview (20%) and royal unlock button (80% blurred) when locked', async () => {
    const onUnlock = vi.fn();
    render(BlurTeaserExplanation, {
      props: {
        markdown: '## Tổng quan bản mệnh\n\nĐây là 20% mở đầu sắc nét.\n\n## Đại vận 10 năm\n\nĐây là 80% luận giải chuyên sâu về đại vận.',
        chartSystem: 'zi-wei-dou-shu',
        snapshot: null,
        pageTitle: 'Lá Số Tử Vi',
        isUnlocked: false,
        isPending: false,
        isStreaming: false,
        userBalance: 20,
        onUnlock,
      },
    });

    expect(screen.getByText(/PHÂN TÍCH KHỞI VẬN SẮC BÉN/i)).toBeInTheDocument();
    expect(screen.getByText(/Mở Khóa Toàn Bộ Thiên Cơ Vận Mệnh/i)).toBeInTheDocument();
    
    const unlockBtn = screen.getByRole('button', { name: /Mở Khóa Toàn Bộ Thiên Cơ — 10 XU/i });
    expect(unlockBtn).toBeInTheDocument();

    await fireEvent.click(unlockBtn);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it('renders full unblurred content and summary card when unlocked', () => {
    render(BlurTeaserExplanation, {
      props: {
        markdown: '## Tổng quan bản mệnh\n\nBản mệnh đại cát đại lợi.\n\n## Đại vận 10 năm\n\nĐại vận thăng tiến vượng tài.',
        chartSystem: 'zi-wei-dou-shu',
        snapshot: null,
        pageTitle: 'Lá Số Tử Vi',
        isUnlocked: true,
        isPending: false,
        isStreaming: false,
        userBalance: 50,
        onUnlock: vi.fn(),
      },
    });

    expect(screen.queryByText(/PHÂN TÍCH KHỞI VẬN SẮC BÉN/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mở Khóa Toàn Bộ Thiên Cơ/i })).not.toBeInTheDocument();
    expect(screen.getByText(/BẢN SỚ TỬ VI ĐẠI THÀNH LUẬN GIẢI/i)).toBeInTheDocument();
  });

  it('synthesizes specialized Bazi teaser when chartSystem is ba-zi and markdown is null', () => {
    render(BlurTeaserExplanation, {
      props: {
        markdown: null,
        chartSystem: 'ba-zi',
        snapshot: {
          pillars: [{ can: 'Giáp', chi: 'Tý' }, { can: 'Bính', chi: 'Dần' }, { can: 'Mậu', chi: 'Thìn' }, { can: 'Canh', chi: 'Thân' }],
          bazi: { dayMaster: 'Mậu Thổ' }
        },
        pageTitle: 'Lá Số Bát Tự',
        isUnlocked: false,
        isPending: false,
        isStreaming: false,
        userBalance: 0,
        onUnlock: vi.fn(),
      },
    });

    expect(screen.getByText(/TỨ TRỤ TINH HOA/i)).toBeInTheDocument();
    expect(screen.getByText(/Nhật Chủ Mậu Thổ/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mở Khóa Toàn Bộ Thiên Cơ/i })).toBeInTheDocument();
  });

  it('synthesizes specialized Divination teaser when chartSystem is liu-yao and markdown is null', () => {
    render(BlurTeaserExplanation, {
      props: {
        markdown: null,
        chartSystem: 'liu-yao',
        snapshot: {
          divinationContext: { question: 'Hỏi về tài lộc kinh doanh năm nay' }
        },
        pageTitle: 'Quẻ Lục Hào',
        isUnlocked: false,
        isPending: false,
        isStreaming: false,
        userBalance: 5,
        onUnlock: vi.fn(),
      },
    });

    expect(screen.getByText(/ĐẠI TƯỢNG QUẺ TRỜI/i)).toBeInTheDocument();
    expect(screen.getByText(/Hỏi về tài lộc kinh doanh năm nay/i)).toBeInTheDocument();
  });
});
