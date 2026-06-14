export const liuyaoLineValueKeys = ['yin', 'yang'] as const;
export const liuyaoLineStateKeys = ['youngYin', 'youngYang', 'oldYin', 'oldYang'] as const;
export const liuyaoRoleKeys = ['none', 'shi', 'ying'] as const;
export const liuyaoSixKinKeys = ['sibling', 'childDescendant', 'wifeWealth', 'officerGhost', 'parent'] as const;
export const liuyaoSixSpiritKeys = ['azureDragon', 'vermilionBird', 'hookSnake', 'soaringSerpent', 'whiteTiger', 'blackTortoise'] as const;
export const liuyaoMethodKeys = ['time-based', 'manual', 'random'] as const;

export type LiuyaoLineValueKey = (typeof liuyaoLineValueKeys)[number];
export type LiuyaoLineStateKey = (typeof liuyaoLineStateKeys)[number];
export type LiuyaoRoleKey = (typeof liuyaoRoleKeys)[number];
export type LiuyaoSixKinKey = (typeof liuyaoSixKinKeys)[number];
export type LiuyaoSixSpiritKey = (typeof liuyaoSixSpiritKeys)[number];
export type LiuyaoMethodKey = (typeof liuyaoMethodKeys)[number];

export const liuyaoLineValueLabelsVi: Record<LiuyaoLineValueKey, string> = {
  yin: 'Âm',
  yang: 'Dương',
};

export const liuyaoLineStateLabelsVi: Record<LiuyaoLineStateKey, string> = {
  youngYin: 'Thiếu âm',
  youngYang: 'Thiếu dương',
  oldYin: 'Lão âm',
  oldYang: 'Lão dương',
};

export const liuyaoRoleLabelsVi: Record<LiuyaoRoleKey, string> = {
  none: 'Không đánh dấu',
  shi: 'Thế',
  ying: 'Ứng',
};

export const liuyaoSixKinLabelsVi: Record<LiuyaoSixKinKey, string> = {
  sibling: 'Huynh đệ',
  childDescendant: 'Tử tôn',
  wifeWealth: 'Thê tài',
  officerGhost: 'Quan quỷ',
  parent: 'Phụ mẫu',
};

export const liuyaoSixSpiritLabelsVi: Record<LiuyaoSixSpiritKey, string> = {
  azureDragon: 'Thanh Long',
  vermilionBird: 'Chu Tước',
  hookSnake: 'Câu Trần',
  soaringSerpent: 'Đằng Xà',
  whiteTiger: 'Bạch Hổ',
  blackTortoise: 'Huyền Vũ',
};

export const liuyaoMethodLabelsVi: Record<LiuyaoMethodKey, string> = {
  'time-based': 'Theo thời gian',
  manual: 'Thủ công',
  random: 'Ngẫu nhiên',
};

export function translateLiuyaoLineValueKey(key: LiuyaoLineValueKey): string {
  return liuyaoLineValueLabelsVi[key];
}

export function translateLiuyaoLineStateKey(key: LiuyaoLineStateKey): string {
  return liuyaoLineStateLabelsVi[key];
}

export function translateLiuyaoRoleKey(key: LiuyaoRoleKey): string {
  return liuyaoRoleLabelsVi[key];
}

export function translateLiuyaoSixKinKey(key: LiuyaoSixKinKey): string {
  return liuyaoSixKinLabelsVi[key];
}

export function translateLiuyaoSixSpiritKey(key: LiuyaoSixSpiritKey): string {
  return liuyaoSixSpiritLabelsVi[key];
}

export function translateLiuyaoMethodKey(key: LiuyaoMethodKey): string {
  return liuyaoMethodLabelsVi[key];
}
