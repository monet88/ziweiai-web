import viBrightness from 'iztro/lib/i18n/locales/vi-VN/brightness';
import viEarthlyBranch from 'iztro/lib/i18n/locales/vi-VN/earthlyBranch';
import viFiveElementsClass from 'iztro/lib/i18n/locales/vi-VN/fiveElementsClass';
import viGender from 'iztro/lib/i18n/locales/vi-VN/gender';
import viHeavenlyStem from 'iztro/lib/i18n/locales/vi-VN/heavenlyStem';
import viMutagen from 'iztro/lib/i18n/locales/vi-VN/mutagen';
import viPalace from 'iztro/lib/i18n/locales/vi-VN/palace';
import viStar from 'iztro/lib/i18n/locales/vi-VN/star';
import zhBrightness from 'iztro/lib/i18n/locales/zh-CN/brightness';
import zhEarthlyBranch from 'iztro/lib/i18n/locales/zh-CN/earthlyBranch';
import zhFiveElementsClass from 'iztro/lib/i18n/locales/zh-CN/fiveElementsClass';
import zhGender from 'iztro/lib/i18n/locales/zh-CN/gender';
import zhHeavenlyStem from 'iztro/lib/i18n/locales/zh-CN/heavenlyStem';
import zhMutagen from 'iztro/lib/i18n/locales/zh-CN/mutagen';
import zhPalace from 'iztro/lib/i18n/locales/zh-CN/palace';
import zhStar from 'iztro/lib/i18n/locales/zh-CN/star';

const zodiacKeyToVi: Record<string, string> = {
  rat: 'Chuột',
  ox: 'Trâu',
  tiger: 'Hổ',
  rabbit: 'Mèo',
  dragon: 'Rồng',
  snake: 'Rắn',
  horse: 'Ngựa',
  goat: 'Dê',
  monkey: 'Khỉ',
  rooster: 'Gà',
  dog: 'Chó',
  pig: 'Heo',
};

const signKeyToVi: Record<string, string> = {
  aries: 'Bạch Dương',
  taurus: 'Kim Ngưu',
  gemini: 'Song Tử',
  cancer: 'Cự Giải',
  leo: 'Sư Tử',
  virgo: 'Xử Nữ',
  libra: 'Thiên Bình',
  scorpio: 'Bọ Cạp',
  sagittarius: 'Nhân Mã',
  capricorn: 'Ma Kết',
  aquarius: 'Bảo Bình',
  pisces: 'Song Ngư',
};

const rawKeyToVi: Record<string, string> = {
  male: 'Nam',
  female: 'Nữ',
  lu: 'Lộc',
  quyen: 'Quyền',
  khoa: 'Khoa',
  ky: 'Kỵ',
  shenHouSpirit: 'Thần Hậu',
  daJiSpirit: 'Đại Cát',
  gongCaoSpirit: 'Công Tào',
  taiChongSpirit: 'Thái Xung',
  tianGangSpirit: 'Thiên Cương',
  taiYiSpirit: 'Thái Ất',
  shengGuangSpirit: 'Thắng Quang',
  xiaoJiSpirit: 'Tiểu Cát',
  chuanSongSpirit: 'Truyền Tống',
  congKuiSpirit: 'Tòng Khôi',
  heKuiSpirit: 'Hà Khôi',
  dengMingSpirit: 'Đăng Minh',
  autoGuiRenMode: 'Tự động quý nhân',
  dayGuiRenMode: 'Quý nhân ban ngày',
  nightGuiRenMode: 'Quý nhân ban đêm',
  qianTrigram: 'Càn',
  duiTrigram: 'Đoài',
  liTrigram: 'Ly',
  zhenTrigram: 'Chấn',
  xunTrigram: 'Tốn',
  kanTrigram: 'Khảm',
  genTrigram: 'Cấn',
  kunTrigram: 'Khôn',
  ...zodiacKeyToVi,
  ...signKeyToVi,
};

function invertRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [value, key]));
}

function humanizeKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

const viByKey: Record<string, string> = {
  ...(viPalace as Record<string, string>),
  ...(viStar as Record<string, string>),
  ...(viHeavenlyStem as Record<string, string>),
  ...(viEarthlyBranch as Record<string, string>),
  ...(viFiveElementsClass as Record<string, string>),
  ...(viBrightness as Record<string, string>),
  ...(viMutagen as Record<string, string>),
  ...(viGender as Record<string, string>),
  ...rawKeyToVi,
};

const zhValueToKey: Record<string, string> = {
  ...invertRecord(zhPalace as Record<string, string>),
  ...invertRecord(zhStar as Record<string, string>),
  ...invertRecord(zhHeavenlyStem as Record<string, string>),
  ...invertRecord(zhEarthlyBranch as Record<string, string>),
  ...invertRecord(zhFiveElementsClass as Record<string, string>),
  ...invertRecord(zhBrightness as Record<string, string>),
  ...invertRecord(zhMutagen as Record<string, string>),
  ...invertRecord(zhGender as Record<string, string>),
};

export function formatZiweiTokenVi(value: string): string {
  if (viByKey[value]) {
    return viByKey[value];
  }

  const key = zhValueToKey[value];
  if (key && viByKey[key]) {
    return viByKey[key];
  }

  return humanizeKey(value);
}
