import { DREAM_SYMBOLS, type DreamSymbolData } from './data/dream-data';

// US-038 (backlog #42): khớp biểu tượng giấc mơ theo từ khóa. Port logic findDreamSymbols từ nguồn
// (.ref/FateAtelier): duyệt 56 biểu tượng, lá nào có keyword là chuỗi con (không phân biệt hoa
// thường) của mô tả giấc mơ thì khớp; dedupe theo keyword đầu để không trả trùng biểu tượng. Dữ
// liệu đã dịch sẵn sang tiếng Việt (pipeline B6-0) nên keyword khớp tiếng Việt (vd "rắn", "rồng").
//
// Khớp theo RANH GIỚI TỪ (Unicode) thay vì substring trần: keyword tiếng Việt ngắn (vd "rắn", "cá",
// "ăn") không còn khớp nhầm bên trong từ khác ("trắng", "các", "băn khoăn"). Ranh giới định nghĩa
// bằng ký tự KHÔNG phải chữ/số Unicode (\p{L}\p{N}) để giữ đúng dấu tiếng Việt.

export type { DreamSymbolData };

export const DREAM_SYMBOL_COUNT = DREAM_SYMBOLS.length;

// Số biểu tượng tối đa đưa vào prompt: giữ prompt gọn + tránh nhồi quá nhiều khi mô tả dài chạm
// nhiều keyword. Lấy theo thứ tự gặp trong dataset (ưu tiên biểu tượng phổ biến đứng trước).
const MAX_MATCHED_SYMBOLS = 6;

// Escape ký tự đặc biệt regex trong keyword (keyword là dữ liệu, không phải pattern tin cậy).
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Khớp keyword như một "từ" độc lập: hai biên là đầu/cuối chuỗi hoặc ký tự không phải chữ/số Unicode.
function matchesAsWord(content: string, keyword: string): boolean {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return false;
  }
  const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegExp(trimmed)}(?:[^\\p{L}\\p{N}]|$)`, 'iu');
  return pattern.test(content);
}

export function matchDreamSymbols(dream: string): DreamSymbolData[] {
  const content = dream.toLowerCase();
  const matched: DreamSymbolData[] = [];
  const seenFirstKeyword = new Set<string>();

  for (const symbol of DREAM_SYMBOLS) {
    const hit = symbol.keywords.some((keyword) => matchesAsWord(content, keyword.toLowerCase()));
    if (!hit) {
      continue;
    }
    const dedupeKey = symbol.keywords[0];
    if (seenFirstKeyword.has(dedupeKey)) {
      continue;
    }
    seenFirstKeyword.add(dedupeKey);
    matched.push(symbol);
    if (matched.length >= MAX_MATCHED_SYMBOLS) {
      break;
    }
  }

  return matched;
}
