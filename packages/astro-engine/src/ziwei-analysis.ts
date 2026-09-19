import {
  toPalaceKey,
  toHeavenlyStemKey,
  toEarthlyBranchKey,
  toStarKey,
} from './adapters/iztro-key-maps';
import type { IztroAstrolabeSource } from './adapters/iztro-chart-adapter';

export interface FlankingPalaceAnalysis {
  targetIndex: number;
  targetPalaceNameKey: string;
  previousIndex: number;
  previousPalaceNameKey: string;
  nextIndex: number;
  nextPalaceNameKey: string;
  /** Các cách cục Giáp Cung kinh điển */
  patterns: Array<
    | 'giap_kinh_da'
    | 'giap_ta_huu'
    | 'giap_xuong_khuc'
    | 'giap_khoi_viet'
    | 'giap_hoa_loc'
    | 'giap_hoa_quyen'
    | 'giap_hoa_khoa'
    | 'giap_hoa_ky'
  >;
  hasKinhDa: boolean;
  hasTaHuu: boolean;
  hasXuongKhuc: boolean;
  hasKhoiViet: boolean;
  hasMutagenLu: boolean;
  hasMutagenQuyen: boolean;
  hasMutagenKhoa: boolean;
  hasMutagenKy: boolean;
}

export interface DecadalTimelineItem {
  index: number;
  palaceNameKey: string;
  heavenlyStemKey: string;
  earthlyBranchKey: string;
  ageRange: [number, number];
  yearRange: [number, number];
  mutagenStarKeys: string[];
}

export interface YearlyTimelineItem {
  index: number;
  heavenlyStemKey: string;
  earthlyBranchKey: string;
  age: number;
  year: number;
  palaceNameKeys: string[];
  mutagenStarKeys: string[];
}

export interface MonthlyTimelineItem {
  index: number;
  heavenlyStemKey: string;
  earthlyBranchKey: string;
  year: number;
  month: number;
  isLeapMonth: boolean;
  part: 'normal' | 'first' | 'second';
  dayRange: [number, number];
  palaceNameKeys: string[];
  mutagenStarKeys: string[];
}

/**
 * Phân tích Giáp Cung (flankingPalaces) cho 1 cung vị mục tiêu trong lá số Tử Vi.
 * Tận dụng `astrolabe.flankingPalaces()` từ iztro v2.6.x để phát hiện các cách cục
 * Giáp Kình Đà, Giáp Tứ Hóa, Giáp Tả Hữu, Giáp Xương Khúc.
 * Toàn bộ kết quả ánh xạ sang ChartKey (0 chữ Hán rò rỉ).
 */
export function analyzeFlankingPalaces(
  astrolabe: IztroAstrolabeSource,
  targetIndex: number,
): FlankingPalaceAnalysis {
  const flanking = astrolabe.flankingPalaces(targetIndex);

  const targetPalace = astrolabe.palaces[targetIndex];
  const prevPalace = flanking.previous;
  const nextPalace = flanking.next;

  const hasKinhDa = Boolean(flanking.have?.(['擎羊', '陀罗']));
  const hasTaHuu = Boolean(flanking.have?.(['左辅', '右弼']));
  const hasXuongKhuc = Boolean(flanking.have?.(['文昌', '文曲']));
  const hasKhoiViet = Boolean(flanking.have?.(['天魁', '天钺']));

  const hasMutagenLu = Boolean(flanking.haveMutagen?.('禄'));
  const hasMutagenQuyen = Boolean(flanking.haveMutagen?.('权'));
  const hasMutagenKhoa = Boolean(flanking.haveMutagen?.('科'));
  const hasMutagenKy = Boolean(flanking.haveMutagen?.('忌'));

  const patterns: FlankingPalaceAnalysis['patterns'] = [];
  if (hasKinhDa) patterns.push('giap_kinh_da');
  if (hasTaHuu) patterns.push('giap_ta_huu');
  if (hasXuongKhuc) patterns.push('giap_xuong_khuc');
  if (hasKhoiViet) patterns.push('giap_khoi_viet');
  if (hasMutagenLu) patterns.push('giap_hoa_loc');
  if (hasMutagenQuyen) patterns.push('giap_hoa_quyen');
  if (hasMutagenKhoa) patterns.push('giap_hoa_khoa');
  if (hasMutagenKy) patterns.push('giap_hoa_ky');

  return {
    targetIndex,
    targetPalaceNameKey: toPalaceKey(targetPalace?.name ?? ''),
    previousIndex: prevPalace.index,
    previousPalaceNameKey: toPalaceKey(prevPalace.name),
    nextIndex: nextPalace.index,
    nextPalaceNameKey: toPalaceKey(nextPalace.name),
    patterns,
    hasKinhDa,
    hasTaHuu,
    hasXuongKhuc,
    hasKhoiViet,
    hasMutagenLu,
    hasMutagenQuyen,
    hasMutagenKhoa,
    hasMutagenKy,
  };
}

