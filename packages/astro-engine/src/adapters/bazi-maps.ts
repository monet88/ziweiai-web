import type { BaziEarthlyBranchKey, BaziFiveElementKey, BaziHeavenlyStemKey, BaziTenGodKey } from '@ziweiai/contracts';

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

const baziLabelsVi: Record<string, string> = {
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
};

const naYinLabelsVi: Record<string, string> = {
  海中金: 'Hải Trung Kim',
  炉中火: 'Lô Trung Hỏa',
  大林木: 'Đại Lâm Mộc',
  路旁土: 'Lộ Bàng Thổ',
  剑锋金: 'Kiếm Phong Kim',
  山头火: 'Sơn Đầu Hỏa',
  涧下水: 'Giản Hạ Thủy',
  城头土: 'Thành Đầu Thổ',
  白蜡金: 'Bạch Lạp Kim',
  杨柳木: 'Dương Liễu Mộc',
  泉中水: 'Tuyền Trung Thủy',
  屋上土: 'Ốc Thượng Thổ',
  霹雳火: 'Tích Lịch Hỏa',
  松柏木: 'Tùng Bách Mộc',
  长流水: 'Trường Lưu Thủy',
  沙中金: 'Sa Trung Kim',
  山下火: 'Sơn Hạ Hỏa',
  平地木: 'Bình Địa Mộc',
  壁上土: 'Bích Thượng Thổ',
  金箔金: 'Kim Bạc Kim',
  佛灯火: 'Phật Đăng Hỏa',
  覆灯火: 'Phật Đăng Hỏa',
  天河水: 'Thiên Hà Thủy',
  大驿土: 'Đại Dịch Thổ',
  钗钏金: 'Xoa Xuyến Kim',
  桑柘木: 'Tang Đố Mộc',
  大溪水: 'Đại Khê Thủy',
  沙中土: 'Sa Trung Thổ',
  天上火: 'Thiên Thượng Hỏa',
  石榴木: 'Thạch Lựu Mộc',
  大海水: 'Đại Hải Thủy',
};

function lookupOrThrow<TValue extends string>(map: Record<string, TValue>, value: string, label: string): TValue {
  const result = map[value.trim()];
  if (!result) {
    throw new Error(`Không nhận diện được ${label} Bát Tự: "${value}"`);
  }

  return result;
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
    heavenlyStemKey: lookupOrThrow(heavenlyStemValueToKey, normalized[0] ?? '', 'thiên can'),
    earthlyBranchKey: lookupOrThrow(earthlyBranchValueToKey, normalized[1] ?? '', 'địa chi'),
  };
}

export function toBaziTenGodKey(value: string): BaziTenGodKey {
  return lookupOrThrow(tenGodValueToKey, value, 'thập thần');
}

export function formatBaziStemBranchLabel(input: {
  heavenlyStemKey: BaziHeavenlyStemKey;
  earthlyBranchKey: BaziEarthlyBranchKey;
}): string {
  return `${baziLabelsVi[input.heavenlyStemKey]} ${baziLabelsVi[input.earthlyBranchKey]}`;
}

export function formatBaziNaYinLabel(value: string): string {
  return naYinLabelsVi[value] ?? value;
}
