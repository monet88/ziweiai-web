import { DREAM_SYMBOLS, type DreamSymbolData } from './data/dream-data';

// US-038 (backlog #42): khớp biểu tượng giấc mơ theo từ khóa. Port logic findDreamSymbols từ nguồn
// (.ref/FateAtelier): duyệt 56 biểu tượng, lá nào có keyword là chuỗi con (không phân biệt hoa
// thường) của mô tả giấc mơ thì khớp; dedupe theo keyword đầu để không trả trùng biểu tượng. Dữ
// liệu đã dịch sẵn sang tiếng Việt (pipeline B6-0) nên keyword khớp tiếng Việt (vd "rắn", "rồng").

export type { DreamSymbolData };

export const DREAM_SYMBOL_COUNT = DREAM_SYMBOLS.length;

// Số biểu tượng tối đa đưa vào prompt: giữ prompt gọn + tránh nhồi quá nhiều khi mô tả dài chạm
// nhiều keyword. Lấy theo thứ tự gặp trong dataset (ưu tiên biểu tượng phổ biến đứng trước).
const MAX_MATCHED_SYMBOLS = 6;

export function matchDreamSymbols(dream: string): DreamSymbolData[] {
  const content = dream.toLowerCase();
  const matched: DreamSymbolData[] = [];
  const seenFirstKeyword = new Set<string>();

  for (const symbol of DREAM_SYMBOLS) {
    const hit = symbol.keywords.some((keyword) => content.includes(keyword.toLowerCase()));
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
