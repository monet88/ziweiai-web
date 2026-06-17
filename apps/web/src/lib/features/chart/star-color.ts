import type { StarTokenView } from './palace-view-builder';
import type { BrightnessKey, MutagenKey } from '@ziweiai/contracts';

/**
 * Danh sách hung tinh thuộc nhóm phụ (minor malefic).
 * Dùng để tô tone cảnh báo (đỏ-xám) khác biệt với cát tinh phụ.
 * Nguồn ý đồ từ lá số giấy truyền thống (tham chiếu .ref/taibu).
 */
/**
 * Danh sách hung tinh thuộc nhóm phụ (minor malefic).
 * Danh sách này phải khớp với các key sao phụ trong contracts (star.nameKey).
 * Nếu contracts thay đổi, test star-color.test.ts sẽ fail khi snapshot mới xuất hiện hung tinh mới.
 */
export const MINOR_MALEFIC_KEYS = [
  'huoxingMin',
  'lingxingMin',
  'qingyangMin',
  'tuoluoMin',
  'dikongMin',
  'dijieMin',
] as const;

export type MinorMaleficKey = (typeof MINOR_MALEFIC_KEYS)[number];

/** CSS custom property tokens cho 7 cấp độ sáng (brightness). */
const BRIGHTNESS_COLOR_TOKENS: Record<BrightnessKey, string> = {
  miao: '--star-brightness-miao',
  wang: '--star-brightness-wang',
  de: '--star-brightness-de',
  li: '--star-brightness-li',
  ping: '--star-brightness-ping',
  bu: '--star-brightness-bu',
  xian: '--star-brightness-xian',
};

/** CSS custom property tokens cho 4 tứ hóa (mutagen). */
const MUTAGEN_COLOR_TOKENS: Record<MutagenKey, string> = {
  lu: '--star-mutagen-lu',
  quyen: '--star-mutagen-quyen',
  khoa: '--star-mutagen-khoa',
  ky: '--star-mutagen-ky',
};

const MALEFIC_NAME_TOKEN = '--star-malefic-name';

/** Mô tả ngắn tiếng Việt cho tooltip brightness (đọc từ key, không Hán). */
const BRIGHTNESS_DESC: Record<BrightnessKey, string> = {
  miao: 'sáng nhất',
  wang: 'rất sáng',
  de: 'đắc địa',
  li: 'lợi thế',
  ping: 'bình thường',
  bu: 'kém',
  xian: 'hãm',
};

/** Mô tả ngắn tiếng Việt cho tooltip tứ hóa. */
const MUTAGEN_DESC: Record<MutagenKey, string> = {
  lu: 'tài lộc, hanh thông',
  quyen: 'quyền lực',
  khoa: 'văn chương, danh tiếng',
  ky: 'trở ngại, cần thận trọng',
};

/**
 * Trả về màu sắc (dạng var(--token)) và cờ malefic cho một sao.
 * Hàm thuần, không side-effect, an toàn với snapshot legacy (thiếu key).
 *
 * @param star StarTokenView (có thể thiếu brightnessKey/mutagenKey)
 * @returns object với nameColor, brightnessColor, mutagenColor (dạng 'var(--...)' hoặc null), isMalefic
 */
export function getStarColors(star: StarTokenView): {
  nameColor: string | null;
  brightnessColor: string | null;
  mutagenColor: string | null;
  isMalefic: boolean;
} {
  const isMalefic = MINOR_MALEFIC_KEYS.includes(star.key as MinorMaleficKey);

  const brightnessColor = star.brightnessKey
    ? `var(${BRIGHTNESS_COLOR_TOKENS[star.brightnessKey]})`
    : null;

  const mutagenColor = star.mutagenKey
    ? `var(${MUTAGEN_COLOR_TOKENS[star.mutagenKey]})`
    : null;

  // Chỉ tô tên sao cho hung tinh phụ; chủ tinh giữ màu theo nhóm (major/minor) để không xung đột.
  const nameColor = isMalefic ? `var(${MALEFIC_NAME_TOKEN})` : null;

  return {
    nameColor,
    brightnessColor,
    mutagenColor,
    isMalefic,
  };
}

/**
 * Xây tooltip tiếng Việt ngắn gọn khi sao có brightness hoặc mutagen.
 * Dùng title thuần (không component nặng) để hỗ trợ focus bàn phím (a11y).
 */
export function getStarTitle(star: StarTokenView): string | undefined {
  const parts: string[] = [];

  if (star.brightness && star.brightnessKey) {
    parts.push(`${star.brightness} — ${BRIGHTNESS_DESC[star.brightnessKey]}`);
  }
  if (star.mutagen && star.mutagenKey) {
    parts.push(`${star.mutagen} — ${MUTAGEN_DESC[star.mutagenKey]}`);
  }

  return parts.length > 0 ? parts.join(' · ') : undefined;
}
