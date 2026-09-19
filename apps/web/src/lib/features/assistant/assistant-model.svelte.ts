/**
 * Assistant model (Svelte 5 runes) for US-018: multi-turn AI conversation + SSE streaming.
 *
 * Contract:
 * - Token đọc TƯƠI qua auth.getAccessToken() ngay trước mỗi request (không snapshot).
 * - Dùng createMutation (hoặc mutation + stream) để append; KHÔNG mutate state trực tiếp.
 * - Optimistic append user message; stream assistant delta → append từng chunk.
 * - Cuối stream (done) nhận message record từ server → replace bằng bản ghi thật (immutable).
 * - Invalidate query liên quan sau khi done (conversation-detail).
 * - Quick prompt: chỉ gửi key; server resolve nội dung prompt (web chỉ giữ label).
 *
 * SSE parsing dùng streamConversationMessage + collectAssistantStream từ api-client.
 */

import type { ConversationMessageRecord, CreateConversationMessageRequest, PalaceScope, QuickPromptKey } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import type { QueryClient } from '@tanstack/svelte-query';
import { streamConversationMessage, createConversation } from '$lib/api-client/conversations';;
import { QUICK_PROMPT_LABELS } from './quick-prompts';
import { viCopy } from '$lib/i18n/vi';

export interface AssistantModelOptions {
  auth: AuthStore;
  queryClient: QueryClient;
  /** Getter chartSnapshotId (chartRecord.id) để tạo conversation. */
  getChartSnapshotId: () => string | null;
  /** Getter conversationId hiện tại (nếu đã có). */
  getConversationId: () => string | null;
  /** Setter để lưu conversationId sau khi tạo. */
  setConversationId: (id: string) => void;
  /** Getter cung vị trọng điểm đang chọn trên lá số (Tam Phương Tứ Chính & Liên Cung). */
  getActivePalaceScope?: () => PalaceScope | null;
}

export interface AssistantMessageView {
  id: string | null; // null cho optimistic user/assistant chưa có record
  role: 'user' | 'assistant';
  content: string;
  quickPromptKey?: QuickPromptKey | null;
  palaceScope?: PalaceScope | null;
  isStreaming?: boolean;
}

