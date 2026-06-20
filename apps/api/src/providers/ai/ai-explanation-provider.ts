import type { ChartSnapshot, ExplanationContext, PalaceScope } from '@ziweiai/contracts';
import * as ziweiCore from '@ziweiai/core';
import { buildBaziExplanationPrompt } from './build-bazi-explanation-prompt';
import { buildMeihuaExplanationPrompt } from './build-meihua-explanation-prompt';
import { buildLiuyaoExplanationPrompt } from './build-liuyao-explanation-prompt';
import { buildDaliurenExplanationPrompt } from './build-daliuren-explanation-prompt';
import { buildQimenExplanationPrompt } from './build-qimen-explanation-prompt';
import { buildPalaceExplanationPrompt } from './build-palace-explanation-prompt';
import { EXPLANATION_SYSTEM_PROMPT } from './explanation-system-prompt';

export { EXPLANATION_SYSTEM_PROMPT };

export interface ExplanationProviderResult {
  renderedMarkdown: string;
  providerMetadata: Record<string, string>;
}

export interface ExplanationPromptPayload {
  chartSnapshot: ChartSnapshot;
  explanationKind: string;
  explanationContext: ExplanationContext;
  // Khi có và lá số là Tử Vi, prompt sinh riêng cho cung/vận hạn đó (14 mục).
  palaceScope?: PalaceScope;
  // Cho phép caller override model cụ thể của provider. Field nội bộ, hiện chưa có
  // nguồn public nào set (luôn undefined) — provider fallback về ENV model mặc định.
  // Khi expose qua public input sau này phải kèm allowlist + đưa model vào idempotency key.
  modelOverride?: string;
  // US-016: prompt user dựng sẵn (vd báo cáo năm) để tái dùng provider chain (timeout + CJK
  // guard + failover) thay vì viết provider riêng. Khi set, provider dùng chuỗi này làm user
  // message thay cho `buildExplanationPrompt(payload)`. System prompt vẫn là EXPLANATION_SYSTEM_PROMPT.
  promptOverride?: string;
  // US-016: override timeout (ms) cho call provider này, thay cho AI_PROVIDER_TIMEOUT_MS mặc định.
  // Báo cáo năm tổng hợp lưu niên + 12 lưu nguyệt (~600-1200 từ) nên sinh lâu hơn explanation
  // thường — đường annual truyền AI_ANNUAL_REPORT_TIMEOUT_MS để không bị 504 ở 15s. Khi không set,
  // provider dùng AI_PROVIDER_TIMEOUT_MS như cũ.
  timeoutMsOverride?: number;
}

export interface AiExplanationProvider {
  readonly providerName: string;
  isAvailable(): boolean;
  generateExplanation(payload: ExplanationPromptPayload): Promise<ExplanationProviderResult>;
}

const legacyZodiacMap: Record<string, string> = {
  鼠: 'Chuột',
  牛: 'Trâu',
  虎: 'Hổ',
  兔: 'Mèo',
  龙: 'Rồng',
  蛇: 'Rắn',
  马: 'Ngựa',
  羊: 'Dê',
  猴: 'Khỉ',
  鸡: 'Gà',
  狗: 'Chó',
  猪: 'Heo',
};

const legacySignMap: Record<string, string> = {
  白羊座: 'Bạch Dương',
  金牛座: 'Kim Ngưu',
  双子座: 'Song Tử',
  巨蟹座: 'Cự Giải',
  狮子座: 'Sư Tử',
  处女座: 'Xử Nữ',
  天秤座: 'Thiên Bình',
  天蝎座: 'Bọ Cạp',
  射手座: 'Nhân Mã',
  摩羯座: 'Ma Kết',
  水瓶座: 'Bảo Bình',
  双鱼座: 'Song Ngư',
};

