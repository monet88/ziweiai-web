// Thuật ngữ Kỳ Môn Độn Giáp: chuẩn hóa toàn bộ về key ASCII + nhãn tiếng Việt.
// Engine map dữ liệu nguồn (chữ Hán) sang các key này trước khi ra contract/UI.

// Cửu tinh (9 sao). 天禽/芮禽 quy về tianQin để hợp nhất biến thể hiển thị.
export const qimenStarKeys = [
  'tianPeng',
  'tianRui',
  'tianChong',
  'tianFu',
  'tianQin',
  'tianXin',
  'tianZhu',
  'tianRen',
  'tianYing',
] as const;

// Bát môn (8 cửa).
export const qimenGateKeys = [
  'restGate',
  'lifeGate',
  'hurtGate',
  'blockGate',
  'viewGate',
  'deathGate',
  'fearGate',
  'openGate',
] as const;

// Bát thần (8 thần).
export const qimenSpiritKeys = [
  'dutyChief',
  'soaringSerpent',
  'greatYin',
  'sixHarmony',
  'whiteTiger',
  'blackTortoise',
  'nineEarth',
  'nineHeaven',
] as const;

// Cục độn âm/dương.
export const qimenDunKeys = ['yangDun', 'yinDun'] as const;

// Tam nguyên.
export const qimenYuanKeys = ['upperYuan', 'middleYuan', 'lowerYuan'] as const;

export type QimenStarKey = (typeof qimenStarKeys)[number];
export type QimenGateKey = (typeof qimenGateKeys)[number];
export type QimenSpiritKey = (typeof qimenSpiritKeys)[number];
export type QimenDunKey = (typeof qimenDunKeys)[number];
export type QimenYuanKey = (typeof qimenYuanKeys)[number];

export const qimenStarLabelsVi: Record<QimenStarKey, string> = {
  tianPeng: 'Thiên Bồng',
  tianRui: 'Thiên Nhuế',
  tianChong: 'Thiên Xung',
  tianFu: 'Thiên Phụ',
  tianQin: 'Thiên Cầm',
  tianXin: 'Thiên Tâm',
  tianZhu: 'Thiên Trụ',
  tianRen: 'Thiên Nhậm',
  tianYing: 'Thiên Anh',
};

export const qimenGateLabelsVi: Record<QimenGateKey, string> = {
  restGate: 'Hưu Môn',
  lifeGate: 'Sinh Môn',
  hurtGate: 'Thương Môn',
  blockGate: 'Đỗ Môn',
  viewGate: 'Cảnh Môn',
  deathGate: 'Tử Môn',
  fearGate: 'Kinh Môn',
  openGate: 'Khai Môn',
};

export const qimenSpiritLabelsVi: Record<QimenSpiritKey, string> = {
  dutyChief: 'Trực Phù',
  soaringSerpent: 'Đằng Xà',
  greatYin: 'Thái Âm',
  sixHarmony: 'Lục Hợp',
  whiteTiger: 'Bạch Hổ',
  blackTortoise: 'Huyền Vũ',
  nineEarth: 'Cửu Địa',
  nineHeaven: 'Cửu Thiên',
};

export const qimenDunLabelsVi: Record<QimenDunKey, string> = {
  yangDun: 'Dương Độn',
  yinDun: 'Âm Độn',
};

export const qimenYuanLabelsVi: Record<QimenYuanKey, string> = {
  upperYuan: 'Thượng Nguyên',
  middleYuan: 'Trung Nguyên',
  lowerYuan: 'Hạ Nguyên',
};

export function translateQimenStarKey(key: QimenStarKey): string {
  return qimenStarLabelsVi[key];
}

export function translateQimenGateKey(key: QimenGateKey): string {
  return qimenGateLabelsVi[key];
}

export function translateQimenSpiritKey(key: QimenSpiritKey): string {
  return qimenSpiritLabelsVi[key];
}

export function translateQimenDunKey(key: QimenDunKey): string {
  return qimenDunLabelsVi[key];
}

export function translateQimenYuanKey(key: QimenYuanKey): string {
  return qimenYuanLabelsVi[key];
}
