import type { BirthInput, ChartSnapshot, Horoscope, Palace, Star, ZiweiSummary } from '@ziweiai/contracts';
import { astro } from 'iztro';
import { createBaseSnapshotFields, createBlockedChartSnapshot } from './runtime-support';
import {
  parseIztroLunarDate,
  toBrightnessKey,
  toEarthlyBranchKey,
  toFiveElementsClassKey,
  toGenderKey,
  toHeavenlyStemKey,
  toMutagenKey,
  toPalaceKey,
  toSignKey,
  toStarKey,
  toTimeEarthlyBranchKey,
  toZodiacKey,
} from './iztro-key-maps';
import { PHASE3_CONFIG_PROFILE, PHASE3_IZTRO_CONFIG } from './phase-3-config';
import { normalizeBirthInput } from '../normalization/normalize-birth-input';
import { toIztroTimeIndex } from './iztro-time-index';
import { chartSystemRequiresGender } from '@ziweiai/contracts';
import type { AstrologyChartAdapter, ChartCalculationOptions } from './astro-adapter';

interface IztroStarSource {
  name: string;
  brightness?: string;
  mutagen?: string;
}

interface IztroPalaceSource {
  index: number;
  name: string;
  isBodyPalace: boolean;
  isOriginalPalace: boolean;
  heavenlyStem: string;
  earthlyBranch: string;
  majorStars: IztroStarSource[];
  minorStars: IztroStarSource[];
  adjectiveStars: IztroStarSource[];
  changsheng12: string;
  decadal: { range: [number, number] };
  ages: number[];
}

interface IztroHoroscopeItemSource {
  index: number;
  heavenlyStem: string;
  earthlyBranch: string;
  palaceNames: string[];
  mutagen: string[];
}

interface IztroHoroscopeAgeSource {
  index: number;
  nominalAge: number;
}

interface IztroHoroscopeSource {
  decadal: IztroHoroscopeItemSource;
  age: IztroHoroscopeAgeSource;
  yearly: IztroHoroscopeItemSource;
  // iztro cũng trả lưu nguyệt + lưu nhật khi gọi `.horoscope(date)`. Adapter lá số gốc
  // (US-006) không dùng nhưng engine vận hạn (US-014) cần — để optional cho tương thích.
  monthly?: IztroHoroscopeItemSource;
  daily?: IztroHoroscopeItemSource;
}

export interface IztroAstrolabeSource {
  gender: string;
  solarDate: string;
  lunarDate: string;
  time: string;
  zodiac: string;
  sign: string;
  fiveElementsClass: string;
  earthlyBranchOfSoulPalace: string;
  earthlyBranchOfBodyPalace: string;
  soul: string;
  body: string;
  palaces: IztroPalaceSource[];
  horoscope(date?: string | Date, timeIndex?: number): IztroHoroscopeSource;
}

const ZIWEI_ADAPTER_VERSION = {
  name: 'iztro',
  version: '2.5.8',
  configProfile: PHASE3_CONFIG_PROFILE,
} as const;

export function toIztroGender(input: BirthInput): '男' | '女' | null {
  if (input.sexOrGenderForChart === 'male') {
    return '男';
  }

  if (input.sexOrGenderForChart === 'female') {
    return '女';
  }

  return null;
}

function mapStarGroup(group: Star['group'], stars: IztroStarSource[]): Star[] {
  return stars.map((star) => ({
    nameKey: toStarKey(star.name),
    group,
    brightnessKey: toBrightnessKey(star.brightness),
    mutagen: toMutagenKey(star.mutagen),
  }));
}

function mapPalace(palace: IztroPalaceSource): Palace {
  return {
    nameKey: toPalaceKey(palace.name),
    index: palace.index,
    heavenlyStemKey: toHeavenlyStemKey(palace.heavenlyStem),
    earthlyBranchKey: toEarthlyBranchKey(palace.earthlyBranch),
    isBodyPalace: palace.isBodyPalace,
    isOriginalPalace: palace.isOriginalPalace,
    majorStars: mapStarGroup('major', palace.majorStars),
    minorStars: mapStarGroup('minor', palace.minorStars),
    adjectiveStars: mapStarGroup('adjective', palace.adjectiveStars),
    changsheng12Key: toStarKey(palace.changsheng12),
    decadalRange: palace.decadal.range,
    ages: palace.ages,
  };
}

export function mapHoroscopeItem(item: IztroHoroscopeItemSource) {
  return {
    index: item.index,
    heavenlyStemKey: toHeavenlyStemKey(item.heavenlyStem),
    earthlyBranchKey: toEarthlyBranchKey(item.earthlyBranch),
    palaceNameKeys: item.palaceNames.map(toPalaceKey),
    mutagenStarKeys: item.mutagen.map(toStarKey),
  };
}

export function mapHoroscopeAge(item: IztroHoroscopeAgeSource) {
  return {
    index: item.index,
    nominalAge: item.nominalAge,
  };
}

function mapHoroscope(source: IztroHoroscopeSource): Horoscope {
  return {
    decadal: mapHoroscopeItem(source.decadal),
    age: mapHoroscopeAge(source.age),
    yearly: mapHoroscopeItem(source.yearly),
  };
}

