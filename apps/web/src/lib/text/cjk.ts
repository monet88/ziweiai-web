// Bộ phát hiện chữ CJK/biểu chữ Đông Á dùng để chặn rò chữ Hán/Nhật/Hàn ra UI
// (bất biến ngôn ngữ: frontend chỉ tiếng Việt Latin).
//
// Giá trị CJK_TEXT_PATTERN được copy từ @ziweiai/core (decision 0007: web KHÔNG
// import core để tránh kéo iztro + ephemeris + chữ Hán vào client bundle).
//
// Mở rộng hơn \p{Script=Han} đơn lẻ để bắt cả Han, Hiragana, Katakana, Hangul,
// Bopomofo, dấu câu CJK (U+3000-303F) và dạng toàn/nửa rộng (U+FF00-FFEF).
//
// Không dùng cờ g để .test() không giữ trạng thái lastIndex giữa các lần gọi.
export const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

/** Trả về true nếu chuỗi chứa bất kỳ chữ/biểu chữ CJK nào (Hán/Nhật/Hàn/fullwidth). */
export function containsCjkText(value: string): boolean {
  return CJK_TEXT_PATTERN.test(value);
}

/**
 * Chuẩn hóa displayName từ snapshot legacy v1: web KHÔNG mang bảng map iztro Hán->key
 * (server-only). Vì vậy:
 * - displayName không chứa CJK (đã là nhãn Latin/tiếng Việt) -> trả nguyên.
 * - displayName chứa chữ Hán -> trả nhãn an toàn "Thuật ngữ cũ" để frontend không
 *   bao giờ rò chữ Hán ra UI (bất biến ngôn ngữ).
 */
export function normalizeLegacyDisplayName(displayName: string): string {
  if (!CJK_TEXT_PATTERN.test(displayName)) {
    return displayName;
  }

  return 'Thuật ngữ cũ';
}
