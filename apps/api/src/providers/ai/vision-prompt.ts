/**
 * US-017e: tiện ích dùng chung cho luận giải vision (Xem Tướng/Xem Tay).
 *
 * - `SUPPORTED_VISION_MIME_TYPES`: định dạng ảnh được phép gửi cho LLM vision.
 * - `DEEPSEEK_VISION_CAPABLE_MODELS`: allowlist model DeepSeek thật sự đọc được ảnh. DeepSeek mặc
 *   định `deepseek-v4-pro` (đọc ảnh) nhưng `deepseek-v4-flash` KHÔNG. Gửi ảnh cho model text-only sẽ
 *   bị bỏ thầm lặng → "LLM ảo" mô tả ảnh không đọc được, nên chain vision chỉ chọn model trong danh
 *   sách này (xem Correction trong spec US-017e).
 * - `buildImageDataUrl`: dựng data URL base64 cho content part image_url (deepseek + openai-compat).
 */

export const SUPPORTED_VISION_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

// Allowlist model DeepSeek đọc được ảnh. Mở rộng tại đây khi DeepSeek thêm model vision-capable.
export const DEEPSEEK_VISION_CAPABLE_MODELS = new Set<string>(['deepseek-v4-pro']);

export function isDeepseekModelVisionCapable(model: string): boolean {
  return DEEPSEEK_VISION_CAPABLE_MODELS.has(model);
}

/** Dựng data URL `data:<mime>;base64,<...>` cho content part image_url (OpenAI-style). */
export function buildImageDataUrl(mimeType: string, base64: string): string {
  return `data:${mimeType};base64,${base64}`;
}

/** Map MIME type ảnh sang đuôi tệp lưu Storage. Mặc định 'bin' nếu không nhận diện được. */
export function mimeTypeToExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}
