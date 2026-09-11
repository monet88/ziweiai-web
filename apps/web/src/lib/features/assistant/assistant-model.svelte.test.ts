import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ConversationStreamEvent } from '@ziweiai/contracts';

const mockStreamConversationMessage = vi.fn();
const mockCreateConversation = vi.fn();

vi.mock('$lib/api-client/conversations', () => ({
  streamConversationMessage: (...args: any[]) => mockStreamConversationMessage(...args),
  createConversation: (...args: any[]) => mockCreateConversation(...args),
}));

import { createAssistantModel } from './assistant-model.svelte';

describe('assistant-model.svelte', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupModel(activePalaceScope: string | null = null) {
    let convId: string | null = 'conv-123';
    const auth = {
      getAccessToken: vi.fn().mockReturnValue('mock-jwt-token'),
    } as any;

    const queryClient = {
      invalidateQueries: vi.fn().mockResolvedValue(undefined),
    } as any;

    const model = createAssistantModel({
      auth,
      queryClient,
      getChartSnapshotId: () => 'chart-123',
      getConversationId: () => convId,
      setConversationId: (id) => {
        convId = id;
      },
      getActivePalaceScope: () => (activePalaceScope as any),
    });

    return { model, auth, queryClient };
  }

  it('forwards activePalaceScope to streamConversationMessage when sendText is called', async () => {
    async function* fakeStream(): AsyncGenerator<ConversationStreamEvent> {
      yield { type: 'chunk', delta: 'Lời giải' };
      yield {
        type: 'done',
        message: {
          id: 'msg-1',
          ownerUserId: 'u1',
          conversationId: 'conv-123',
          role: 'assistant',
          content: 'Lời giải hoàn chỉnh',
          quickPromptKey: null,
          providerName: 'deepseek',
          providerMetadata: {},
          createdAt: new Date().toISOString(),
        },
      };
    }
    mockStreamConversationMessage.mockReturnValue(fakeStream());

    const { model } = setupModel('careerPalace');
    expect(model.activePalaceScope).toBe('careerPalace');

    const success = await model.sendText('Công danh năm nay thế nào?');
    expect(success).toBe(true);

    expect(mockStreamConversationMessage).toHaveBeenCalledWith(
      'mock-jwt-token',
      'conv-123',
      expect.objectContaining({
        content: 'Công danh năm nay thế nào?',
        palaceScope: 'careerPalace',
      }),
      expect.any(AbortSignal),
    );

    expect(model.messages[0]?.palaceScope).toBe('careerPalace');
    expect(model.messages[1]?.content).toBe('Lời giải hoàn chỉnh');
  });

  it('allows overriding activePalaceScope explicitly in sendText', async () => {
    async function* fakeStream(): AsyncGenerator<ConversationStreamEvent> {
      yield {
        type: 'done',
        message: {
          id: 'msg-2',
          ownerUserId: 'u1',
          conversationId: 'conv-123',
          role: 'assistant',
          content: 'Tổng quan',
          quickPromptKey: null,
          providerName: 'deepseek',
          providerMetadata: {},
          createdAt: new Date().toISOString(),
        },
      };
    }
    mockStreamConversationMessage.mockReturnValue(fakeStream());

    const { model } = setupModel('careerPalace');

    // Truyền override = null để hỏi toàn bàn
    const success = await model.sendText('Hỏi toàn bàn', null);
    expect(success).toBe(true);

    expect(mockStreamConversationMessage).toHaveBeenCalledWith(
      'mock-jwt-token',
      'conv-123',
      expect.not.objectContaining({
        palaceScope: expect.anything(),
      }),
      expect.any(AbortSignal),
    );
  });

  it('threads palaceScope in sendQuickPrompt', async () => {
    async function* fakeStream(): AsyncGenerator<ConversationStreamEvent> {
      yield {
        type: 'done',
        message: {
          id: 'msg-3',
          ownerUserId: 'u1',
          conversationId: 'conv-123',
          role: 'assistant',
          content: 'Luận giải tài lộc',
          quickPromptKey: 'career',
          providerName: 'deepseek',
          providerMetadata: {},
          createdAt: new Date().toISOString(),
        },
      };
    }
    mockStreamConversationMessage.mockReturnValue(fakeStream());

    const { model } = setupModel('wealthPalace');
    const success = await model.sendQuickPrompt('career');
    expect(success).toBe(true);

    expect(mockStreamConversationMessage).toHaveBeenCalledWith(
      'mock-jwt-token',
      'conv-123',
      expect.objectContaining({
        quickPromptKey: 'career',
        palaceScope: 'wealthPalace',
      }),
      expect.any(AbortSignal),
    );
  });

  it('supports aborting stream smoothly', async () => {
    let yieldChunk: () => void;
    async function* fakeStream(): AsyncGenerator<ConversationStreamEvent> {
      yield { type: 'chunk', delta: 'Đang bắt đầu...' };
      await new Promise<void>((r) => {
        yieldChunk = r;
      });
      yield { type: 'chunk', delta: 'Thêm dữ liệu...' };
    }
    mockStreamConversationMessage.mockReturnValue(fakeStream());

    const { model } = setupModel();
    const sendPromise = model.sendText('Câu hỏi test');

    // Chờ chút cho generator chạy chunk đầu tiên
    await new Promise((r) => setTimeout(r, 10));
    expect(model.isGenerating).toBe(true);

    // Người dùng ấn dừng
    model.abort();
    expect(model.isGenerating).toBe(false);

    yieldChunk!();
    await sendPromise;
    expect(model.isGenerating).toBe(false);
  });

  it('preserves partial streamed message and user question when stream drops unexpectedly', async () => {
    async function* failingStream(): AsyncGenerator<ConversationStreamEvent> {
      yield { type: 'chunk', delta: 'Đoạn văn bản đã nhận được...' };
      throw new Error('Network socket disconnected');
    }
    mockStreamConversationMessage.mockReturnValue(failingStream());

    const { model } = setupModel();
    const success = await model.sendText('Câu hỏi quan trọng');

    expect(success).toBe(false);
    expect(model.isGenerating).toBe(false);
    // User message and partial assistant message must NOT be rolled back
    expect(model.messages).toHaveLength(2);
    expect(model.messages[0].role).toBe('user');
    expect(model.messages[0].content).toBe('Câu hỏi quan trọng');
    expect(model.messages[1].role).toBe('assistant');
    expect(model.messages[1].content).toBe('Đoạn văn bản đã nhận được...');
    expect(model.messages[1].isStreaming).toBe(false);
    expect(model.errorMessage).toContain('gián đoạn');
  });
});
