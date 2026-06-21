/**
 * Lỗi định kiểu cho QuotasService — caller phân biệt bằng `instanceof` thay vì so khớp chuỗi message
 * (fragile, vỡ khi đổi text hoặc bản địa hoá — review PR #31). Cả hai kế thừa Error nên các caller cũ
 * vẫn đọc được `.message` như trước (không phá hành vi map 429 hiện có).
 */

/** Vượt cửa sổ rate-limit per-phút (per-IP hoặc per-user). Tạm thời → client nên thử lại sau ít phút. */
export class RateLimitWindowError extends Error {
  constructor(message = 'Too many requests in the current time window.') {
    super(message);
    this.name = 'RateLimitWindowError';
  }
}

/** Vượt hạn mức theo ngày (chart/explanation/tarot/mbti/pairing/annual/vision). */
export class DailyQuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DailyQuotaExceededError';
  }
}
