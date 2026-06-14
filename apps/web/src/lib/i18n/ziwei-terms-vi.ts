// Nguồn tiếng Việt duy nhất cho thuật ngữ Tử Vi (cung, can, chi, độ sáng, Tứ Hóa,
// cục, con giáp, cung hoàng đạo, giới tính). Hợp nhất với từ điển sao để phủ mọi
// key engine có thể phát. BẤT BIẾN: frontend không bao giờ hiển thị chữ Hán — key
// thiếu bản dịch phải fail rõ ràng khi dev/test, không im lặng rơi về chữ Hán.
import { ziweiStarTermsVi } from './ziwei-star-terms-vi';

const palaceTermsVi: Record<string, string> = {
  soulPalace: 'Mệnh',
  bodyPalace: 'Thân',
  siblingsPalace: 'Huynh Đệ',
  spousePalace: 'Phu Thê',
  childrenPalace: 'Tử Nữ',
  wealthPalace: 'Tài Bạch',
  healthPalace: 'Tật Ách',
  surfacePalace: 'Thiên Di',
  friendsPalace: 'Nô Bộc',
  careerPalace: 'Quan Lộc',
  propertyPalace: 'Điền Trạch',
  spiritPalace: 'Phúc Đức',
  parentsPalace: 'Phụ Mẫu',
  originalPalace: 'Lai Nhân',
};

const heavenlyStemTermsVi: Record<string, string> = {
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
};

const earthlyBranchTermsVi: Record<string, string> = {
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

// Độ sáng sao: dùng thuật ngữ Tử Vi Việt chuẩn (xian = Hãm, không phải "Hạn").
const brightnessTermsVi: Record<string, string> = {
  miao: 'Miếu',
  wang: 'Vượng',
  de: 'Đắc',
  li: 'Lợi',
  ping: 'Bình',
  bu: 'Bất',
  xian: 'Hãm',
};

// Tứ Hóa theo key contract (lu/quyen/khoa/ky).
const mutagenTermsVi: Record<string, string> = {
  lu: 'Lộc',
  quyen: 'Quyền',
  khoa: 'Khoa',
  ky: 'Kỵ',
};

const fiveElementsClassTermsVi: Record<string, string> = {
  water2nd: 'Thủy Nhị Cục',
  wood3rd: 'Mộc Tam Cục',
  metal4th: 'Kim Tứ Cục',
  earth5th: 'Thổ Ngũ Cục',
  fire6th: 'Hỏa Lục Cục',
};

const zodiacTermsVi: Record<string, string> = {
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

const signTermsVi: Record<string, string> = {
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

const genderTermsVi: Record<string, string> = {
  male: 'Nam',
  female: 'Nữ',
};

const divinationTermsVi: Record<string, string> = {
  qianTrigram: 'Càn',
  duiTrigram: 'Đoài',
  liTrigram: 'Ly',
  zhenTrigram: 'Chấn',
  xunTrigram: 'Tốn',
  kanTrigram: 'Khảm',
  genTrigram: 'Cấn',
  kunTrigram: 'Khôn',
  metalElement: 'Kim',
  woodElement: 'Mộc',
  waterElement: 'Thủy',
  fireElement: 'Hỏa',
  earthElement: 'Thổ',
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
  dongZhiJieQi: 'Đông Chí',
  xiaoHanJieQi: 'Tiểu Hàn',
  daHanJieQi: 'Đại Hàn',
  liChunJieQi: 'Lập Xuân',
  yuShuiJieQi: 'Vũ Thủy',
  jingZheJieQi: 'Kinh Trập',
  chunFenJieQi: 'Xuân Phân',
  qingMingJieQi: 'Thanh Minh',
  guYuJieQi: 'Cốc Vũ',
  liXiaJieQi: 'Lập Hạ',
  xiaoManJieQi: 'Tiểu Mãn',
  mangZhongJieQi: 'Mang Chủng',
  xiaZhiJieQi: 'Hạ Chí',
  xiaoShuJieQi: 'Tiểu Thử',
  daShuJieQi: 'Đại Thử',
  liQiuJieQi: 'Lập Thu',
  chuShuJieQi: 'Xử Thử',
  baiLuJieQi: 'Bạch Lộ',
  qiuFenJieQi: 'Thu Phân',
  hanLuJieQi: 'Hàn Lộ',
  shuangJiangJieQi: 'Sương Giáng',
  liDongJieQi: 'Lập Đông',
  xiaoXueJieQi: 'Tiểu Tuyết',
  daXueJieQi: 'Đại Tuyết',
  upperCycle: 'Thượng Nguyên',
  middleCycle: 'Trung Nguyên',
  lowerCycle: 'Hạ Nguyên',
  yangDun: 'Dương Độn',
  yinDun: 'Âm Độn',
};

// Từ điển hợp nhất key->tiếng Việt cho mọi nhóm thuật ngữ Tử Vi.
export const ziweiTermsVi: Record<string, string> = {
  ...ziweiStarTermsVi,
  ...palaceTermsVi,
  ...heavenlyStemTermsVi,
  ...earthlyBranchTermsVi,
  ...brightnessTermsVi,
  ...mutagenTermsVi,
  ...fiveElementsClassTermsVi,
  ...zodiacTermsVi,
  ...signTermsVi,
  ...genderTermsVi,
  ...divinationTermsVi,
};

// Web build (Vite): dev/test dùng import.meta.env.DEV thay cho process.env.NODE_ENV
// (boundary client/server: web không có process.env). DEV=true khi dev server +
// vitest; production build DEV=false.
function isDevOrTest(): boolean {
  return import.meta.env.DEV;
}

function humanizeAsciiKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

/**
 * Tra cứu bản dịch tiếng Việt cho một key Tử Vi. Trả về `undefined` khi thiếu —
 * dùng cho luồng cần tự quyết định hành vi (vd: kiểm thử phủ key).
 */
export function tryTranslateZiweiKey(key: string): string | undefined {
  return ziweiTermsVi[key];
}

/**
 * Tra cứu bản dịch tiếng Việt cho một key Tử Vi (debug-first).
 * - Có bản dịch → trả về tiếng Việt.
 * - Thiếu bản dịch khi dev/test → ném lỗi để lộ ngay key chưa map.
 * - Thiếu bản dịch ở production → log cảnh báo + trả về key đã nhân hóa (ASCII,
 *   không bao giờ là chữ Hán) để UI không vỡ và không rò chữ Hán.
 */
export function translateZiweiKey(key: string): string {
  const translated = ziweiTermsVi[key];
  if (translated) {
    return translated;
  }

  const message = `[ziwei-terms-vi] Thiếu bản dịch tiếng Việt cho key: "${key}"`;
  if (isDevOrTest()) {
    throw new Error(message);
  }

  console.warn(message);
  return humanizeAsciiKey(key);
}
