// Bộ phát hiện chữ CJK/biểu chữ Đông Á dùng để chặn rò chữ Hán/Nhật/Hàn ra UI và
// output AI (bất biến ngôn ngữ: frontend + luận giải chỉ tiếng Việt Latin).
//
// Mở rộng hơn `\p{Script=Han}` đơn lẻ để bắt cả:
// - Han (chữ Hán)              \p{Script=Han}
// - Hiragana, Katakana (Nhật)  \p{Script=Hiragana} \p{Script=Katakana}
// - Hangul (Hàn)               \p{Script=Hangul}
// - Bopomofo (chú âm)          \p{Script=Bopomofo}
// - Dấu câu CJK                U+3000–303F (。、《》「」…)
// - Dạng toàn/nửa rộng         U+FF00–FFEF (ký tự Latin/số/dấu fullwidth)
//
// Không dùng cờ `g` để `.test()` không giữ trạng thái `lastIndex` giữa các lần gọi.
export const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

/** Trả về true nếu chuỗi chứa bất kỳ chữ/biểu chữ CJK nào (Hán/Nhật/Hàn/fullwidth). */
export function containsCjkText(value: string): boolean {
  return CJK_TEXT_PATTERN.test(value);
}
