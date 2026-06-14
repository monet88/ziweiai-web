export const meihuaTrigramKeys = [
  'qianTrigram',
  'duiTrigram',
  'liTrigram',
  'zhenTrigram',
  'xunTrigram',
  'kanTrigram',
  'genTrigram',
  'kunTrigram',
] as const;

export const meihuaElementKeys = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
export const meihuaLineValueKeys = ['yin', 'yang'] as const;
export const meihuaMethodKeys = ['time-based'] as const;
export const meihuaRelationKeys = [
  'bodyEqualsUse',
  'bodyGeneratesUse',
  'useGeneratesBody',
  'bodyControlsUse',
  'useControlsBody',
] as const;

export type MeihuaTrigramKey = (typeof meihuaTrigramKeys)[number];
export type MeihuaElementKey = (typeof meihuaElementKeys)[number];
export type MeihuaLineValueKey = (typeof meihuaLineValueKeys)[number];
export type MeihuaMethodKey = (typeof meihuaMethodKeys)[number];
export type MeihuaRelationKey = (typeof meihuaRelationKeys)[number];

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

export const meihuaTrigramLabelsVi: Record<MeihuaTrigramKey, string> = {
  qianTrigram: 'Càn',
  duiTrigram: 'Đoài',
  liTrigram: 'Ly',
  zhenTrigram: 'Chấn',
  xunTrigram: 'Tốn',
  kanTrigram: 'Khảm',
  genTrigram: 'Cấn',
  kunTrigram: 'Khôn',
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

export const meihuaElementLabelsVi: Record<MeihuaElementKey, string> = {
  wood: 'Mộc',
  fire: 'Hỏa',
  earth: 'Thổ',
  metal: 'Kim',
  water: 'Thủy',
};

export const meihuaLineLabelsVi: Record<MeihuaLineValueKey, string> = {
  yin: 'Âm',
  yang: 'Dương',
};

export const meihuaRelationLabelsVi: Record<MeihuaRelationKey, string> = {
  bodyEqualsUse: 'Thể và dụng đồng hành, thuận chiều triển khai.',
  bodyGeneratesUse: 'Thể sinh dụng, việc có thể thành nhưng bạn phải hao tâm lực.',
  useGeneratesBody: 'Dụng sinh thể, hoàn cảnh hoặc người khác đang nâng đỡ bạn.',
  bodyControlsUse: 'Thể khắc dụng, bạn nắm quyền chủ động nhưng cần trả giá bằng công sức.',
  useControlsBody: 'Dụng khắc thể, ngoại cảnh lấn át, cần thận trọng trước khi tiến thêm.',
};

export const meihuaTrigramLinePatterns: Record<MeihuaTrigramKey, readonly MeihuaLineValueKey[]> = {
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

export function translateMeihuaTrigramKey(key: MeihuaTrigramKey): string {
  return meihuaTrigramLabelsVi[key];
}

export function translateMeihuaElementKey(key: MeihuaElementKey): string {
  return meihuaElementLabelsVi[key];
}

export function translateMeihuaLineValueKey(key: MeihuaLineValueKey): string {
  return meihuaLineLabelsVi[key];
}

export function translateMeihuaRelationKey(key: MeihuaRelationKey): string {
  return meihuaRelationLabelsVi[key];
}

export function getMeihuaTrigramKeyByNumber(value: number): MeihuaTrigramKey {
  const trigramKey = meihuaTrigramNumberToKey[value];
  if (!trigramKey) {
    throw new Error(`Không nhận diện được số quái Mai Hoa: ${value}`);
  }

  return trigramKey;
}

export function getMeihuaTrigramKeyByLines(lines: readonly MeihuaLineValueKey[]): MeihuaTrigramKey {
  const trigramKey = trigramKeyByPattern[lines.join(',')];
  if (!trigramKey) {
    throw new Error(`Không nhận diện được mẫu hào Mai Hoa: ${lines.join(',')}`);
  }

  return trigramKey;
}

export function formatMeihuaHexagramLabel(input: {
  topTrigramKey: MeihuaTrigramKey;
  bottomTrigramKey: MeihuaTrigramKey;
}): string {
  return `${translateMeihuaTrigramKey(input.topTrigramKey)} trên ${translateMeihuaTrigramKey(input.bottomTrigramKey)}`;
}

export function getMeihuaRelationKey(bodyElementKey: MeihuaElementKey, useElementKey: MeihuaElementKey): MeihuaRelationKey {
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
