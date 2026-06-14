export const baziPillarSlots = ['year', 'month', 'day', 'hour'] as const;
export const baziHeavenlyStemKeys = [
  'jiaHeavenly',
  'yiHeavenly',
  'bingHeavenly',
  'dingHeavenly',
  'wuHeavenly',
  'jiHeavenly',
  'gengHeavenly',
  'xinHeavenly',
  'renHeavenly',
  'guiHeavenly',
] as const;
export const baziEarthlyBranchKeys = [
  'ziEarthly',
  'chouEarthly',
  'yinEarthly',
  'maoEarthly',
  'chenEarthly',
  'siEarthly',
  'wuEarthly',
  'weiEarthly',
  'shenEarthly',
  'youEarthly',
  'xuEarthly',
  'haiEarthly',
] as const;
export const baziFiveElementKeys = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
export const baziTenGodKeys = [
  'biJian',
  'jieCai',
  'shiShen',
  'shangGuan',
  'pianCai',
  'zhengCai',
  'qiSha',
  'zhengGuan',
  'pianYin',
  'zhengYin',
  'riZhu',
] as const;

export type BaziPillarSlot = (typeof baziPillarSlots)[number];
export type BaziHeavenlyStemKey = (typeof baziHeavenlyStemKeys)[number];
export type BaziEarthlyBranchKey = (typeof baziEarthlyBranchKeys)[number];
export type BaziFiveElementKey = (typeof baziFiveElementKeys)[number];
export type BaziTenGodKey = (typeof baziTenGodKeys)[number];

const heavenlyStemValueToKey: Record<string, BaziHeavenlyStemKey> = {
  甲: 'jiaHeavenly',
  乙: 'yiHeavenly',
  丙: 'bingHeavenly',
  丁: 'dingHeavenly',
  戊: 'wuHeavenly',
  己: 'jiHeavenly',
  庚: 'gengHeavenly',
  辛: 'xinHeavenly',
  壬: 'renHeavenly',
  癸: 'guiHeavenly',
};

const earthlyBranchValueToKey: Record<string, BaziEarthlyBranchKey> = {
  子: 'ziEarthly',
  丑: 'chouEarthly',
  寅: 'yinEarthly',
  卯: 'maoEarthly',
  辰: 'chenEarthly',
  巳: 'siEarthly',
  午: 'wuEarthly',
  未: 'weiEarthly',
  申: 'shenEarthly',
  酉: 'youEarthly',
  戌: 'xuEarthly',
  亥: 'haiEarthly',
};

const fiveElementValueToKey: Record<string, BaziFiveElementKey> = {
  木: 'wood',
  火: 'fire',
  土: 'earth',
  金: 'metal',
  水: 'water',
};

const tenGodValueToKey: Record<string, BaziTenGodKey> = {
  比肩: 'biJian',
  劫财: 'jieCai',
  食神: 'shiShen',
  伤官: 'shangGuan',
  偏财: 'pianCai',
  正财: 'zhengCai',
  七杀: 'qiSha',
  正官: 'zhengGuan',
  偏印: 'pianYin',
  正印: 'zhengYin',
  日主: 'riZhu',
};

export const baziLabelsVi: Record<string, string> = {
  year: 'Năm',
  month: 'Tháng',
  day: 'Ngày',
  hour: 'Giờ',
  jiaHeavenly: 'Giáp',
  yiHeavenly: 'Ất',
  bingHeavenly: 'Bính',
  dingHeavenly: 'Đinh',
  wuHeavenly: 'Mậu',
  jiHeavenly: 'Kỷ',
  gengHeavenly: 'Canh',
  xinHeavenly: 'Tân',
  renHeavenly: 'Nhâm',
  guiHeavenly: 'Quý',
  ziEarthly: 'Tý',
  chouEarthly: 'Sửu',
  yinEarthly: 'Dần',
  maoEarthly: 'Mão',
  chenEarthly: 'Thìn',
  siEarthly: 'Tỵ',
  wuEarthly: 'Ngọ',
  weiEarthly: 'Mùi',
  shenEarthly: 'Thân',
  youEarthly: 'Dậu',
  xuEarthly: 'Tuất',
  haiEarthly: 'Hợi',
  wood: 'Mộc',
  fire: 'Hỏa',
  earth: 'Thổ',
  metal: 'Kim',
  water: 'Thủy',
  biJian: 'Tỷ Kiên',
  jieCai: 'Kiếp Tài',
  shiShen: 'Thực Thần',
  shangGuan: 'Thương Quan',
  pianCai: 'Thiên Tài',
  zhengCai: 'Chính Tài',
  qiSha: 'Thất Sát',
  zhengGuan: 'Chính Quan',
  pianYin: 'Thiên Ấn',
  zhengYin: 'Chính Ấn',
  riZhu: 'Nhật Chủ',
};

