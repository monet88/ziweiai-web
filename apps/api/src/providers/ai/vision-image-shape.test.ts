import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExplanationPromptPayload } from './ai-explanation-provider';

// US-017e: kiểm shape request ảnh cho CẢ 3 provider. deepseek + openai-compat dùng content part
// image_url (data URL base64); gemini dùng inlineData {mimeType, data:base64}. Nếu một provider
// build sai shape, failover âm thầm bỏ ảnh → LLM "ảo" — nên cần test riêng từng shape.

const TEST_BASE64 = 'aGVsbG8td29ybGQ='; // "hello-world"
const TEST_MIME = 'image/png';

const visionPayload: ExplanationPromptPayload = {
  explanationKind: 'vision-face',
  promptOverride: 'Hãy phân tích tấm ảnh khuôn mặt được đính kèm.',
  imageInput: { base64: TEST_BASE64, mimeType: TEST_MIME },
};

function parseRequestBody(fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
  return JSON.parse(String(init?.body)) as Record<string, unknown>;
}

function okOpenAiStyle(): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content: 'Phân tích tướng mặt.' } }], usage: {} }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Vision image request shape', () => {
  beforeEach(() => {
    process.env.DEEPSEEK_API_KEY = 'ds-test';
    process.env.DEEPSEEK_MODEL = 'deepseek-v4-pro';
    process.env.OPENAI_COMPAT_API_KEY = 'oc-test';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://api.openai.test';
    process.env.OPENAI_COMPAT_MODEL = 'gpt-4o-mini';
    process.env.GEMINI_API_KEY = 'gm-test';
    process.env.GEMINI_MODEL = 'gemini-3.5-flash';
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_MODEL;
    delete process.env.OPENAI_COMPAT_API_KEY;
    delete process.env.OPENAI_COMPAT_BASE_URL;
    delete process.env.OPENAI_COMPAT_MODEL;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
  });

  it('deepseek builds an OpenAI-style image_url content part (data URL)', async () => {
    const fetchMock = vi.fn(async () => okOpenAiStyle());
    vi.stubGlobal('fetch', fetchMock);

    const { DeepseekExplanationProvider } = await import('./deepseek-explanation-provider');
    await new DeepseekExplanationProvider().generateExplanation(visionPayload);

    const body = parseRequestBody(fetchMock);
    const messages = body.messages as Array<{ role: string; content: unknown }>;
    const userContent = messages[1]?.content as Array<Record<string, unknown>>;
    expect(Array.isArray(userContent)).toBe(true);
    expect(userContent[0]).toEqual({ type: 'text', text: visionPayload.promptOverride });
    expect(userContent[1]).toEqual({
      type: 'image_url',
      image_url: { url: `data:${TEST_MIME};base64,${TEST_BASE64}` },
    });
  });

  it('openai-compat builds an OpenAI-style image_url content part (data URL)', async () => {
    const fetchMock = vi.fn(async () => okOpenAiStyle());
    vi.stubGlobal('fetch', fetchMock);

    const { OpenAiCompatibleExplanationProvider } = await import('./openai-compatible-explanation-provider');
    await new OpenAiCompatibleExplanationProvider().generateExplanation(visionPayload);

    const body = parseRequestBody(fetchMock);
    const messages = body.messages as Array<{ role: string; content: unknown }>;
    const userContent = messages[1]?.content as Array<Record<string, unknown>>;
    expect(Array.isArray(userContent)).toBe(true);
    expect(userContent[1]).toEqual({
      type: 'image_url',
      image_url: { url: `data:${TEST_MIME};base64,${TEST_BASE64}` },
    });
  });

  it('gemini builds an inlineData part with raw base64 (not a data URL)', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Phân tích tướng mặt.' }] } }], usageMetadata: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { GeminiExplanationProvider } = await import('./gemini-explanation-provider');
    await new GeminiExplanationProvider().generateExplanation(visionPayload);

    const body = parseRequestBody(fetchMock);
    const contents = body.contents as Array<{ parts: Array<Record<string, unknown>> }>;
    const parts = contents[0]?.parts ?? [];
    expect(parts[0]).toEqual({ text: visionPayload.promptOverride });
    expect(parts[1]).toEqual({ inlineData: { mimeType: TEST_MIME, data: TEST_BASE64 } });
  });

  it('text-only payloads keep a string user content (no image part)', async () => {
    const fetchMock = vi.fn(async () => okOpenAiStyle());
    vi.stubGlobal('fetch', fetchMock);

    const { DeepseekExplanationProvider } = await import('./deepseek-explanation-provider');
    await new DeepseekExplanationProvider().generateExplanation({
      explanationKind: 'vision-face',
      promptOverride: 'Chỉ có chữ, không ảnh.',
    });

    const body = parseRequestBody(fetchMock);
    const messages = body.messages as Array<{ role: string; content: unknown }>;
    expect(typeof messages[1]?.content).toBe('string');
  });
});