/**
 * Phân tích Giáp Cung cho toàn bộ 12 cung vị của lá số.
 */
export function analyzeAllFlankingPalaces(
  astrolabe: IztroAstrolabeSource,
): FlankingPalaceAnalysis[] {
  return Array.from({ length: 12 }, (_, i) => analyzeFlankingPalaces(astrolabe, i));
}

/**
 * Trích xuất danh sách Đại Hạn chuẩn hóa từ iztro decadalList().
 */
export function extractDecadalTimeline(
  astrolabe: IztroAstrolabeSource,
): DecadalTimelineItem[] {
  if (typeof astrolabe.decadalList !== 'function') {
    return [];
  }
  return astrolabe.decadalList().map((item) => ({
    index: item.index,
    palaceNameKey: toPalaceKey(item.palaceName),
    heavenlyStemKey: toHeavenlyStemKey(item.heavenlyStem),
    earthlyBranchKey: toEarthlyBranchKey(item.earthlyBranch),
    ageRange: item.ageRange,
    yearRange: item.yearRange,
    mutagenStarKeys: (item.mutagen ?? []).map(toStarKey),
  }));
}

/**
 * Trích xuất danh sách Lưu Niên của một Đại Hạn từ iztro yearlyList().
 */
export function extractYearlyTimeline(
  astrolabe: IztroAstrolabeSource,
  decadalIndexOrName: number | string = 0,
): YearlyTimelineItem[] {
  if (typeof astrolabe.yearlyList !== 'function') {
    return [];
  }
  return astrolabe.yearlyList(decadalIndexOrName).map((item) => ({
    index: item.index,
    heavenlyStemKey: toHeavenlyStemKey(item.heavenlyStem),
    earthlyBranchKey: toEarthlyBranchKey(item.earthlyBranch),
    age: item.age,
    year: item.year,
    palaceNameKeys: (item.palaceNames ?? []).map(toPalaceKey),
    mutagenStarKeys: (item.mutagen ?? []).map(toStarKey),
  }));
}

/**
 * Trích xuất danh sách Lưu Nguyệt của một năm từ iztro monthlyList().
 */
export function extractMonthlyTimeline(
  astrolabe: IztroAstrolabeSource,
  year: number,
  fixLeap: boolean = true,
): MonthlyTimelineItem[] {
  if (typeof astrolabe.monthlyList !== 'function') {
    return [];
  }
  return astrolabe.monthlyList(year, fixLeap).map((item) => ({
    index: item.index,
    heavenlyStemKey: toHeavenlyStemKey(item.heavenlyStem),
    earthlyBranchKey: toEarthlyBranchKey(item.earthlyBranch),
    year: item.year,
    month: item.month,
    isLeapMonth: Boolean(item.isLeapMonth),
    part: item.part,
    dayRange: item.dayRange,
    palaceNameKeys: (item.palaceNames ?? []).map(toPalaceKey),
    mutagenStarKeys: (item.mutagen ?? []).map(toStarKey),
  }));
}