export const baziStemElementByKey: Record<BaziHeavenlyStemKey, BaziFiveElementKey> = {
  jiaHeavenly: 'wood',
  yiHeavenly: 'wood',
  bingHeavenly: 'fire',
  dingHeavenly: 'fire',
  wuHeavenly: 'earth',
  jiHeavenly: 'earth',
  gengHeavenly: 'metal',
  xinHeavenly: 'metal',
  renHeavenly: 'water',
  guiHeavenly: 'water',
};

export const baziBranchElementByKey: Record<BaziEarthlyBranchKey, BaziFiveElementKey> = {
  ziEarthly: 'water',
  chouEarthly: 'earth',
  yinEarthly: 'wood',
  maoEarthly: 'wood',
  chenEarthly: 'earth',
  siEarthly: 'fire',
  wuEarthly: 'fire',
  weiEarthly: 'earth',
  shenEarthly: 'metal',
  youEarthly: 'metal',
  xuEarthly: 'earth',
  haiEarthly: 'water',
};

export const baziHiddenStemKeysByBranch: Record<BaziEarthlyBranchKey, readonly BaziHeavenlyStemKey[]> = {
  ziEarthly: ['guiHeavenly'],
  chouEarthly: ['jiHeavenly', 'guiHeavenly', 'xinHeavenly'],
  yinEarthly: ['jiaHeavenly', 'bingHeavenly', 'wuHeavenly'],
  maoEarthly: ['yiHeavenly'],
  chenEarthly: ['wuHeavenly', 'yiHeavenly', 'guiHeavenly'],
  siEarthly: ['bingHeavenly', 'wuHeavenly', 'gengHeavenly'],
  wuEarthly: ['dingHeavenly', 'jiHeavenly'],
  weiEarthly: ['jiHeavenly', 'dingHeavenly', 'yiHeavenly'],
  shenEarthly: ['gengHeavenly', 'renHeavenly', 'wuHeavenly'],
  youEarthly: ['xinHeavenly'],
  xuEarthly: ['wuHeavenly', 'xinHeavenly', 'dingHeavenly'],
  haiEarthly: ['renHeavenly', 'jiaHeavenly'],
};

function lookupOrThrow<TValue extends string>(map: Record<string, TValue>, value: string, label: string): TValue {
  const normalized = value.trim();
  const result = map[normalized];
  if (!result) {
    throw new Error(`Không nhận diện được ${label} Bát Tự: "${value}"`);
  }

  return result;
}

export function toBaziHeavenlyStemKey(value: string): BaziHeavenlyStemKey {
  return lookupOrThrow(heavenlyStemValueToKey, value, 'thiên can');
}

export function toBaziEarthlyBranchKey(value: string): BaziEarthlyBranchKey {
  return lookupOrThrow(earthlyBranchValueToKey, value, 'địa chi');
}

export function toBaziFiveElementKey(value: string): BaziFiveElementKey {
  return lookupOrThrow(fiveElementValueToKey, value, 'ngũ hành');
}

export function toBaziTenGodKey(value: string): BaziTenGodKey {
  return lookupOrThrow(tenGodValueToKey, value, 'thập thần');
}

export function toBaziStemBranchKeyPair(value: string): {
  heavenlyStemKey: BaziHeavenlyStemKey;
  earthlyBranchKey: BaziEarthlyBranchKey;
} {
  const normalized = value.trim();
  if (normalized.length < 2) {
    throw new Error(`Không nhận diện được cặp can chi Bát Tự: "${value}"`);
  }

  return {
    heavenlyStemKey: toBaziHeavenlyStemKey(normalized[0] ?? ''),
    earthlyBranchKey: toBaziEarthlyBranchKey(normalized[1] ?? ''),
  };
}

export function translateBaziKey(key: string): string {
  return baziLabelsVi[key] ?? key;
}

export function formatBaziStemBranchLabel(input: {
  heavenlyStemKey: BaziHeavenlyStemKey;
  earthlyBranchKey: BaziEarthlyBranchKey;
}): string {
  return `${translateBaziKey(input.heavenlyStemKey)} ${translateBaziKey(input.earthlyBranchKey)}`;
}
