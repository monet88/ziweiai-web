import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExplanationExportProgress {
  current: number;
  total: number;
  percent: number;
  stage: string;
  pageTitle?: string;
}

export interface ExportExplanationOptions {
  pages: HTMLElement[];
  userName: string;
  chartId: string;
  onProgress?: (progress: ExplanationExportProgress) => void;
  signal?: AbortSignal;
  scale?: number;
  pageTitles?: string[];
}

/**
 * Chuyển chuỗi tiếng Việt có dấu thành chuỗi không dấu an toàn cho tên tệp tin.
 */
export function slugifyVietnamese(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Tạo mã số bảo chứng số hóa Khâm Thiên Giám độc quyền từ chartId.
 */
export function formatRoyalSecurityCode(chartId: string): string {
  const cleanId = (chartId || 'VIOS0000').replace(/[^a-zA-Z0-9]/g, '');
  const shortId = cleanId.slice(0, 8).toUpperCase().padEnd(8, '0');
  return `VIOS-ROYAL-${shortId}`;
}

/**
 * Tạo tên tệp PDF chuẩn hóa cho Bản Sớ Luận Giải Hoàng Gia.
 */
export function formatExplanationPdfFileName(userName: string, chartId: string): string {
  const safeName = slugifyVietnamese(userName) || 'Duong-So';
  const secCode = formatRoyalSecurityCode(chartId);
  return `Ban-So-Luan-Giai-Hoang-Gia-${safeName}-${secCode}.pdf`;
}

/**
 * Kích hoạt tải trực tiếp file Blob về máy người dùng không cần mở hộp thoại Print.
 */
export function triggerDirectDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Phân chia nội dung bài luận giải Markdown thành các trang A4 logic.
 * Tách theo heading (##, ###) hoặc đoạn văn vừa vặn cho một trang A4.
 */
export function splitMarkdownIntoRoyalPages(markdown: string, targetLengthPerPage = 950): string[] {
  if (!markdown || !markdown.trim()) {
    return ['(Chưa có nội dung luận giải)'];
  }

  const sections: string[] = [];
  // Tách theo các heading cấp 2 (##)
  const rawSections = markdown.split(/\n(?=##\s+)/g);

  let currentPageBuffer = '';

  for (const rawSec of rawSections) {
    const sec = rawSec.trim();
    if (!sec) continue;

    // Nếu thêm section này vào buffer mà vượt quá targetLengthPerPage và buffer đã có nội dung
    if (currentPageBuffer && (currentPageBuffer.length + sec.length > targetLengthPerPage * 1.3)) {
      sections.push(currentPageBuffer.trim());
      currentPageBuffer = sec;
    } else {
      currentPageBuffer = currentPageBuffer ? `${currentPageBuffer}\n\n${sec}` : sec;
    }

    // Nếu một section đơn lẻ quá dài (hơn targetLengthPerPage * 1.5), tách nhỏ theo đoạn văn
    if (currentPageBuffer.length > targetLengthPerPage * 1.5) {
      const paragraphs = currentPageBuffer.split(/\n\n+/g);
      let subBuffer = '';
      for (const p of paragraphs) {
        if (subBuffer && (subBuffer.length + p.length > targetLengthPerPage)) {
          sections.push(subBuffer.trim());
          subBuffer = p;
        } else {
          subBuffer = subBuffer ? `${subBuffer}\n\n${p}` : p;
        }
      }
      currentPageBuffer = subBuffer;
    }
  }

  if (currentPageBuffer.trim()) {
    sections.push(currentPageBuffer.trim());
  }

  return sections.length > 0 ? sections : [markdown];
}

/**
 * Xuất danh sách trang DOM A4 của Bản Sớ Luận Giải AI thành tệp PDF chuẩn vector/raster cao cấp.
 * Xử lý 100% client-side, dọn dẹp canvas từng trang chống tràn RAM bộ nhớ.
 */
export async function exportExplanationToPdf(
  options: ExportExplanationOptions
): Promise<{ blob: Blob; fileName: string }> {
  const {
    pages,
    userName,
    chartId,
    onProgress,
    signal,
    scale = 1.5,
    pageTitles = [],
  } = options;

  if (!pages || pages.length === 0) {
    throw new Error('Không tìm thấy danh sách trang để xuất PDF Bản Sớ Luận Giải.');
  }

  if (signal?.aborted) {
    throw new DOMException('Tác vụ xuất bản PDF đã bị người dùng hủy bỏ.', 'AbortError');
  }

  const total = pages.length;
  const fileName = formatExplanationPdfFileName(userName, chartId);

  onProgress?.({
    current: 0,
    total,
    percent: 0,
    stage: 'Khởi tạo công cụ xuất bản Sớ Luận Giải PDF...',
    pageTitle: pageTitles[0] || 'Khởi tạo',
  });

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < total; i++) {
    if (signal?.aborted) {
      throw new DOMException('Tác vụ xuất bản PDF đã bị người dùng hủy bỏ.', 'AbortError');
    }

    const pageElement = pages[i];
    const pageTitle = pageTitles[i] || `Trang ${i + 1}`;
    const percent = Math.round((i / total) * 100);

    onProgress?.({
      current: i + 1,
      total,
      percent,
      stage: `Đang kết xuất Trang ${i + 1}/${total}: ${pageTitle}...`,
      pageTitle,
    });

    // Render DOM page sang canvas với độ nét cao và nền hoàng triều
    const canvas = await html2canvas(pageElement, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#faf6ed',
      windowWidth: 794,
      windowHeight: 1123,
    });

    if (signal?.aborted) {
      canvas.width = 0;
      canvas.height = 0;
      throw new DOMException('Tác vụ xuất bản PDF đã bị người dùng hủy bỏ.', 'AbortError');
    }

    // Nén JPEG 0.92 để chất lượng in ấn sắc nét
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    // Giải phóng bộ nhớ Canvas ngay sau khi trích xuất
    canvas.width = 0;
    canvas.height = 0;

    if (i > 0) {
      doc.addPage('a4', 'portrait');
    }

    // Kích thước chuẩn A4 (210mm x 297mm)
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  }

  if (signal?.aborted) {
    throw new DOMException('Tác vụ xuất bản PDF đã bị người dùng hủy bỏ.', 'AbortError');
  }

  onProgress?.({
    current: total,
    total,
    percent: 100,
    stage: 'Đang hoàn thiện và niêm phong tệp PDF ngự bút...',
    pageTitle: 'Hoàn tất',
  });

  const blob = doc.output('blob');
  return { blob, fileName };
}
