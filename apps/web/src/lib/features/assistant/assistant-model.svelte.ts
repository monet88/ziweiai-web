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

import type { ConversationMessageRecord, CreateConversationMessageRequest, QuickPromptKey } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import type { QueryClient } from '@tanstack/svelte-query';
import { streamConversationMessage, createConversation } from '$lib/api-client';
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
}

export interface AssistantMessageView {
  id: string | null; // null cho optimistic user/assistant chưa có record
  role: 'user' | 'assistant';
  content: string;
  quickPromptKey?: QuickPromptKey | null;
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

    // Optimistic user message
    const displayContent = request.content ?? (request.quickPromptKey ? (QUICK_PROMPT_LABELS[request.quickPromptKey] ?? '') : '');
    const userView: AssistantMessageView = {
      id: null,
      role: 'user',
      content: displayContent,
      quickPromptKey: request.quickPromptKey ?? null,
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

      for await (const evt of streamConversationMessage(token, conversationId, request)) {
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
      // Remove the placeholder assistant ONLY if it is still streaming. If the stream already emitted
      // `done` (placeholder replaced by the real message, isStreaming=false) a late error — e.g. a
      // network close after completion — must not discard the completed answer.
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant' && last.isStreaming) {
        messages = messages.slice(0, -1);
      }
      lastError = err instanceof Error ? err.message : viCopy.explanation.statusFailed;
      // Do NOT rethrow: callers are UI event handlers, and an unawaited rejection would surface as an
      // unhandled promise rejection. The error is already captured in `lastError` for display; return
      // false so callers can react (e.g. restore the composer input).
      return false;
    } finally {
      isGenerating = false;
    }
  }

  async function sendText(content: string): Promise<boolean> {
    return appendUserAndStream({
      content,
      providerPreference: 'auto',
    });
  }

  async function sendQuickPrompt(quickPromptKey: QuickPromptKey): Promise<boolean> {
    return appendUserAndStream({
      quickPromptKey,
      providerPreference: 'auto',
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
    sendText,
    sendQuickPrompt,
    resetForNewConversation,
    loadFromRecords,
  };
}

export type AssistantModel = ReturnType<typeof createAssistantModel>;
