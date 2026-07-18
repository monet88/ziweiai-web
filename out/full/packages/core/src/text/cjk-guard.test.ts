import { describe, expect, it } from 'vitest';
import { CJK_TEXT_PATTERN, containsCjkText } from './cjk-guard';

describe('containsCjkText', () => {
  it('detects Han, Japanese kana, Hangul, Bopomofo, CJK punctuation and fullwidth forms', () => {
    const samples = [
      '命宫', // Han
      'ひらがな', // Hiragana
      'カタカナ', // Katakana
      '한글', // Hangul
      'ㄅㄆㄇ', // Bopomofo
      '。、《》', // CJK punctuation
      'ＡＢＣ１２３', // fullwidth Latin/digits
    ];

    for (const sample of samples) {
      expect(containsCjkText(sample), `expected CJK detection for: ${sample}`).toBe(true);
    }
  });

  it('passes Vietnamese (with diacritics) and plain Latin/ASCII text', () => {
    const clean = ['Tử Vi', 'Mệnh chủ', 'Đại Vận 6–15', 'soulPalace', 'Giáp Tý', 'Lưu Niên 2026'];

    for (const value of clean) {
      expect(containsCjkText(value), `expected no CJK for: ${value}`).toBe(false);
    }
  });

  it('does not retain regex lastIndex state across repeated tests', () => {
    expect(CJK_TEXT_PATTERN.test('命')).toBe(true);
    expect(CJK_TEXT_PATTERN.test('命')).toBe(true);
    expect(CJK_TEXT_PATTERN.test('Tử Vi')).toBe(false);
  });
});
