import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  slugifyVietnamese,
  formatPosterFileName,
  formatBaziPosterFileName,
  formatDivinationPosterFileName,
  exportPosterToPng,
  triggerDirectDownload,
  sharePosterImage,
} from './royal-poster-exporter';

vi.mock('html2canvas', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        width: 800,
        height: 1100,
        toBlob: vi.fn().mockImplementation((callback: (blob: Blob | null) => void) => {
          callback(new Blob(['mock-png-data'], { type: 'image/png' }));
        }),
      });
    }),
  };
});

describe('royal-poster-exporter', () => {
  describe('slugifyVietnamese', () => {
    it('handles empty input gracefully', () => {
      expect(slugifyVietnamese('')).toBe('');
    });

    it('removes accents and special characters correctly', () => {
      expect(slugifyVietnamese('Nguyễn Văn An')).toBe('Nguyen-Van-An');
      expect(slugifyVietnamese('Đỗ Hoàng Long')).toBe('Do-Hoang-Long');
      expect(slugifyVietnamese('Trần Thị Ánh Tuyết!')).toBe('Tran-Thi-Anh-Tuyet');
    });
  });

  describe('formatPosterFileName', () => {
    it('creates formatted file name with user name and year', () => {
      expect(formatPosterFileName('Nguyễn Văn An', 1990)).toBe('Poster-Hoang-Gia-Nguyen-Van-An-1990.png');
      expect(formatPosterFileName('Đỗ Long')).toBe('Poster-Hoang-Gia-Do-Long.png');
      expect(formatPosterFileName('', null)).toBe('Poster-Hoang-Gia-Duong-So.png');
    });
  });

  describe('formatBaziPosterFileName', () => {
    it('creates formatted file name for bazi poster', () => {
      expect(formatBaziPosterFileName('galaxypro710', 'Bính Hỏa')).toBe('Poster-Bat-Tu-galaxypro710-Binh-Hoa.png');
      expect(formatBaziPosterFileName('', null)).toBe('Poster-Bat-Tu-Duong-So.png');
    });
  });

  describe('formatDivinationPosterFileName', () => {
    it('formats divination poster file name for bazi', () => {
      expect(formatDivinationPosterFileName('bazi', 'Tu-Tru')).toBe('Poster-Bat-Tu-Tu-Tru.png');
      expect(formatDivinationPosterFileName('bazi', '')).toBe('Poster-Bat-Tu.png');
    });

    it('formats divination poster file name for liuyao', () => {
      expect(formatDivinationPosterFileName('liuyao', 'Thuần Càn')).toBe('Poster-Luc-Hao-Thuan-Can.png');
      expect(formatDivinationPosterFileName('liuyao', '')).toBe('Poster-Luc-Hao.png');
    });

    it('formats divination poster file name for tarot', () => {
      expect(formatDivinationPosterFileName('tarot', 'three-card')).toBe('Poster-Tarot-three-card.png');
      expect(formatDivinationPosterFileName('tarot', null)).toBe('Poster-Tarot.png');
    });

    it('formats divination poster file name for numerology', () => {
      expect(formatDivinationPosterFileName('numerology', 'Lê Hoàng')).toBe('Poster-Than-So-Hoc-Le-Hoang.png');
      expect(formatDivinationPosterFileName('numerology', '')).toBe('Poster-Than-So-Hoc.png');
    });
  });

  describe('exportPosterToPng', () => {
    it('converts DOM element to Blob successfully', async () => {
      const dummyElement = document.createElement('div');
      const blob = await exportPosterToPng(dummyElement, { scale: 2 });
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });
  });

  describe('triggerDirectDownload', () => {
    beforeEach(() => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('creates anchor and triggers click without error', () => {
      const blob = new Blob(['mock'], { type: 'image/png' });
      expect(() => triggerDirectDownload(blob, 'test.png')).not.toThrow();
    });
  });

  describe('sharePosterImage', () => {
    it('returns false when navigator.share is not available', async () => {
      const blob = new Blob(['mock'], { type: 'image/png' });
      const result = await sharePosterImage(blob, 'test.png', 'Title', 'Text');
      expect(result).toBe(false);
    });

    it('returns true when navigator.canShare and navigator.share succeed', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      const mockCanShare = vi.fn().mockReturnValue(true);

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          share: mockShare,
          canShare: mockCanShare,
        },
        configurable: true,
        writable: true,
      });

      const blob = new Blob(['mock'], { type: 'image/png' });
      const result = await sharePosterImage(blob, 'test.png', 'Lá số', 'Mô tả');
      expect(result).toBe(true);
      expect(mockShare).toHaveBeenCalled();
    });
  });
});
