import { describe, it, expect } from 'vitest';
import { isDisposableEmail, maskEmail } from './disposable-email';

describe('disposable-email module', () => {
  describe('isDisposableEmail', () => {
    it('nhận diện chính xác các domain email rác phổ biến', () => {
      expect(isDisposableEmail('bot1@tempmail.com')).toBe(true);
      expect(isDisposableEmail('spammer@10minutemail.com')).toBe(true);
      expect(isDisposableEmail('fake@mailinator.com')).toBe(true);
      expect(isDisposableEmail('test@guerrillamail.com')).toBe(true);
      expect(isDisposableEmail('user@trashmail.com')).toBe(true);
      expect(isDisposableEmail('abc@yopmail.com')).toBe(true);
      expect(isDisposableEmail('bot@sharklasers.com')).toBe(true);
    });

    it('không nhầm lẫn với các dịch vụ email chuẩn', () => {
      expect(isDisposableEmail('user@gmail.com')).toBe(false);
      expect(isDisposableEmail('work@yahoo.com')).toBe(false);
      expect(isDisposableEmail('admin@outlook.com')).toBe(false);
      expect(isDisposableEmail('contact@domain.vn')).toBe(false);
      expect(isDisposableEmail('developer@icloud.com')).toBe(false);
    });

    it('xử lý an toàn các giá trị biên', () => {
      expect(isDisposableEmail('')).toBe(false);
      expect(isDisposableEmail(null as any)).toBe(false);
      expect(isDisposableEmail(undefined as any)).toBe(false);
      expect(isDisposableEmail('invalid-email-string')).toBe(false);
      expect(isDisposableEmail('notanemail@')).toBe(false);
      expect(isDisposableEmail('@tempmail.com')).toBe(true);
    });

    it('hỗ trợ case-insensitive và whitespace', () => {
      expect(isDisposableEmail('  USER@TEMPMAIL.COM  ')).toBe(true);
      expect(isDisposableEmail('  USER@GMAIL.COM  ')).toBe(false);
    });
  });

  describe('maskEmail', () => {
    it('che mờ đúng chuẩn email', () => {
      expect(maskEmail('galaxypro710@gmail.com')).toBe('g***0@gmail.com');
      expect(maskEmail('john@example.com')).toBe('j***n@example.com');
      expect(maskEmail('ab@gmail.com')).toBe('a***b@gmail.com');
      expect(maskEmail('a@gmail.com')).toBe('a***@gmail.com');
    });

    it('xử lý chuỗi không phải email', () => {
      expect(maskEmail('GalaxyPro')).toBe('G***o');
      expect(maskEmail('AB')).toBe('A***');
      expect(maskEmail('A')).toBe('A***');
    });

    it('xử lý giá trị rỗng/null/undefined', () => {
      expect(maskEmail('')).toBe('Người dùng ẩn danh');
      expect(maskEmail(null)).toBe('Người dùng ẩn danh');
      expect(maskEmail(undefined)).toBe('Người dùng ẩn danh');
      expect(maskEmail('   ')).toBe('Người dùng ẩn danh');
    });
  });
});
