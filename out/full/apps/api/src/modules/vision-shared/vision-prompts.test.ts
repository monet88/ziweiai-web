import { describe, expect, it } from 'vitest';
import { buildVisionUserPrompt } from './vision-prompts';

// US-017e/f: prompt builder phải đặt câu hỏi user làm TRỌNG TÂM khi có (bug: hỏi "tình duyên"
// nhưng AI chỉ trả lời theo form 6 mục chung). Không có câu hỏi → luận giải tổng quát (luồng cũ).
describe('buildVisionUserPrompt', () => {
  it('không câu hỏi: dựng prompt tổng quát theo khung cấu trúc đầy đủ (face)', () => {
    const prompt = buildVisionUserPrompt('face');

    expect(prompt).toContain('khuôn mặt');
    expect(prompt).toContain('Tam đình'); // mục cấu trúc đầy đủ
    expect(prompt).not.toContain('Nhiệm vụ chính của bạn là TRẢ LỜI');
    expect(prompt).not.toContain('## Trả lời câu hỏi của bạn');
  });

  it('không câu hỏi: dựng prompt tổng quát (palm)', () => {
    const prompt = buildVisionUserPrompt('palm');

    expect(prompt).toContain('lòng bàn tay');
    expect(prompt).toContain('ba đường chính'.replace('ba', 'Ba')); // PALM_STRUCTURE mục 2
    expect(prompt).not.toContain('Nhiệm vụ chính của bạn là TRẢ LỜI');
  });

  it('có câu hỏi: đặt câu hỏi lên ĐẦU + chỉ thị trả lời trực tiếp + đoạn chốt cuối', () => {
    const question = 'Đường tình duyên của tôi ra sao?';
    const prompt = buildVisionUserPrompt('palm', question);

    // Câu hỏi xuất hiện sớm (trước khung cấu trúc), không bị chôn ở cuối.
    const questionIdx = prompt.indexOf(question);
    const structureIdx = prompt.indexOf('Ba đường chính');
    expect(questionIdx).toBeGreaterThan(-1);
    expect(structureIdx).toBeGreaterThan(-1);
    expect(questionIdx).toBeLessThan(structureIdx);

    // Chỉ thị bám sát câu hỏi + đoạn đúc kết cuối bài.
    expect(prompt).toContain('Nhiệm vụ chính của bạn là TRẢ LỜI');
    expect(prompt).toContain('## Trả lời câu hỏi của bạn');
    // Câu hỏi được nhắc lại trong yêu cầu đoạn chốt (xuất hiện ≥ 2 lần).
    expect(prompt.split(question).length - 1).toBeGreaterThanOrEqual(2);
  });

  it('câu hỏi chỉ chứa khoảng trắng: coi như không có câu hỏi (luồng tổng quát)', () => {
    const prompt = buildVisionUserPrompt('face', '   ');

    expect(prompt).not.toContain('Nhiệm vụ chính của bạn là TRẢ LỜI');
    expect(prompt).toContain('Tam đình');
  });

  it('trim câu hỏi trước khi nhúng vào prompt', () => {
    const prompt = buildVisionUserPrompt('face', '  Sự nghiệp năm nay?  ');

    expect(prompt).toContain('"Sự nghiệp năm nay?"');
    expect(prompt).not.toContain('  Sự nghiệp năm nay?  ');
  });

  it('luôn giữ bất biến ngôn ngữ: prompt không chứa chữ Hán', () => {
    const withQuestion = buildVisionUserPrompt('palm', 'Tài lộc thế nào?');
    const withoutQuestion = buildVisionUserPrompt('face');

    expect(withQuestion).not.toMatch(/\p{Script=Han}/u);
    expect(withoutQuestion).not.toMatch(/\p{Script=Han}/u);
  });
});
