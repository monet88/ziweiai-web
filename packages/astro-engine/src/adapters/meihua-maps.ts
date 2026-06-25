import type {
  MeihuaElementKey,
  MeihuaLineValue,
  MeihuaRelationKey,
  MeihuaTrigramKey,
} from '@ziweiai/contracts';

export const meihuaTrigramNumberToKey: Record<number, MeihuaTrigramKey> = {
  1: 'qianTrigram',
  2: 'duiTrigram',
  3: 'liTrigram',
  4: 'zhenTrigram',
  5: 'xunTrigram',
  6: 'kanTrigram',
  7: 'genTrigram',
  8: 'kunTrigram',
};

export const meihuaTrigramElementByKey: Record<MeihuaTrigramKey, MeihuaElementKey> = {
  qianTrigram: 'metal',
  duiTrigram: 'metal',
  liTrigram: 'fire',
  zhenTrigram: 'wood',
  xunTrigram: 'wood',
  kanTrigram: 'water',
  genTrigram: 'earth',
  kunTrigram: 'earth',
};

const trigramLabelsVi: Record<MeihuaTrigramKey, string> = {
  qianTrigram: 'Càn',
  duiTrigram: 'Đoài',
  liTrigram: 'Ly',
  zhenTrigram: 'Chấn',
  xunTrigram: 'Tốn',
  kanTrigram: 'Khảm',
  genTrigram: 'Cấn',
  kunTrigram: 'Khôn',
};

const elementLabelsVi: Record<MeihuaElementKey, string> = {
  wood: 'Mộc',
  fire: 'Hỏa',
  earth: 'Thổ',
  metal: 'Kim',
  water: 'Thủy',
};

const relationLabelsVi: Record<MeihuaRelationKey, string> = {
  bodyEqualsUse: 'Thể và dụng đồng hành, thuận chiều triển khai.',
  bodyGeneratesUse: 'Thể sinh dụng, việc có thể thành nhưng bạn phải hao tâm lực.',
  useGeneratesBody: 'Dụng sinh thể, hoàn cảnh hoặc người khác đang nâng đỡ bạn.',
  bodyControlsUse: 'Thể khắc dụng, bạn nắm quyền chủ động nhưng cần trả giá bằng công sức.',
  useControlsBody: 'Dụng khắc thể, ngoại cảnh lấn át, cần thận trọng trước khi tiến thêm.',
};

export const meihuaTrigramLinePatterns: Record<MeihuaTrigramKey, readonly MeihuaLineValue[]> = {
  qianTrigram: ['yang', 'yang', 'yang'],
  duiTrigram: ['yang', 'yang', 'yin'],
  liTrigram: ['yang', 'yin', 'yang'],
  zhenTrigram: ['yang', 'yin', 'yin'],
  xunTrigram: ['yin', 'yang', 'yang'],
  kanTrigram: ['yin', 'yang', 'yin'],
  genTrigram: ['yin', 'yin', 'yang'],
  kunTrigram: ['yin', 'yin', 'yin'],
};

const trigramKeyByPattern = Object.entries(meihuaTrigramLinePatterns).reduce<Record<string, MeihuaTrigramKey>>((accumulator, [key, pattern]) => {
  accumulator[pattern.join(',')] = key as MeihuaTrigramKey;
  return accumulator;
}, {});

const branchNumbers: Record<string, number> = {
  子: 1,
  丑: 2,
  寅: 3,
  卯: 4,
  辰: 5,
  巳: 6,
  午: 7,
  未: 8,
  申: 9,
  酉: 10,
  戌: 11,
  亥: 12,
};

const generatedBy: Record<MeihuaElementKey, MeihuaElementKey> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

const controlledBy: Record<MeihuaElementKey, MeihuaElementKey> = {
  wood: 'earth',
  fire: 'metal',
  earth: 'water',
  metal: 'wood',
  water: 'fire',
};

function normalizeGuaNumber(value: number) {
  const mod = value % 8;
  return mod === 0 ? 8 : mod;
}

function normalizeDongYaoNumber(value: number) {
  const mod = value % 6;
  return mod === 0 ? 6 : mod;
}

export function getBranchNumber(value: string): number {
  return branchNumbers[value] ?? 1;
}

export function getTrigramKeyByNumber(value: number): MeihuaTrigramKey {
  const trigramKey = meihuaTrigramNumberToKey[value];
  if (!trigramKey) {
    throw new Error(`Không nhận diện được số quái Mai Hoa: ${value}`);
  }

  return trigramKey;
}

export function getTrigramKeyByLines(lines: readonly MeihuaLineValue[]): MeihuaTrigramKey {
  const trigramKey = trigramKeyByPattern[lines.join(',')];
  if (!trigramKey) {
    throw new Error(`Không nhận diện được mẫu quái Mai Hoa: ${lines.join(',')}`);
  }

  return trigramKey;
}

export function buildHexagramKey(topTrigramKey: MeihuaTrigramKey, bottomTrigramKey: MeihuaTrigramKey): string {
  return `${topTrigramKey}_over_${bottomTrigramKey}`;
}

export function buildTimeBasedNumbers(params: {
  lunarDay: number;
  lunarMonth: number;
  yearBranch: string;
  hourBranch: string;
}) {
  const base = getBranchNumber(params.yearBranch) + params.lunarMonth + params.lunarDay;
  const hourNumber = getBranchNumber(params.hourBranch);

  return {
    topNumber: normalizeGuaNumber(base),
    bottomNumber: normalizeGuaNumber(base + hourNumber),
    movingLine: normalizeDongYaoNumber(base + hourNumber),
  };
}

// US-026: classic Mai Hoa number-casting. Upper number -> upper trigram (mod 8),
// lower number -> lower trigram (mod 8), (upper + lower) -> moving line (mod 6).
export function buildNumberBasedNumbers(params: { upperNumber: number; lowerNumber: number }) {
  return {
    topNumber: normalizeGuaNumber(params.upperNumber),
    bottomNumber: normalizeGuaNumber(params.lowerNumber),
    movingLine: normalizeDongYaoNumber(params.upperNumber + params.lowerNumber),
  };
}

export function getRelationKey(bodyElementKey: MeihuaElementKey, useElementKey: MeihuaElementKey): MeihuaRelationKey {
  if (bodyElementKey === useElementKey) {
    return 'bodyEqualsUse';
  }

  if (generatedBy[bodyElementKey] === useElementKey) {
    return 'bodyGeneratesUse';
  }

  if (generatedBy[useElementKey] === bodyElementKey) {
    return 'useGeneratesBody';
  }

  if (controlledBy[bodyElementKey] === useElementKey) {
    return 'bodyControlsUse';
  }

  return 'useControlsBody';
}

export function translateMeihuaTrigramKey(key: MeihuaTrigramKey): string {
  return trigramLabelsVi[key];
}

export function translateMeihuaElementKey(key: MeihuaElementKey): string {
  return elementLabelsVi[key];
}

export function translateMeihuaRelationKey(key: MeihuaRelationKey): string {
  return relationLabelsVi[key];
}

export function formatMeihuaHexagramLabel(input: {
  topTrigramKey: MeihuaTrigramKey;
  bottomTrigramKey: MeihuaTrigramKey;
}): string {
  return `${translateMeihuaTrigramKey(input.topTrigramKey)} trên ${translateMeihuaTrigramKey(input.bottomTrigramKey)}`;
}
