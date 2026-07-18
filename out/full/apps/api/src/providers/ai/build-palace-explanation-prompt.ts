// Bộ dựng prompt luận giải Tử Vi theo từng cung / vận hạn (server-only).
//
// Bất biến ngôn ngữ (chốt với user): output AI phải 100% tiếng Việt, KHÔNG chữ Hán.
// Vì vậy mọi key snapshot (nameKey/brightness/mutagen/can-chi) được DỊCH sang thuật
// ngữ Hán-Việt Latin TRƯỚC khi nhồi vào prompt; không đưa key thô hay chữ Hán vào.
//
// Tham khảo cấu trúc (KHÔNG copy chữ Hán): `.ref/xuanshu/lib/ai/analysisPrompts.ts`
// (khung prompt theo cung Mệnh/Thân/chủ tinh/Tứ Hóa), persona "命理分析师" → dịch sang
// persona luận giải Tử Vi tiếng Việt.
import type { PalaceScope, ZiweiChartSnapshot } from '@ziweiai/contracts';
import * as ziweiCore from '@ziweiai/core';

type ZiweiPalace = ZiweiChartSnapshot['palaces'][number];
type ZiweiStar = ZiweiPalace['majorStars'][number];

// Độ sáng: dùng thuật ngữ Tử Vi Việt chuẩn (xian = Hãm). Khớp từ điển app
// (ziwei-terms-vi) để prompt và UI gọi cùng một tên.
const BRIGHTNESS_LABELS_VI: Record<string, string> = {
  miao: 'Miếu',
  wang: 'Vượng',
  de: 'Đắc',
  li: 'Lợi',
  ping: 'Bình',
  bu: 'Bất',
  xian: 'Hãm',
};

// Tứ Hóa theo key contract (lu/quyen/khoa/ky).
const MUTAGEN_LABELS_VI: Record<string, string> = {
  lu: 'Lộc',
  quyen: 'Quyền',
  khoa: 'Khoa',
  ky: 'Kỵ',
};

const HOROSCOPE_SCOPE_LABELS_VI: Record<string, string> = {
  decadal: 'Đại Vận',
  yearly: 'Lưu Niên',
};

const PERSONA_LINE = 'Bạn là chuyên gia luận giải Tử Vi Đẩu Số, văn phong trang trọng, súc tích.';
const LANGUAGE_INVARIANT_LINES = [
  'BẮT BUỘC: viết hoàn toàn bằng tiếng Việt, TUYỆT ĐỐI không dùng ký tự chữ Hán/Trung/Nhật/Hàn.',
  'Thuật ngữ Tử Vi dùng dạng Hán-Việt phiên âm Latin (ví dụ "Tử Vi", "Hóa Lộc", "Mệnh"), không ký tự Hán.',
  'Trả về Markdown khoảng 320-550 từ, giải thích kỹ và dễ hiểu cho người mới, giọng luận giải tử vi.',
];

// Trình tự suy luận chuẩn cho mọi mục luận giải Tử Vi: chính tinh trước, rồi độ sáng,
// rồi Tứ Hóa, sau đó mới mở rộng ra tam phương tứ chính. Đặt thành chỉ dẫn rõ ràng để
// model không nhảy thẳng vào kết luận mà bỏ qua các tầng dữ liệu trung gian.
const REASONING_ORDER_LINE =
  'Trình tự suy luận BẮT BUỘC: (1) đọc chính tinh tại bản cung; (2) xét độ sáng (Miếu/Vượng/Đắc/Lợi/Bình/Bất/Hãm) để định mức mạnh yếu; (3) xét Tứ Hóa (Lộc/Quyền/Khoa/Kỵ) tác động lên sao; (4) đối chiếu tam phương tứ chính để lấy bối cảnh; (5) tổng hợp thành luận giải, mỗi nhận định gắn với sao hoặc dữ kiện cụ thể bên trên.';

function translateToken(value: string): string {
  return ziweiCore.formatZiweiTokenVi(value);
}

function formatStar(star: ZiweiStar): string {
  const name = star.displayName && !ziweiCore.containsCjkText(star.displayName) ? star.displayName : translateToken(star.nameKey);
  const annotations = [
    star.brightnessKey ? BRIGHTNESS_LABELS_VI[star.brightnessKey] ?? translateToken(star.brightnessKey) : null,
    star.mutagen ? `Hóa ${MUTAGEN_LABELS_VI[star.mutagen] ?? translateToken(star.mutagen)}` : null,
  ].filter((annotation): annotation is string => Boolean(annotation));

  return annotations.length > 0 ? `${name} (${annotations.join(', ')})` : name;
}

function formatPalaceStars(palace: ZiweiPalace): string {
  const stars = [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars].map(formatStar);
  return stars.length > 0 ? stars.join(', ') : 'không có chính tinh';
}

function formatStemBranch(palace: ZiweiPalace): string {
  return [translateToken(palace.heavenlyStemKey), translateToken(palace.earthlyBranchKey)].filter(Boolean).join(' ');
}

function describePalace(palace: ZiweiPalace, roleLabel: string): string {
  const name = palace.displayName && !ziweiCore.containsCjkText(palace.displayName) ? palace.displayName : translateToken(palace.nameKey);
  return `${roleLabel} — ${name} [${formatStemBranch(palace)}]: ${formatPalaceStars(palace)}`;
}

