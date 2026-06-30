// Design tokens — ngôn ngữ thiết kế: monochrome astrology kiểu Luvsa
// (decision 0031; DESIGN.md là phân tích Notion cũ đã superseded).
//
// NGUỒN SỰ THẬT (canonical) là tokens.css — đó là file DUY NHẤT được import/áp dụng
// (ở root layout). File .ts này KHÔNG được import ở bất kỳ đâu trong app; nó chỉ là
// bản mirror tham chiếu cho code TS cần giá trị token dạng số (vd tính layout). Khi
// đổi token: sửa tokens.css trước (bắt buộc), rồi cập nhật mirror này nếu cần. Đừng
// coi đây là nguồn 2 chiều.
export const colors = {
  background: {
    primary: '#F5F2ED',
    elevated: '#EDE8E0',
    surface: '#FFFFFF',
  },
  text: {
    primary: '#111111',
    secondary: '#3A3A3A',
    muted: '#666666',
  },
  accent: {
    primary: '#0F0F12',
    primaryPressed: '#000000',
    primarySoft: '#E6E1D7',
    ai: '#6D28D9',
    danger: '#C0392B',
  },
  // Sticker palette trang trí thuần (illustration/icon tile/category dot).
  sticker: {
    sky: '#62AEF0',
    purple: '#D6B6F6',
    purpleDeep: '#391C57',
    pink: '#FF64C8',
    orange: '#DD5B00',
    orangeDeep: '#793400',
    teal: '#2A9D99',
    green: '#1AAE39',
    brown: '#523410',
  },
  border: {
    hairline: '#E7E7E7',
  },
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 28,
  xxl: 32,
} as const;

export const radius = {
  xs: 4,
  sm: 5,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
} as const;
