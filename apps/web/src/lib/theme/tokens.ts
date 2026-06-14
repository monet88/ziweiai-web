// Design tokens (giá trị nguồn từ apps/app/src/theme/tokens.ts). Web tiêu thụ qua
// CSS custom properties trong tokens.css; bản TS này giữ cho logic cần token số học
// (vd tính toán layout) tham chiếu cùng một nguồn giá trị.
export const colors = {
  background: {
    primary: '#0B0B0D',
    elevated: '#111214',
    surface: '#1A1B1E',
  },
  text: {
    primary: '#F3F0E7',
    secondary: '#D9D9DF',
    muted: '#8F8B80',
  },
  accent: {
    gold: '#C8B780',
    goldSoft: '#E3D2A2',
    ai: '#6E5FA6',
    danger: '#D36A5B',
  },
  border: {
    hairline: '#2C2924',
    gold: '#6F6140',
  },
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;