// Tam phương tứ chính: đối cung + nhị hợp tam hợp theo vị trí địa chi (index 0-11).
function findPalaceByIndex(palaces: ZiweiPalace[], index: number): ZiweiPalace | undefined {
  return palaces.find((palace) => palace.index === index);
}

function buildPalaceScopeLines(snapshot: ZiweiChartSnapshot, target: ZiweiPalace): string[] {
  const opposite = findPalaceByIndex(snapshot.palaces, (target.index + 6) % 12);
  const trineForward = findPalaceByIndex(snapshot.palaces, (target.index + 4) % 12);
  const trineBackward = findPalaceByIndex(snapshot.palaces, (target.index + 8) % 12);

  return [
    'Cung cần luận giải:',
    describePalace(target, 'Bản cung'),
    'Tam phương tứ chính (bối cảnh hỗ trợ luận giải):',
    opposite ? describePalace(opposite, 'Đối cung') : 'Đối cung: không có dữ liệu',
    trineForward ? describePalace(trineForward, 'Tam hợp') : 'Tam hợp: không có dữ liệu',
    trineBackward ? describePalace(trineBackward, 'Tam hợp') : 'Tam hợp: không có dữ liệu',
  ];
}

function formatHoroscopeMutagens(mutagenStarKeys: string[]): string {
  const stars = mutagenStarKeys.map(translateToken).filter(Boolean);
  return stars.length > 0 ? stars.join(', ') : 'không có';
}

function buildHoroscopeScopeLines(snapshot: ZiweiChartSnapshot, scope: 'decadal' | 'yearly'): string[] {
  const horoscope = snapshot.horoscope;
  if (!horoscope) {
    return [`Không có dữ liệu ${HOROSCOPE_SCOPE_LABELS_VI[scope]} trong lá số này.`];
  }

  const item = horoscope[scope];
  if (!item) {
    return [`Không có dữ liệu ${HOROSCOPE_SCOPE_LABELS_VI[scope]} trong lá số này.`];
  }

  const palaces = item.palaceNameKeys.map(translateToken).filter(Boolean).join(', ') || 'không có';
  const lines = [
    `Vận hạn cần luận giải: ${HOROSCOPE_SCOPE_LABELS_VI[scope]}`,
    `Can Chi: ${[translateToken(item.heavenlyStemKey), translateToken(item.earthlyBranchKey)].filter(Boolean).join(' ')}`,
    `Cung an: ${palaces}`,
    `Tứ Hóa: ${formatHoroscopeMutagens(item.mutagenStarKeys)}`,
  ];

  // Mục Lưu Niên gói thêm dữ liệu Tiểu Vận theo tuổi (snapshot.horoscope.age).
  if (scope === 'yearly') {
    if (horoscope.age) {
      lines.push(`Tiểu Vận: tuổi ${horoscope.age.nominalAge}, cung số ${horoscope.age.index + 1}`);
    }
  }

  return lines;
}

function resolveScopeLabel(scope: PalaceScope): string {
  return HOROSCOPE_SCOPE_LABELS_VI[scope] ?? translateToken(scope);
}

/**
 * Dựng prompt luận giải cho một cung hoặc mục vận hạn cụ thể. Trả về chuỗi prompt
 * tiếng Việt đã dịch toàn bộ thuật ngữ — KHÔNG còn key thô hay chữ Hán.
 * explanationKind (optional) được giữ để tương thích với luồng cũ và cho phép
 * chủ đề cụ thể (love/career/health/relationship) ngay cả khi dùng per-palace.
 */
export function buildPalaceExplanationPrompt(
  snapshot: ZiweiChartSnapshot,
  palaceScope: PalaceScope,
  explanationKind?: string,
): string {
  const scopeLines =
    palaceScope === 'decadal' || palaceScope === 'yearly'
      ? buildHoroscopeScopeLines(snapshot, palaceScope)
      : (() => {
          // Ưu tiên match theo nameKey (standard scopes)
          let target = snapshot.palaces.find((palace: ZiweiPalace) => palace.nameKey === palaceScope);

          // Fallback: match theo displayName đã dịch (legacy snapshots dùng legacyPalace0-11)
          if (!target) {
            const scopeLabel = resolveScopeLabel(palaceScope);
            target = snapshot.palaces.find((palace: ZiweiPalace) => {
              const displayName = palace.displayName && !ziweiCore.containsCjkText(palace.displayName)
                ? palace.displayName
                : translateToken(palace.nameKey);
              return displayName === scopeLabel;
            });
          }

          return target
            ? buildPalaceScopeLines(snapshot, target)
            : [`Không tìm thấy dữ liệu cung "${resolveScopeLabel(palaceScope)}" trong lá số.`];
        })();

  const kindLine = explanationKind ? `Mục đích luận giải: ${explanationKind}` : null;

  return [
    PERSONA_LINE,
    ...LANGUAGE_INVARIANT_LINES,
    `Hệ lá số: Tử Vi Đẩu Số`,
    `Mục luận giải: ${resolveScopeLabel(palaceScope)}`,
    ...(kindLine ? [kindLine] : []),
    ...scopeLines,
    REASONING_ORDER_LINE,
    'Cấu trúc bài viết theo các đề mục Markdown sau, đúng thứ tự: "## Tổng quan", "## Điểm mạnh", "## Điểm cần lưu ý", "## Lời khuyên".',
  ].join('\n');
}
