/**
 * US-017e: tiện ích dùng chung cho luận giải vision (Xem Tướng/Xem Tay).
 *
 * - `SUPPORTED_VISION_MIME_TYPES`: định dạng ảnh được phép gửi cho LLM vision.
 * - `DEEPSEEK_VISION_CAPABLE_MODELS`: allowlist model DeepSeek thật sự đọc được ảnh. HIỆN TẠI RỖNG:
 *   theo tài liệu chính thức (api-docs.deepseek.com) DeepSeek API CHƯA hỗ trợ vision — kiểm thử trực
 *   tiếp cả `deepseek-v4-pro` lẫn `deepseek-v4-flash` đều trả 400 "unknown variant `image_url`"
 *   (đính chính Correction trong spec US-017e: pro KHÔNG đọc ảnh như từng giả định). Nhờ allowlist
 *   rỗng, router loại DeepSeek khỏi chain vision → không tốn một cú gọi 400 thừa mỗi request rồi mới
 *   failover. Khi DeepSeek bổ sung vision, chỉ cần thêm model id vào set này.
 * - `buildImageDataUrl`: dựng data URL base64 cho content part image_url (deepseek + openai-compat).
 */

export const SUPPORTED_VISION_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

// Allowlist model DeepSeek đọc được ảnh. RỖNG vì DeepSeek API hiện chưa hỗ trợ vision (xác nhận qua
// docs chính thức + probe 400 trên cả pro/flash). Thêm model id vào đây khi DeepSeek mở vision.
export const DEEPSEEK_VISION_CAPABLE_MODELS = new Set<string>();

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
