// Design tokens (ngôn ngữ thiết kế: Notion paper-calm, xem DESIGN.md + decision 0018).
// Web tiêu thụ chủ yếu qua CSS custom properties trong tokens.css; bản TS này giữ cho
// logic cần token số học (vd tính toán layout) tham chiếu cùng một nguồn giá trị.
export const colors = {
  background: {
    primary: '#F6F5F4',
    elevated: '#EFEDEA',
    surface: '#FFFFFF',
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#31302E',
    muted: '#615D59',
  },
  accent: {
    primary: '#0075DE',
    primaryPressed: '#005BAB',
    primarySoft: '#CFE4FA',
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
    hairline: '#E6E6E6',
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
