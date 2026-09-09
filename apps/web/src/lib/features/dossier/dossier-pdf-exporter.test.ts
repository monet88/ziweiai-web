import { describe, expect, it, vi } from 'vitest';
import {
  slugifyVietnamese,
  formatRoyalSecurityCode,
  formatDossierFileName,
  formatBaziDossierFileName,
  DEFAULT_DOSSIER_PAGE_TITLES,
  DEFAULT_BAZI_DOSSIER_PAGE_TITLES,
  exportDossierToPdf,
} from './dossier-pdf-exporter';

// Mock html2canvas and jspdf for fast, deterministic unit testing in node/jsdom
vi.mock('html2canvas', () => {
  return {
    default: vi.fn().mockImplementation((_element, _options) => {
      return Promise.resolve({
        toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,mockImageData'),
        width: 794,
        height: 1123,
      });
    }),
  };
});

vi.mock('jspdf', () => {
  return {
    jsPDF: class MockJsPdf {
      addPage = vi.fn();
      addImage = vi.fn();
      output = vi.fn().mockReturnValue(new Blob(['mock-pdf-content'], { type: 'application/pdf' }));
    },
  };
});

describe('dossier-pdf-exporter: Text helpers & security formatters', () => {
  it('slugifyVietnamese converts accented Vietnamese correctly', () => {
    expect(slugifyVietnamese('')).toBe('');
    expect(slugifyVietnamese('Nguyễn Văn An')).toBe('Nguyen-Van-An');
    expect(slugifyVietnamese('Đặng Đình Đức')).toBe('Dang-Dinh-Duc');
    expect(slugifyVietnamese('   Trần   Thị   Mai   ')).toBe('Tran-Thi-Mai');
    expect(slugifyVietnamese('Hoàng Gia #2026!')).toBe('Hoang-Gia-2026');
  });

  it('formatRoyalSecurityCode formats short unique royal code from chartId', () => {
    const chartId = '2b496e92-ea1d-4d6f-a156-ce56ada6d5e5';
    expect(formatRoyalSecurityCode(chartId)).toBe('VIOS-ROYAL-2B496E92');

    // Handle short or empty chartId gracefully
    expect(formatRoyalSecurityCode('')).toBe('VIOS-ROYAL-VIOS0000');
    expect(formatRoyalSecurityCode('abc')).toBe('VIOS-ROYAL-ABC00000');
  });

  it('formatDossierFileName constructs elegant PDF file name', () => {
    const chartId = '2b496e92-ea1d-4d6f-a156-ce56ada6d5e5';
    const fileName = formatDossierFileName('Nguyễn Văn An', chartId);
    expect(fileName).toBe('Ho-So-Menh-Ly-Hoang-Gia-Nguyen-Van-An-VIOS-ROYAL-2B496E92.pdf');

    const fallbackFileName = formatDossierFileName('', chartId);
    expect(fallbackFileName).toBe('Ho-So-Menh-Ly-Hoang-Gia-Duong-So-VIOS-ROYAL-2B496E92.pdf');
  });

  it('formatBaziDossierFileName constructs elegant Bazi PDF file name', () => {
    const chartId = '2b496e92-ea1d-4d6f-a156-ce56ada6d5e5';
    const fileName = formatBaziDossierFileName('Nguyễn Văn An', chartId);
    expect(fileName).toBe('Ho-So-Bat-Tu-Hoang-Gia-Nguyen-Van-An-VIOS-ROYAL-2B496E92.pdf');
  });

  it('DEFAULT_BAZI_DOSSIER_PAGE_TITLES contains exactly 17 royal bazi page titles', () => {
    expect(DEFAULT_BAZI_DOSSIER_PAGE_TITLES).toHaveLength(17);
    expect(DEFAULT_BAZI_DOSSIER_PAGE_TITLES[0]).toContain('Bìa');
    expect(DEFAULT_BAZI_DOSSIER_PAGE_TITLES[16]).toContain('Bảo Chứng');
  });

  it('DEFAULT_DOSSIER_PAGE_TITLES contains exactly 19 royal page titles', () => {
    expect(DEFAULT_DOSSIER_PAGE_TITLES).toHaveLength(19);
    expect(DEFAULT_DOSSIER_PAGE_TITLES[0]).toBe('Bìa Mộc Son Hoàng Gia');
    expect(DEFAULT_DOSSIER_PAGE_TITLES[1]).toBe('Tổng Quan Bản Mệnh & Tứ Trụ');
    expect(DEFAULT_DOSSIER_PAGE_TITLES[2]).toBe('Toàn Cảnh Tinh Bàn Tử Vi');
    expect(DEFAULT_DOSSIER_PAGE_TITLES[3]).toBe('Cung Mệnh');
    expect(DEFAULT_DOSSIER_PAGE_TITLES[14]).toBe('Cung Huynh Đệ');
    expect(DEFAULT_DOSSIER_PAGE_TITLES[15]).toBe('Thập Niên Đại Vận (I)');
    expect(DEFAULT_DOSSIER_PAGE_TITLES[16]).toBe('Thập Niên Đại Vận (II)');
    expect(DEFAULT_DOSSIER_PAGE_TITLES[17]).toBe('Vận Hạn Lưu Niên 2026');
    expect(DEFAULT_DOSSIER_PAGE_TITLES[18]).toBe('Triện Son & Bảo Chứng Số Hóa');
  });
});

describe('dossier-pdf-exporter: Export pipeline execution', () => {
  it('throws error if pages array is empty', async () => {
    await expect(
      exportDossierToPdf({
        pages: [],
        userName: 'Tiêu Phong',
        chartId: 'test-chart-id',
      })
    ).rejects.toThrow('Không tìm thấy danh sách trang để xuất PDF.');
  });

  it('successfully executes 19 pages rendering with progress callbacks', async () => {
    const mockPages = Array.from({ length: 19 }, (_, i) => {
      const el = document.createElement('div');
      el.id = `dossier-page-${i + 1}`;
      return el;
    });

    const progressReports: any[] = [];
    const result = await exportDossierToPdf({
      pages: mockPages,
      userName: 'Đoàn Dự',
      chartId: '2b496e92-test',
      onProgress: (p) => progressReports.push(p),
    });

    expect(result.fileName).toContain('Doan-Du');
    expect(result.fileName).toContain('VIOS-ROYAL-2B496E92');
    expect(result.blob).toBeInstanceOf(Blob);

    // Check progress reports start at 0% and finish at 100%
    expect(progressReports.length).toBeGreaterThanOrEqual(20);
    expect(progressReports[0].percent).toBe(0);
    expect(progressReports[progressReports.length - 1].percent).toBe(100);
    expect(progressReports[progressReports.length - 1].stage).toContain('hoàn thiện');
  });

  it('aborts promptly when AbortSignal is triggered', async () => {
    const controller = new AbortController();
    const mockPages = [document.createElement('div'), document.createElement('div')];

    // Abort immediately before or during execution
    controller.abort();

    await expect(
      exportDossierToPdf({
        pages: mockPages,
        userName: 'Hư Trúc',
        chartId: 'abort-test',
        signal: controller.signal,
      })
    ).rejects.toThrow('Tác vụ xuất bản PDF đã bị người dùng hủy bỏ.');
  });
});