function humanizeKey(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

function normalizeLegacyTime(value: string): string {
  const match = value.match(/^([子丑寅卯辰巳午未申酉戌亥])时$/u);
  if (!match) {
    return value;
  }

  return `Giờ ${formatStringValue(match[1])}`;
}

function formatStringValue(value: string): string {
  if (!value) {
    return '';
  }

  const translated = ziweiCore.formatZiweiTokenVi(value);
  return translated !== value ? translated : ziweiCore.containsCjkText(value) ? value : humanizeKey(value);
}

function formatSummaryValue(label: string, value: unknown): string {
  if (typeof value === 'string') {
    if (label === 'lunarDate' && ziweiCore.containsCjkText(value)) {
      return ziweiCore.normalizeLegacyLunarDate(value);
    }

    if (label === 'time') {
      return normalizeLegacyTime(value);
    }

    if (label === 'sign' && legacySignMap[value]) {
      return legacySignMap[value];
    }

    if (label === 'zodiac' && legacyZodiacMap[value]) {
      return legacyZodiacMap[value];
    }

    return formatStringValue(value);
  }

  if (typeof value !== 'object' || value === null || !('day' in value) || !('month' in value) || !('year' in value) || !('isLeapMonth' in value)) {
    return JSON.stringify(value);
  }

  const typedValue = value as {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
    sexagenaryYearKey?: string;
  };

  const day = String(typedValue.day).padStart(2, '0');
  const month = String(typedValue.month).padStart(2, '0');
  const leapSuffix = typedValue.isLeapMonth ? ' leap' : '';
  const sexagenary = typedValue.sexagenaryYearKey ? ` ${humanizeKey(typedValue.sexagenaryYearKey)}` : '';

  return `${day}/${month}/${typedValue.year}${leapSuffix}${sexagenary}`;
}

function flattenPalaceStars(snapshot: ChartSnapshot['palaces'][number] | { stars?: string[] }) {
  if ('majorStars' in snapshot) {
    return [...snapshot.majorStars, ...snapshot.minorStars, ...snapshot.adjectiveStars]
      .map((star) => formatStringValue(star.displayName ?? star.nameKey))
      .join(', ');
  }

  return (snapshot.stars ?? []).map((star) => formatStringValue(star)).join(', ');
}

function formatHoroscopeItem(item: {
  heavenlyStemKey: string;
  earthlyBranchKey: string;
  palaceNameKeys: string[];
  mutagenStarKeys: string[];
}): string {
  const palaces = item.palaceNameKeys.map((key) => formatStringValue(key)).join(', ') || 'none';
  const mutagens = item.mutagenStarKeys.map((key) => formatStringValue(key)).join(', ') || 'none';
  return `${formatStringValue(item.heavenlyStemKey)} ${formatStringValue(item.earthlyBranchKey)}; cung: ${palaces}; tứ hóa: ${mutagens}`;
}

export function buildExplanationPrompt(payload: ExplanationPromptPayload): string {
  if (payload.chartSnapshot.chartSystem === 'ba-zi') {
    return buildBaziExplanationPrompt(payload.chartSnapshot, payload.explanationKind);
  }

  if (payload.chartSnapshot.chartSystem === 'mei-hua-yi-shu') {
    return buildMeihuaExplanationPrompt(payload.chartSnapshot, payload.explanationKind);
  }

  if (payload.chartSnapshot.chartSystem === 'liu-yao') {
    return buildLiuyaoExplanationPrompt(payload.chartSnapshot, payload.explanationKind);
  }

  if (payload.chartSnapshot.chartSystem === 'da-liu-ren') {
    return buildDaliurenExplanationPrompt(payload.chartSnapshot, payload.explanationKind);
  }

  if (payload.chartSnapshot.chartSystem === 'qi-men-dun-jia') {
    return buildQimenExplanationPrompt(payload.chartSnapshot, payload.explanationKind);
  }

  // Luận giải theo từng cung/vận hạn (Phase 5) chỉ áp dụng cho Tử Vi; các hệ khác
  // hoặc luồng overview cũ vẫn dùng prompt tổng quan bên dưới.
  if (payload.palaceScope && payload.chartSnapshot.chartSystem === 'zi-wei-dou-shu') {
    // Preserve explanationKind even for per-palace (P2 from review).
    // The palace-specific prompt now receives the requested kind so the AI can tailor
    // (e.g. "love" reading focused on spousePalace, "career" on careerPalace, etc.).
    return buildPalaceExplanationPrompt(
      payload.chartSnapshot as ChartSnapshot & { chartSystem: 'zi-wei-dou-shu' },
      payload.palaceScope,
      payload.explanationKind,
    );
  }

  const palaceSummary = payload.chartSnapshot.palaces
    .map((palace) =>
      `${formatStringValue(
        'nameKey' in palace ? palace.displayName ?? palace.nameKey : (palace as { name?: string }).name ?? '',
      )}: ${flattenPalaceStars(palace as ChartSnapshot['palaces'][number] | { stars?: string[] }) || 'none'}`,
    )
    .join('\n');
  const pillarSummary = payload.chartSnapshot.pillars
    .map((pillar) => `${humanizeKey(pillar.name)}: ${formatStringValue(pillar.value ?? '')}`)
    .join('\n');
  const summaryLines = Object.entries(payload.chartSnapshot.summary)
    .map(([label, value]) => `${formatStringValue(label)}: ${formatSummaryValue(label, value)}`)
    .join('\n');
  const horoscope = payload.chartSnapshot.horoscope;
  const horoscopeLines = horoscope
    ? [
        `Đại vận: ${formatHoroscopeItem(horoscope.decadal)}`,
        `Lưu niên: ${formatHoroscopeItem(horoscope.yearly)}`,
        `Tiểu vận: tuổi ${horoscope.age.nominalAge}, cung số ${horoscope.age.index + 1}`,
      ].join('\n')
    : '';

  // Fix suggestion từ review PR #5: thống nhất bất biến ngôn ngữ cho legacy overview path (kể cả Ziwei không có palaceScope).
  // Trước đây prompt tiếng Anh + chỉ "return in Vietnamese" dễ dẫn model trả CJK.
  // Giờ dùng persona + LANGUAGE_INVARIANT tương tự per-palace path (dù không đầy đủ 14 scopes context).
  const isZiwei = payload.chartSnapshot.chartSystem === 'zi-wei-dou-shu';
  const legacyPersona = isZiwei
    ? 'Bạn là chuyên gia luận giải Tử Vi Đẩu Số, văn phong trang trọng, súc tích.'
    : 'Bạn là trợ lý luận giải huyền học của ZIWEI AI.';
  const legacyLanguage = isZiwei
    ? [
        'BẮT BUỘC: viết hoàn toàn bằng tiếng Việt, TUYỆT ĐỐI không dùng ký tự chữ Hán/Trung/Nhật/Hàn.',
        'Thuật ngữ Tử Vi dùng dạng Hán-Việt phiên âm Latin (ví dụ "Tử Vi", "Hóa Lộc", "Mệnh"), không ký tự Hán.',
        'Trả về Markdown khoảng 320-550 từ, giải thích kỹ và dễ hiểu cho người mới, giọng luận giải tử vi.',
      ]
    : ['BẮT BUỘC: viết hoàn toàn bằng tiếng Việt, không dùng ký tự chữ Hán/Trung/Nhật/Hàn.'];

  return [
    legacyPersona,
    ...legacyLanguage,
    `Mục đích luận giải: ${payload.explanationKind}`,
    `Hệ lá số: ${payload.chartSnapshot.chartSystem}`,
    `Mức độ tin cậy: ${payload.explanationContext.confidence.level}`,
    `Cảnh báo hiển thị: ${payload.explanationContext.visibleMessageKeys.join(', ') || 'không có'}`,
    'Tóm tắt lá số:',
    summaryLines || 'không có',
    'Các trụ:',
    pillarSummary || 'không có',
    'Các cung:',
    palaceSummary || 'không có',
    'Vận hạn:',
    horoscopeLines || 'không có',
  ].join('\n');
}
