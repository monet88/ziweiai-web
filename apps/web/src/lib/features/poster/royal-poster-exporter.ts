import html2canvas from 'html2canvas';

export function slugifyVietnamese(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function formatPosterFileName(userName: string, birthYear?: string | number | null): string {
  const safeName = slugifyVietnamese(userName) || 'Duong-So';
  const yearSuffix = birthYear ? `-${birthYear}` : '';
  return `Poster-Hoang-Gia-${safeName}${yearSuffix}.png`;
}

export function formatDivinationPosterFileName(
  system: 'liuyao' | 'tarot' | 'numerology',
  title?: string | null,
): string {
  const safeTitle = slugifyVietnamese(title || '');
  if (system === 'liuyao') {
    const suffix = safeTitle ? `-${safeTitle}` : '';
    return `Poster-Luc-Hao${suffix}.png`;
  }
  if (system === 'tarot') {
    const suffix = safeTitle ? `-${safeTitle}` : '';
    return `Poster-Tarot${suffix}.png`;
  }
  if (system === 'numerology') {
    const suffix = safeTitle ? `-${safeTitle}` : '';
    return `Poster-Than-So-Hoc${suffix}.png`;
  }
  return `Poster-${safeTitle || 'Bao-Chung'}.png`;
}

export interface PosterExportOptions {
  scale?: number;
  backgroundColor?: string;
}

/**
 * Chuyển đổi DOM element của Poster Hoàng Gia thành Blob ảnh PNG sắc nét (High-DPI).
 */
export async function exportPosterToPng(
  element: HTMLElement,
  options?: PosterExportOptions,
): Promise<Blob> {
  const scale = options?.scale ?? 2;
  const backgroundColor = options?.backgroundColor ?? '#0c0a09';

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor,
    windowWidth: element.scrollWidth || 900,
    windowHeight: element.scrollHeight || 1200,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      // Giải phóng bộ nhớ canvas
      canvas.width = 0;
      canvas.height = 0;
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Không thể tạo file ảnh từ giao diện poster.'));
      }
    }, 'image/png');
  });
}

/**
 * Tải trực tiếp file ảnh poster về máy người dùng.
 */
export function triggerDirectDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Chia sẻ trực tiếp file ảnh poster qua Web Share API (mobile/desktop hiện đại).
 * Trả về true nếu chia sẻ thành công, false nếu thiết bị không hỗ trợ hoặc người dùng hủy.
 */
export async function sharePosterImage(
  blob: Blob,
  fileName: string,
  title: string,
  text: string,
): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return false;
  }

  try {
    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return true;
    }
  } catch {
    // Người dùng hủy hoặc lỗi chia sẻ file
    return false;
  }

  return false;
}
