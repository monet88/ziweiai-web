// Thuật ngữ Đại Lục Nhâm: chuẩn hóa toàn bộ về key ASCII + nhãn tiếng Việt.
// Engine map dữ liệu nguồn (chữ Hán) sang các key này trước khi ra contract/UI,
// giữ bất biến không có chữ Hán/Đông Á ở frontend.

// Thập nhị thiên tướng (12 thần tướng) theo thứ tự GUI_REN_SHUN_XU của nguồn xuanshu.
export const daliurenSpiritKeys = [
  'noblePerson',
  'soaringSerpent',
  'vermilionBird',
  'sixHarmony',
  'hookSnake',
  'azureDragon',
  'skyVoid',
  'whiteTiger',
  'greatConstancy',
  'blackTortoise',
  'greatYin',
  'heavenQueen',
] as const;

// Mười hai nguyệt tướng thần.
export const daliurenMonthGeneralKeys = [
  'shenHou',
  'daJi',
  'gongCao',
  'taiChong',
  'tianGang',
  'taiYi',
  'shengGuang',
  'xiaoJi',
  'chuanSong',
  'congKui',
  'heKui',
  'dengMing',
] as const;

// Mười hai loại thiên địa bàn (kiểu bàn) suy từ nguyệt tướng + thời chi.
export const daliurenBoardTypeKeys = [
  'fuYin',
  'fanYin',
  'forwardSanHe',
  'reverseSanHe',
  'advanceLianRu',
  'retreatLianRu',
  'advanceJianChuan',
  'retreatJianChuan',
  'sickYuanTai',
  'birthYuanTai',
  'fourCorrectLinJue',
  'fourTombFuSheng',
] as const;

// Vị trí tam truyền.
export const daliurenTransmissionSlots = ['initial', 'middle', 'final'] as const;

export type DaliurenSpiritKey = (typeof daliurenSpiritKeys)[number];
export type DaliurenMonthGeneralKey = (typeof daliurenMonthGeneralKeys)[number];
export type DaliurenBoardTypeKey = (typeof daliurenBoardTypeKeys)[number];
export type DaliurenTransmissionSlot = (typeof daliurenTransmissionSlots)[number];

export const daliurenSpiritLabelsVi: Record<DaliurenSpiritKey, string> = {
  noblePerson: 'Quý Nhân',
  soaringSerpent: 'Đằng Xà',
  vermilionBird: 'Chu Tước',
  sixHarmony: 'Lục Hợp',
  hookSnake: 'Câu Trần',
  azureDragon: 'Thanh Long',
  skyVoid: 'Thiên Không',
  whiteTiger: 'Bạch Hổ',
  greatConstancy: 'Thái Thường',
  blackTortoise: 'Huyền Vũ',
  greatYin: 'Thái Âm',
  heavenQueen: 'Thiên Hậu',
};

export const daliurenMonthGeneralLabelsVi: Record<DaliurenMonthGeneralKey, string> = {
  shenHou: 'Thần Hậu',
  daJi: 'Đại Cát',
  gongCao: 'Công Tào',
  taiChong: 'Thái Xung',
  tianGang: 'Thiên Cương',
  taiYi: 'Thái Ất',
  shengGuang: 'Thắng Quang',
  xiaoJi: 'Tiểu Cát',
  chuanSong: 'Truyền Tống',
  congKui: 'Tòng Khôi',
  heKui: 'Hà Khôi',
  dengMing: 'Đăng Minh',
};

export const daliurenBoardTypeLabelsVi: Record<DaliurenBoardTypeKey, string> = {
  fuYin: 'Phục Ngâm',
  fanYin: 'Phản Ngâm',
  forwardSanHe: 'Thuận Tam Hợp',
  reverseSanHe: 'Nghịch Tam Hợp',
  advanceLianRu: 'Tiến Liên Nhự',
  retreatLianRu: 'Thoái Liên Nhự',
  advanceJianChuan: 'Tiến Gián Truyền',
  retreatJianChuan: 'Thoái Gián Truyền',
  sickYuanTai: 'Bệnh Nguyên Thai',
  birthYuanTai: 'Sinh Nguyên Thai',
  fourCorrectLinJue: 'Tứ Chính Lâm Tuyệt',
  fourTombFuSheng: 'Tứ Mộ Phúc Sinh',
};

export const daliurenTransmissionSlotLabelsVi: Record<DaliurenTransmissionSlot, string> = {
  initial: 'Sơ truyền',
  middle: 'Trung truyền',
  final: 'Mạt truyền',
};

export function translateDaliurenSpiritKey(key: DaliurenSpiritKey): string {
  return daliurenSpiritLabelsVi[key];
}

export function translateDaliurenMonthGeneralKey(key: DaliurenMonthGeneralKey): string {
  return daliurenMonthGeneralLabelsVi[key];
}

export function translateDaliurenBoardTypeKey(key: DaliurenBoardTypeKey): string {
  return daliurenBoardTypeLabelsVi[key];
}

export function translateDaliurenTransmissionSlot(slot: DaliurenTransmissionSlot): string {
  return daliurenTransmissionSlotLabelsVi[slot];
}
