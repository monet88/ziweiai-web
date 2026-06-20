import { describe, it, expect } from 'vitest';
import { todayAsOf, currentMonthAsOf, currentYear } from './fortune-dates';

// Dùng giờ địa phương: tạo Date qua constructor (y, m, d) để mốc bám đúng timezone máy chạy,
// tránh lệch ngày do parse chuỗi ISO (UTC).
describe('fortune-dates (US-016)', () => {
  describe('todayAsOf', () => {
    it('định dạng YYYY-MM-DD với zero-pad tháng và ngày', () => {
      const now = new Date(2026, 0, 5); // 5 tháng 1 2026
      expect(todayAsOf(now)).toBe('2026-01-05');
    });

    it('giữ nguyên hai chữ số khi tháng/ngày >= 10', () => {
      const now = new Date(2026, 11, 25); // 25 tháng 12 2026
      expect(todayAsOf(now)).toBe('2026-12-25');
    });
  });

  describe('currentMonthAsOf', () => {
    it('định dạng YYYY-MM với zero-pad tháng', () => {
      const now = new Date(2026, 2, 15); // tháng 3
      expect(currentMonthAsOf(now)).toBe('2026-03');
    });

    it('giữ hai chữ số khi tháng >= 10', () => {
      const now = new Date(2026, 9, 1); // tháng 10
      expect(currentMonthAsOf(now)).toBe('2026-10');
    });
  });

  describe('currentYear', () => {
    it('trả về năm dạng số', () => {
      const now = new Date(2026, 5, 19);
      expect(currentYear(now)).toBe(2026);
    });
  });
});
