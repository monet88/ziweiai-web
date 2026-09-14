import { describe, expect, it } from 'vitest';
import { GeminiChatAdapter } from './gemini-chat-adapter';
import { ProviderUnavailableError } from './provider-errors';

describe('GeminiChatAdapter.parseResult', () => {
  const adapter = new GeminiChatAdapter();

  it('surfaces the HTTP status when a non-2xx response body is non-JSON (proxy error page)', async () => {
    // Regression: a 502/504 HTML error page from a proxy must NOT make JSON.parse throw before the
    // !response.ok branch. The status/statusText has to survive so debugging upstream is possible.
    const response = new Response('<html><body>502 Bad Gateway</body></html>', {
      status: 502,
      statusText: 'Bad Gateway',
      headers: { 'Content-Type': 'text/html' },
    });

    await expect(adapter.parseResult(response)).rejects.toThrow(
      'Yêu cầu Gemini thất bại: HTTP 502 Bad Gateway.',
    );
  });

  it('prefers the upstream error message when a non-2xx body is JSON', async () => {
    const response = new Response(JSON.stringify({ error: { message: 'API key invalid' } }), {
      status: 401,
      statusText: 'Unauthorized',
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(adapter.parseResult(response)).rejects.toThrow('Yêu cầu Gemini thất bại: API key invalid');
  });

  it('parses a successful native response into text + usage', async () => {
    const response = new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'xin chao' }] }, finishReason: 'STOP' }],
        usageMetadata: { totalTokenCount: 7, promptTokenCount: 5, candidatesTokenCount: 2 },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

    const result = await adapter.parseResult(response);
    expect(result.text).toBe('xin chao');
    expect(result.usage).toEqual({ promptTokens: 5, completionTokens: 2, totalTokens: 7 });
  });

  it('rejects an empty 2xx body as an unavailable Gemini result', async () => {
    const response = new Response('', { status: 200, headers: { 'Content-Type': 'application/json' } });
    await expect(adapter.parseResult(response)).rejects.toThrow(ProviderUnavailableError);
    await expect(adapter.parseResult(new Response('', { status: 200 }))).rejects.toThrow(
      'Gemini trả về phản hồi rỗng.',
    );
  });

  it('rejects truncated responses with MAX_TOKENS finishReason', async () => {
    const response = new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'bài viết dở dang...' }] }, finishReason: 'MAX_TOKENS' }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
    await expect(adapter.parseResult(response)).rejects.toThrow(
      'Phản hồi từ Gemini bị vượt quá giới hạn độ dài token.',
    );
  });

  it('rejects responses blocked by SAFETY filter', async () => {
    const response = new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [] }, finishReason: 'SAFETY' }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
    await expect(adapter.parseResult(response)).rejects.toThrow(
      'Phản hồi từ Gemini bị chặn bởi bộ lọc an toàn.',
    );
  });
});

describe('GeminiChatAdapter.resolveModel', () => {
  const adapter = new GeminiChatAdapter();

  it('respects modelOverride regardless of tier', () => {
    expect(adapter.resolveModel('custom-model-override', 'light')).toBe('custom-model-override');
    expect(adapter.resolveModel('custom-model-override', 'deep')).toBe('custom-model-override');
  });

  it('resolves to GEMINI_MODEL_LIGHT when tier is light', () => {
    expect(adapter.resolveModel(undefined, 'light')).toBe('gemini-2.0-flash-lite');
  });

  it('resolves to GEMINI_MODEL_DEEP when tier is deep', () => {
    expect(adapter.resolveModel(undefined, 'deep')).toBe('gemini-2.5-flash');
  });

  it('falls back to default GEMINI_MODEL when tier is undefined', () => {
    expect(adapter.resolveModel()).toBe('gemini-2.5-flash');
  });
});
