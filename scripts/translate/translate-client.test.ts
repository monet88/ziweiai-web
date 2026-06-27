import { describe, expect, it } from 'vitest';
import {
  buildBatchPrompt,
  buildChatCompletionsEndpoint,
  loadConfigFromEnv,
  parseBatchResponse,
} from './translate-client';
import { TranslationError } from './core';

describe('buildChatCompletionsEndpoint', () => {
  it('nối /v1/chat/completions vào base trần', () => {
    expect(buildChatCompletionsEndpoint('https://api.example.com')).toBe(
      'https://api.example.com/v1/chat/completions',
    );
  });
  it('không lặp /v1 khi base đã có /v1', () => {
    expect(buildChatCompletionsEndpoint('https://api.example.com/v1')).toBe(
      'https://api.example.com/v1/chat/completions',
    );
  });
  it('bỏ dấu / cuối', () => {
    expect(buildChatCompletionsEndpoint('https://api.example.com/')).toBe(
      'https://api.example.com/v1/chat/completions',
    );
  });
});

describe('loadConfigFromEnv', () => {
  it('đọc đủ 3 biến', () => {
    const config = loadConfigFromEnv({
      OPENAI_COMPAT_API_KEY: 'k',
      OPENAI_COMPAT_BASE_URL: 'https://api.example.com',
      OPENAI_COMPAT_MODEL: 'm',
    } as NodeJS.ProcessEnv);
    expect(config.model).toBe('m');
    expect(config.baseUrl).toBe('https://api.example.com');
  });
  it('ném + liệt kê biến thiếu, không lộ giá trị', () => {
    expect(() => loadConfigFromEnv({ OPENAI_COMPAT_API_KEY: 'k' } as NodeJS.ProcessEnv)).toThrow(
      /OPENAI_COMPAT_BASE_URL.*OPENAI_COMPAT_MODEL/,
    );
  });
});

describe('buildBatchPrompt', () => {
  it('nhúng id + text + glossary', () => {
    const prompt = buildBatchPrompt([{ id: 'sym.0', text: '蛇' }]);
    expect(prompt).toContain('sym.0');
    expect(prompt).toContain('蛇');
    expect(prompt).toContain('='); // glossary cặp han = vi
  });
});

describe('parseBatchResponse', () => {
  it('parse JSON object thuần', () => {
    const map = parseBatchResponse('{"a":"A","b":"B"}');
    expect(map.get('a')).toBe('A');
    expect(map.get('b')).toBe('B');
  });
  it('cắt được JSON bọc trong ```json fence + chữ thừa', () => {
    const map = parseBatchResponse('Đây là kết quả:\n```json\n{"a":"A"}\n```\nhết.');
    expect(map.get('a')).toBe('A');
  });
  it('trim bản dịch', () => {
    expect(parseBatchResponse('{"a":"  A  "}').get('a')).toBe('A');
  });
  it('bỏ qua value không phải string', () => {
    const map = parseBatchResponse('{"a":"A","b":123}');
    expect(map.has('b')).toBe(false);
  });
  it('ném khi không có JSON object', () => {
    expect(() => parseBatchResponse('không có gì')).toThrow(TranslationError);
  });
  it('ném khi JSON là mảng', () => {
    expect(() => parseBatchResponse('[1,2,3]')).toThrow(TranslationError);
  });
});