export function createAssistantModel(options: AssistantModelOptions) {
  const auth = options.auth;
  const queryClient = options.queryClient;

  // Local UI transcript (immutable append). Không phụ thuộc query cache để render realtime stream.
  let messages = $state<AssistantMessageView[]>([]);
  let currentConversationId = $state<string | null>(null);
  let isGenerating = $state(false);
  let lastError = $state<string | null>(null);
  let currentAbortController: AbortController | null = null;

  function getTokenOrThrow(): string {
    const token = auth.getAccessToken();
    if (!token) {
      throw new Error(viCopy.errors.createChartRequiresSignIn);
    }
    return token;
  }

  function ensureConversationId(): string | null {
    return currentConversationId ?? options.getConversationId();
  }

  async function ensureOrCreateConversation(): Promise<string> {
    const existing = ensureConversationId();
    if (existing) return existing;

    const chartId = options.getChartSnapshotId();
    if (!chartId) {
      throw new Error(viCopy.chart.chartNotAvailableFallback);
    }

    const token = getTokenOrThrow();
    const res = await createConversation(token, { chartSnapshotId: chartId });
    const id = res.conversation.id;
    currentConversationId = id;
    options.setConversationId(id);
    return id;
  }

  async function appendUserAndStream(request: CreateConversationMessageRequest): Promise<boolean> {
    if (isGenerating) return false;
    isGenerating = true;
    lastError = null;
    currentAbortController = new AbortController();

    // Optimistic user message
    const displayContent = request.content ?? (request.quickPromptKey ? (QUICK_PROMPT_LABELS[request.quickPromptKey] ?? '') : '');
    const userView: AssistantMessageView = {
      id: null,
      role: 'user',
      content: displayContent,
      quickPromptKey: request.quickPromptKey ?? null,
      palaceScope: request.palaceScope ?? null,
    };
    messages = [...messages, userView];

    // Optimistic streaming assistant placeholder
    const assistantPlaceholder: AssistantMessageView = {
      id: null,
      role: 'assistant',
      content: '',
      isStreaming: true,
    };
    messages = [...messages, assistantPlaceholder];

    try {
      const conversationId = await ensureOrCreateConversation();
      const token = getTokenOrThrow();

      // Capture the index of the assistant placeholder we just pushed for immutable updates
      const assistantIdx = messages.length - 1;

      let streamedText = '';

      for await (const evt of streamConversationMessage(token, conversationId, request, currentAbortController.signal)) {
        if (evt.type === 'chunk') {
          streamedText += evt.delta;
          messages = [
            ...messages.slice(0, assistantIdx),
            {
              id: null,
              role: 'assistant',
              content: streamedText,
              isStreaming: true,
            },
          ];
        } else if (evt.type === 'done') {
          messages = [
            ...messages.slice(0, assistantIdx),
            {
              id: evt.message.id,
              role: 'assistant',
              content: evt.message.content,
              isStreaming: false,
            },
          ];
        } else if (evt.type === 'error') {
          throw new Error(evt.error.message);
        }
      }

      // Invalidate detail queries so other views (future list) sync
      await queryClient.invalidateQueries({ queryKey: ['conversation-detail', conversationId] });
      return true;
    } catch (err) {
      if (currentAbortController?.signal.aborted) {
        // User aborted intentionally: keep streamed text, stop streaming flag
        const lastIdx = messages.length - 1;
        if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
          messages = [
            ...messages.slice(0, lastIdx),
            {
              ...messages[lastIdx],
              isStreaming: false,
            },
          ];
        }
        return true;
      }

      // SSE Stream Resilience (Sprint 64):
      // Nếu lỗi xảy ra khi đang stream nhưng ĐÃ nhận được một phần nội dung (last.content.length > 0):
      // Tuyệt đối không rollback xóa bỏ tin nhắn của user và câu trả lời dở dang!
      // Giữ lại nội dung đã stream, tắt cờ isStreaming và hiển thị thông báo gián đoạn nhẹ nhàng.
      // Chỉ khi chưa nhận được bất kỳ token nào (content rỗng) mới rollback 2 message để user có thể gửi lại.
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant' && last.isStreaming) {
        if (last.content.trim().length > 0) {
          messages = [
            ...messages.slice(0, -1),
            {
              ...last,
              isStreaming: false,
            },
          ];
          lastError = 'Kết nối gián đoạn. Đoạn văn bản đàm đạo đã nhận được bảo toàn an toàn.';
        } else {
          messages = messages.slice(0, -2);
          lastError = err instanceof Error ? err.message : viCopy.explanation.statusFailed;
        }
      } else {
        lastError = err instanceof Error ? err.message : viCopy.explanation.statusFailed;
      }
      return false;
    } finally {
      currentAbortController = null;
      isGenerating = false;
    }
  }

  async function sendText(content: string, overridePalaceScope?: PalaceScope | null): Promise<boolean> {
    const palaceScope = overridePalaceScope !== undefined ? overridePalaceScope : (options.getActivePalaceScope?.() ?? null);
    return appendUserAndStream({
      content,
      providerPreference: 'auto',
      ...(palaceScope ? { palaceScope } : {}),
    });
  }

  async function sendQuickPrompt(quickPromptKey: QuickPromptKey, overridePalaceScope?: PalaceScope | null): Promise<boolean> {
    const palaceScope = overridePalaceScope !== undefined ? overridePalaceScope : (options.getActivePalaceScope?.() ?? null);
    return appendUserAndStream({
      quickPromptKey,
      providerPreference: 'auto',
      ...(palaceScope ? { palaceScope } : {}),
    });
  }

  function resetForNewConversation() {
    messages = [];
    currentConversationId = null;
    lastError = null;
  }

  function loadFromRecords(records: ConversationMessageRecord[]) {
    messages = records.map((r) => ({
      id: r.id,
      role: r.role,
      content: r.content,
      quickPromptKey: (r.quickPromptKey as QuickPromptKey | null) ?? null,
    }));
  }

  function abort(): void {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    isGenerating = false;
    const lastIdx = messages.length - 1;
    if (lastIdx >= 0 && messages[lastIdx].role === 'assistant' && messages[lastIdx].isStreaming) {
      messages = [
        ...messages.slice(0, lastIdx),
        {
          ...messages[lastIdx],
          isStreaming: false,
        },
      ];
    }
  }

  return {
    get messages(): AssistantMessageView[] {
      return messages;
    },
    get isGenerating(): boolean {
      return isGenerating;
    },
    get errorMessage(): string | null {
      return lastError;
    },
    get conversationId(): string | null {
      return ensureConversationId();
    },
    get activePalaceScope(): PalaceScope | null {
      return options.getActivePalaceScope?.() ?? null;
    },
    sendText,
    sendQuickPrompt,
    abort,
    resetForNewConversation,
    loadFromRecords,
  };
}

export type AssistantModel = ReturnType<typeof createAssistantModel>;
