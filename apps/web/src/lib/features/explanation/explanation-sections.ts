import type { PalaceScope } from '@ziweiai/contracts';
import { translateZiweiKey } from '../../i18n/ziwei-terms-vi';

export type ExplanationSection = {
  scope: PalaceScope | null; // null = overview (no palaceScope)
  label: string;
};

// Thứ tự 12 cung theo quyết định người dùng (Mệnh trước, rồi Quan Lộc, Tài Bạch…).
// Mỗi scope là nameKey cung của engine → dịch nhãn qua từ điển fail-fast (ziwei-terms-vi).
const PALACE_SCOPE_ORDER: PalaceScope[] = [
  'soulPalace',
  'careerPalace',
  'wealthPalace',
  'spousePalace',
  'parentsPalace',
  'siblingsPalace',
  'childrenPalace',
  'healthPalace',
  'propertyPalace',
  'friendsPalace',
  'spiritPalace',
  'surfacePalace',
];

// 15 mục = Overview + 12 cung + Đại Vận + Lưu Niên
// Overview dùng palaceScope = null (gọi API không gửi palaceScope field)
export function buildExplanationSections(horoscopeLabels: { decadal: string; yearly: string }): ExplanationSection[] {
  return [
    { scope: null, label: 'Tổng quan' }, // Overview explanation (backward compatible)
    ...PALACE_SCOPE_ORDER.map((scope) => ({ scope, label: translateZiweiKey(scope) })),
    { scope: 'decadal', label: horoscopeLabels.decadal },
    { scope: 'yearly', label: horoscopeLabels.yearly },
  ];
}

export type PersistedExplanationResult = {
  renderedMarkdown: string;
  providerMetadata?: Record<string, string>;
};

// Lập bảng tra scope -> result để hydrate section card ngay từ chart detail.
// Khóa theo scope (null = 'overview') NHƯNG phải lọc theo expectedKind: một chart có thể có nhiều
// result cùng scope khác explanationKind (ví dụ overview + love cho spousePalace). Nếu không lọc,
// card overview có thể seed nhầm markdown của kind khác (listExplanationResultsForChart trả newest-first).
//
// Hai pass để không seed nhầm cho lịch sử trộn legacy:
//   Pass 1 — chỉ nhận record có explanationKind KHỚP expectedKind (record mới, metadata đầy đủ).
//   Pass 2 — với scope còn trống, fallback nhận record cũ thiếu explanationKind (backward-compatible).
// Nhờ vậy record cũ ambiguous (ví dụ love/career legacy cùng scope) KHÔNG che mất record overview thật
// khi record overview tồn tại; legacy chỉ dùng khi không có kind-match nào cho scope đó.
export function buildHydrationResultByScope(
  results: PersistedExplanationResult[] | undefined,
  expectedKind: string,
): Map<string, { renderedMarkdown: string }> {
  const map = new Map<string, { renderedMarkdown: string }>();
  if (!results) {
    return map;
  }

  const scopeKeyOf = (r: PersistedExplanationResult): string => r.providerMetadata?.palaceScope ?? 'overview';

  // Pass 1: kind khớp tường minh (newest-first → record khớp đầu tiên là mới nhất, không ghi đè).
  for (const r of results) {
    if (r.providerMetadata?.explanationKind !== expectedKind) {
      continue;
    }
    const key = scopeKeyOf(r);
    if (!map.has(key)) {
      map.set(key, { renderedMarkdown: r.renderedMarkdown });
    }
  }

  // Pass 2: fallback legacy (thiếu explanationKind) chỉ cho scope chưa có kind-match.
  for (const r of results) {
    if (r.providerMetadata?.explanationKind !== undefined) {
      continue;
    }
    const key = scopeKeyOf(r);
    if (!map.has(key)) {
      map.set(key, { renderedMarkdown: r.renderedMarkdown });
    }
  }

  return map;
}
