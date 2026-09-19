/**
 * Tiện ích nén và xử lý ảnh sang chuẩn WebP chất lượng cao trên Web SvelteKit (Sprint 60)
 * Tối ưu dung lượng tải về, giảm 70% băng thông so với PNG thông thường.
 */

export interface CompressCanvasOptions {
  quality?: number; // 0.1 -> 1.0 (default 0.85)
  mimeType?: 'image/webp' | 'image/png' | 'image/jpeg';
}

/**
 * Xuất Canvas HTML5 sang Blob WebP chất lượng cao, có fallback sang PNG nếu trình duyệt không hỗ trợ WebP export
 */
export function canvasToWebpBlob(
  canvas: HTMLCanvasElement,
  options: CompressCanvasOptions = {},
): Promise<Blob> {
  const quality = options.quality ?? 0.85;
  const mimeType = options.mimeType ?? 'image/webp';

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback sang image/png nếu không tạo được webp blob
            canvas.toBlob(
              (fallbackBlob) => {
                if (fallbackBlob) {
                  resolve(fallbackBlob);
                } else {
                  reject(new Error('Không thể tạo blob từ Canvas'));
                }
              },
              'image/png',
            );
          }
        },
        mimeType,
        quality,
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Xuất Canvas sang DataURL WebP (hoặc PNG fallback)
 */
export function canvasToWebpDataUrl(
  canvas: HTMLCanvasElement,
  quality = 0.85,
): string {
  try {
    const dataUrl = canvas.toDataURL('image/webp', quality);
    if (dataUrl.startsWith('data:image/webp')) {
      return dataUrl;
    }
    return canvas.toDataURL('image/png');
  } catch {
    return canvas.toDataURL('image/png');
  }
}

/**
 * Trích xuất extension ('webp' | 'png') từ chuỗi dataUrl thực tế
 */
export function getDataUrlExtension(dataUrl: string): 'webp' | 'png' {
  if (dataUrl.startsWith('data:image/webp')) {
    return 'webp';
  }
  return 'png';
}

/**
 * Tải file Blob về máy người dùng
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
