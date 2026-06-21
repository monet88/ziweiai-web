import { describe, expect, it } from 'vitest';
import { CJK_TEXT_PATTERN } from '@ziweiai/core';
import {
  DEEPSEEK_VISION_CAPABLE_MODELS,
  buildImageDataUrl,
  isDeepseekModelVisionCapable,
  mimeTypeToExtension,
} from './vision-prompt';
import { buildVisionUserPrompt } from '../../modules/vision-shared/vision-prompts';

describe('vision-prompt helpers', () => {
  it('only allowlists DeepSeek vision-capable models (pro yes, flash no)', () => {
    expect(isDeepseekModelVisionCapable('deepseek-v4-pro')).toBe(true);
    expect(isDeepseekModelVisionCapable('deepseek-v4-flash')).toBe(false);
    expect(DEEPSEEK_VISION_CAPABLE_MODELS.has('deepseek-v4-pro')).toBe(true);
  });

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

  it('appends the user question when provided', () => {
    const prompt = buildVisionUserPrompt('face', 'Sự nghiệp của tôi thế nào?');
    expect(prompt).toContain('Câu hỏi người dùng đặc biệt quan tâm: Sự nghiệp của tôi thế nào?');
  });
});
