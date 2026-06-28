/**
 * US-017e: tiện ích dùng chung cho luận giải vision (Xem Tướng/Xem Tay).
 *
 * - `SUPPORTED_VISION_MIME_TYPES`: định dạng ảnh được phép gửi cho LLM vision.
 * - `buildImageDataUrl`: dựng data URL base64 cho content part image_url (deepseek + openai-compat).
 *
 * REFACTOR-007 (decision 0030): allowlist `DEEPSEEK_VISION_CAPABLE_MODELS` + `isDeepseekModelVisionCapable`
 * đã gỡ — DeepSeek nay khai `visionCapable = false` cứng trên adapter (DeepseekExplanationProvider). Khi
 * DeepSeek mở vision, đặt `visionCapable = true` trên adapter đó là đủ.
 */

export const SUPPORTED_VISION_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

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
