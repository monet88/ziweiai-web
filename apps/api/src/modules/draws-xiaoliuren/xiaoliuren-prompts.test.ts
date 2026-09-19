import { describe, expect, it } from 'vitest';
import { calculateXiaoLiuRen } from '@ziweiai/astro-engine';
import { buildXiaoLiuRenPrompt } from './xiaoliuren-prompts';

const HAN_TEXT_PATTERN = /\p{Script=Han}/u;

describe('xiaoliuren-prompts', () => {
  it('dựng prompt không chứa chữ Hán', () => {
    const calc = calculateXiaoLiuRen({
      question: 'Việc mở rộng kinh doanh tháng này có thuận không?',
      method: 'numbers',
      numbers: [2, 5, 8],
    });

    const prompt = buildXiaoLiuRenPrompt(calc);
    expect(HAN_TEXT_PATTERN.test(prompt)).toBe(false);
    expect(prompt).toContain('Việc mở rộng kinh doanh tháng này có thuận không?');
    expect(prompt).toContain('Quẻ Chủ');
    expect(prompt).toContain('Dòng khí ngũ hành');
    expect(prompt).toContain('## Tóm lại');
  });

  it('chèn đầy đủ ba cung và thơ quyết', () => {
    const calc = calculateXiaoLiuRen({
      question: 'Hỏi về tài lộc',
      method: 'time',
      date: new Date(2026, 1, 17, 12, 0, 0),
    });

    const prompt = buildXiaoLiuRenPrompt(calc);
    expect(prompt).toContain('Cung khởi điểm');
    expect(prompt).toContain('Cung chuyển hóa');
    expect(prompt).toContain('Quẻ Chủ');
    expect(prompt).toContain('Đại An');
    expect(prompt).toContain('Thanh Long');
  });
});