function buildZiweiSummary(source: IztroAstrolabeSource, timeIndex: number): ZiweiSummary {
  return {
    genderKey: toGenderKey(source.gender),
    solarDate: source.solarDate,
    lunarDate: parseIztroLunarDate(source.lunarDate),
    zodiacKey: toZodiacKey(source.zodiac),
    signKey: toSignKey(source.sign),
    timeEarthlyBranchKey: toTimeEarthlyBranchKey(timeIndex),
    soulPalaceNameKey: toPalaceKey(source.palaces.find((palace) => palace.earthlyBranch === source.earthlyBranchOfSoulPalace)?.name ?? source.palaces[0]?.name ?? ''),
    bodyPalaceNameKey: toPalaceKey(source.palaces.find((palace) => palace.earthlyBranch === source.earthlyBranchOfBodyPalace)?.name ?? source.palaces[0]?.name ?? ''),
    lifeMasterKey: toStarKey(source.soul),
    bodyMasterKey: toStarKey(source.body),
    fiveElementsClassKey: toFiveElementsClassKey(source.fiveElementsClass),
  };
}

function buildViewDate(viewYear?: number): Date {
  const year = viewYear ?? new Date().getUTCFullYear();
  // Neo vào giữa năm (1/7) để ngày luôn nằm trong chu kỳ lưu niên của năm dương lịch
  // được yêu cầu. Ngày 1/1 luôn rơi trước mốc đầu năm âm lịch (Tết) nên iztro sẽ tính
  // lưu niên và tuổi theo chu kỳ năm trước, gây lệch một năm.
  return new Date(Date.UTC(year, 6, 1));
}

/**
 * Dựng astrolabe iztro từ một `BirthInput` đã chuẩn hoá giới tính + chỉ số giờ.
 *
 * Tách ra để engine vận hạn (US-014 `computeZiweiHoroscope`) tái dùng đúng cùng
 * cấu hình + cùng chiều quay cung như khi lập lá số gốc — nếu dựng khác đường,
 * `index` cung Mệnh vận sẽ lệch so với `palace.index` của snapshot đã lưu.
 */
export function buildZiweiAstrolabeSource(
  input: BirthInput,
  gender: '男' | '女',
  timeIndex: number,
): IztroAstrolabeSource {
  astro.config(PHASE3_IZTRO_CONFIG);
  const dateStr = `${input.date.year}-${String(input.date.month).padStart(2, '0')}-${String(input.date.day).padStart(2, '0')}`;

  return (input.calendar === 'gregorian'
    ? astro.bySolar(dateStr, timeIndex, gender, true, 'zh-CN')
    : astro.byLunar(
        dateStr,
        timeIndex,
        gender,
        input.date.isLeapMonth ?? false,
        true,
        'zh-CN',
      )) as unknown as IztroAstrolabeSource;
}

export class IztroChartAdapter implements AstrologyChartAdapter {
  readonly system = 'zi-wei-dou-shu' as const;
  readonly adapterName = 'iztro';
  readonly adapterVersion = '2.5.8';
  readonly usesViewYear = true;

  async calculateChart(input: BirthInput, options?: ChartCalculationOptions): Promise<ChartSnapshot> {
    // Ziwei (Tử Vi Đẩu Số) là hệ duy nhất cần giới tính để xác định chiều thuận/nghịch của đại vận
    // qua thư viện iztro. Sử dụng explicit `chartSystemRequiresGender('zi-wei-dou-shu')` để nhất quán
    // style với 5 adapters khác (daliuren, qimen, meihua, liuyao, bazi), dù giá trị mặc định của
    // normalizeBirthInput là true khi không truyền options.
    const normalizedBirth = normalizeBirthInput(input, { requiresGender: chartSystemRequiresGender('zi-wei-dou-shu') });
    const warnings = [...normalizedBirth.normalizationConfidence.reasons];
    const gender = toIztroGender(input);
    const timeIndex = toIztroTimeIndex(input);

    // ZiWei Dou Shu requires gender - block if unknown
    if (input.sexOrGenderForChart === 'unknown') {
      return createBlockedChartSnapshot({
        input,
        normalizedBirth,
        chartSystem: 'zi-wei-dou-shu',
        canonicalLibrary: { name: 'iztro', version: '2.5.8' },
        adapterVersion: ZIWEI_ADAPTER_VERSION,
        confidence: normalizedBirth.normalizationConfidence,
        warnings,
      });
    }

    if (normalizedBirth.normalizationConfidence.blocksExactReading || !gender || timeIndex === null) {
      return createBlockedChartSnapshot({
        input,
        normalizedBirth,
        chartSystem: 'zi-wei-dou-shu',
        canonicalLibrary: { name: 'iztro', version: '2.5.8' },
        adapterVersion: ZIWEI_ADAPTER_VERSION,
        confidence: normalizedBirth.normalizationConfidence,
        warnings,
      });
    }

    const source = buildZiweiAstrolabeSource(input, gender, timeIndex);

    const base = createBaseSnapshotFields({
      input,
      chartSystem: 'zi-wei-dou-shu',
      canonicalLibrary: { name: 'iztro', version: '2.5.8' },
      adapterVersion: ZIWEI_ADAPTER_VERSION,
      normalizedBirth,
      calculationConfidence: normalizedBirth.normalizationConfidence,
      warnings,
    });

    return {
      ...base,
      palaces: source.palaces.map(mapPalace),
      pillars: [
        { name: 'Soul', value: toEarthlyBranchKey(source.earthlyBranchOfSoulPalace) },
        { name: 'Body', value: toEarthlyBranchKey(source.earthlyBranchOfBodyPalace) },
        { name: 'FiveElementsClass', value: toFiveElementsClassKey(source.fiveElementsClass) },
      ],
      summary: buildZiweiSummary(source, timeIndex),
      horoscope: mapHoroscope(source.horoscope(buildViewDate(options?.viewYear), timeIndex)),
    };
  }
}
