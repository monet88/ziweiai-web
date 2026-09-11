import { describe, expect, it, vi } from 'vitest';
import {
  slugifyVietnamese,
  formatRoyalSecurityCode,
  formatExplanationPdfFileName,
  splitMarkdownIntoRoyalPages,
  exportExplanationToPdf,
} from './explanation-pdf-exporter';

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

describe('explanation-pdf-exporter: Text helpers & security formatters', () => {
  it('slugifyVietnamese converts accented Vietnamese correctly', () => {
    expect(slugifyVietnamese('Nguyễn Thị Mai')).toBe('Nguyen-Thi-Mai');
    expect(slugifyVietnamese('Vũ Đình Long')).toBe('Vu-Dinh-Long');
  });

  it('formatRoyalSecurityCode formats short unique royal code from chartId', () => {
    const chartId = '7b5a1ec-8762-4107-a83a-0712afe9ab1c';
    expect(formatRoyalSecurityCode(chartId)).toBe('VIOS-ROYAL-7B5A1EC8');
  });

  it('formatExplanationPdfFileName constructs elegant PDF file name', () => {
    const chartId = '7b5a1ec-8762-4107-a83a-0712afe9ab1c';
    const fileName = formatExplanationPdfFileName('Nguyễn Văn An', chartId);
    expect(fileName).toBe('Ban-So-Luan-Giai-Hoang-Gia-Nguyen-Van-An-VIOS-ROYAL-7B5A1EC8.pdf');
  });
});

describe('explanation-pdf-exporter: splitMarkdownIntoRoyalPages', () => {
  it('handles empty or whitespace markdown gracefully', () => {
    const pages = splitMarkdownIntoRoyalPages('');
    expect(pages).toHaveLength(1);
    expect(pages[0]).toContain('Chưa có nội dung');
  });

  it('splits sections cleanly by ## headings', () => {
    const markdown = `## 1. Tổng Quan Bản Mệnh
Nội dung phân tích tổng quan bản mệnh...

## 2. Cung Mệnh & Thân
Nội dung phân tích cung Mệnh và Thân...

## 3. Cung Quan Lộc & Sự Nghiệp
Nội dung phân tích đường công danh sự nghiệp...`;

    const pages = splitMarkdownIntoRoyalPages(markdown, 100);
    expect(pages.length).toBeGreaterThanOrEqual(2);
    expect(pages[0]).toContain('Tổng Quan Bản Mệnh');
  });
});

describe('explanation-pdf-exporter: exportExplanationToPdf', () => {
  it('throws error if pages array is empty', async () => {
    await expect(
      exportExplanationToPdf({
        pages: [],
        userName: 'Nguyễn Văn An',
        chartId: 'test-id',
      })
    ).rejects.toThrow('Không tìm thấy danh sách trang để xuất PDF');
  });

  it('successfully executes pages rendering with progress callbacks', async () => {
    const mockPages = Array.from({ length: 3 }, (_, i) => {
      const el = document.createElement('div');
      el.id = `explanation-page-${i + 1}`;
      el.innerHTML = `<h1>Trang ${i + 1}</h1>`;
      return el;
    });

    const progressReports: any[] = [];
    const result = await exportExplanationToPdf({
      pages: mockPages,
      userName: 'Đặng Thùy Trâm',
      chartId: 'd9b7f5e3-1234-5678-9abc-def012345678',
      pageTitles: ['Trang Bìa', 'Luận Giải', 'Sắc Chỉ'],
      onProgress: (p) => {
        progressReports.push({ ...p });
      },
    });

    expect(result.fileName).toContain('Ban-So-Luan-Giai-Hoang-Gia-Dang-Thuy-Tram');
    expect(result.blob).toBeInstanceOf(Blob);
    expect(progressReports.length).toBeGreaterThanOrEqual(4);
    expect(progressReports[progressReports.length - 1].percent).toBe(100);
  });

  it('throws AbortError if aborted before completion', async () => {
    const mockPages = [document.createElement('div'), document.createElement('div')];
    const abortController = new AbortController();
    abortController.abort();

    await expect(
      exportExplanationToPdf({
        pages: mockPages,
        userName: 'Tiêu Phong',
        chartId: 'abort-test',
        signal: abortController.signal,
      })
    ).rejects.toThrow('hủy bỏ');
  });
});
