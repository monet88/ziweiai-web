import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface DossierExportProgress {
  current: number;
  total: number;
  percent: number;
  stage: string;
  pageTitle?: string;
}

export interface ExportDossierOptions {
  pages: HTMLElement[];
  userName: string;
  chartId: string;
  onProgress?: (progress: DossierExportProgress) => void;
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
 * Tạo tên tệp PDF chuẩn hóa, lịch sự và thân thiện với hệ thống tệp.
 */
export function formatDossierFileName(userName: string, chartId: string): string {
  const safeName = slugifyVietnamese(userName) || 'Duong-So';
  const secCode = formatRoyalSecurityCode(chartId);
  return `Ho-So-Menh-Ly-Hoang-Gia-${safeName}-${secCode}.pdf`;
}

/**
 * Tạo tên tệp PDF chuẩn hóa cho Hồ Sơ Bát Tự Hoàng Gia.
 */
export function formatBaziDossierFileName(userName: string, chartId: string): string {
  const safeName = slugifyVietnamese(userName) || 'Duong-So';
  const secCode = formatRoyalSecurityCode(chartId);
  return `Ho-So-Bat-Tu-Hoang-Gia-${safeName}-${secCode}.pdf`;
}

/**
 * Danh sách tiêu đề mặc định cho 17 trang Hồ Sơ Bát Tự Hoàng Gia ViOS.
 */
export const DEFAULT_BAZI_DOSSIER_PAGE_TITLES: readonly string[] = [
  'Bìa Mộc Son Tiên Thiên Bát Tự',
  'Đồ Hình Tứ Trụ & Tứ Phụ Cung',
  'Cân Bằng Ngũ Hành & Chân Dụng Thần',
  'Trụ Năm (Tổ Tiên - Niên Thiếu)',
  'Trụ Tháng (Phụ Mẫu - Lập Nghiệp)',
  'Trụ Ngày (Bản Thân - Hôn Nhân)',
  'Trụ Giờ (Hậu Vận - Con Cái)',
  'Đại Luận Thập Thần (Ấn Tinh & Quan Sát)',
  'Đại Luận Thập Thần (Tài Tinh, Thực Thương & Tỷ Kiếp)',
  'Thần Sát Toàn Cảnh: Cát Tinh & Hung Sát',
  'Bản Đồ Thập Niên Đại Vận (Phần I)',
  'Bản Đồ Thập Niên Đại Vận (Phần II)',
  'Vận Hạn Năm 2026 Bính Ngọ',
  'Vận Trình 12 Tháng Năm 2026 (Nửa Đầu Năm)',
  'Vận Trình 12 Tháng Năm 2026 (Nửa Cuối Năm)',
  'Chiến Lược Cải Vận & Phong Thủy Dụng Thần',
  'Sắc Chỉ Khâm Thiên Giám & Bảo Chứng Số Hóa',
];

/**
 * Danh sách tiêu đề mặc định cho 19 trang Hồ Sơ Hoàng Gia ViOS.
 */
export const DEFAULT_DOSSIER_PAGE_TITLES: readonly string[] = [
  'Bìa Mộc Son Hoàng Gia',
  'Tổng Quan Bản Mệnh & Tứ Trụ',
  'Toàn Cảnh Tinh Bàn Tử Vi',
  'Cung Mệnh',
  'Cung Phụ Mẫu',
  'Cung Phúc Đức',
  'Cung Điền Trạch',
  'Cung Quan Lộc',
  'Cung Nô Bộc',
  'Cung Thiên Di',
  'Cung Tật Ách',
  'Cung Tài Bạch',
  'Cung Tử Tức',
  'Cung Phu Thê',
  'Cung Huynh Đệ',
  'Thập Niên Đại Vận (I)',
  'Thập Niên Đại Vận (II)',
  'Vận Hạn Lưu Niên 2026',
  'Triện Son & Bảo Chứng Số Hóa',
];

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
 * Xuất 19 trang DOM A4 thành tệp PDF chuẩn vector/raster độ phân giải cao (2x).
 * Chạy 100% offline client-side, dọn dẹp bộ nhớ từng trang chống tràn RAM.
 */
export async function exportDossierToPdf(
  options: ExportDossierOptions
): Promise<{ blob: Blob; fileName: string }> {
  const {
    pages,
    userName,
    chartId,
    onProgress,
    signal,
    scale = 1.5,
    pageTitles = DEFAULT_DOSSIER_PAGE_TITLES,
  } = options;

  if (!pages || pages.length === 0) {
    throw new Error('Không tìm thấy danh sách trang để xuất PDF.');
  }

  if (signal?.aborted) {
    throw new DOMException('Tác vụ xuất bản PDF đã bị người dùng hủy bỏ.', 'AbortError');
  }

  const total = pages.length;
  const fileName = formatDossierFileName(userName, chartId);

  onProgress?.({
    current: 0,
    total,
    percent: 0,
    stage: 'Khởi tạo công cụ xuất bản PDF Hoàng Gia...',
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

    // Cuộn trang vào khung nhìn để trình duyệt tính toán bounding box chính xác
    if (typeof pageElement.scrollIntoView === 'function') {
      pageElement.scrollIntoView({ block: 'start' });
      await new Promise((r) => setTimeout(r, 60));
    }

    // Render DOM page sang canvas với độ nét cao và nền hoàng triều
    const canvas = await html2canvas(pageElement, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#fcf9f2',
      scrollX: 0,
      scrollY: -window.scrollY,
      width: pageElement.offsetWidth || 794,
      height: pageElement.offsetHeight || 1123,
    });

    if (signal?.aborted) {
      canvas.width = 0;
      canvas.height = 0;
      throw new DOMException('Tác vụ xuất bản PDF đã bị người dùng hủy bỏ.', 'AbortError');
    }

    // Nén JPEG 0.92 để chất lượng in ấn và hiển thị sắc nét nhưng dung lượng tối ưu
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    // Giải phóng bộ nhớ Canvas ngay sau khi trích xuất dataURL
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
    stage: 'Đang hoàn thiện và đóng gói tệp PDF...',
    pageTitle: 'Hoàn tất',
  });

  const blob = doc.output('blob');
  return { blob, fileName };
}
