import { describe, expect, it } from 'vitest';
import { CJK_TEXT_PATTERN } from '@ziweiai/core';
import {
  buildImageDataUrl,
  mimeTypeToExtension,
} from './vision-prompt';
import { buildVisionUserPrompt } from '../../modules/vision-shared/vision-prompts';

describe('vision-prompt helpers', () => {
  it('builds an OpenAI-style data URL', () => {
    expect(buildImageDataUrl('image/png', 'YWJj')).toBe('data:image/png;base64,YWJj');
  });

  it('maps mime types to storage extensions', () => {
    expect(mimeTypeToExtension('image/jpeg')).toBe('jpg');
    expect(mimeTypeToExtension('image/png')).toBe('png');
    expect(mimeTypeToExtension('image/webp')).toBe('webp');
    expect(mimeTypeToExtension('application/octet-stream')).toBe('bin');
  });
});

describe('buildVisionUserPrompt', () => {
  it('builds a Vietnamese face prompt without Han-script text', () => {
    const prompt = buildVisionUserPrompt('face');
    expect(prompt).toContain('khuôn mặt');
    expect(prompt).toContain('Tam đình');
    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('builds a Vietnamese palm prompt without Han-script text', () => {
    const prompt = buildVisionUserPrompt('palm');
    expect(prompt).toContain('lòng bàn tay');
    expect(prompt).toContain('đường sinh đạo');
    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('đặt câu hỏi người dùng làm trọng tâm khi có (trả lời trực tiếp, không theo form chung)', () => {
    const prompt = buildVisionUserPrompt('face', 'Sự nghiệp của tôi thế nào?');
    expect(prompt).toContain('Sự nghiệp của tôi thế nào?');
    expect(prompt).toContain('Nhiệm vụ chính của bạn là TRẢ LỜI');
    expect(prompt).toContain('## Trả lời câu hỏi của bạn');
    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
  });
});
