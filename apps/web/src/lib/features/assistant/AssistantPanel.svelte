<script lang="ts">
  /**
   * AssistantPanel: panel hội thoại AI multi-turn (US-018).
   *
   * - Hiển thị transcript (user/assistant) với streaming.
   * - Quick prompt buttons: chỉ gửi key (server resolve nội dung).
   * - Text input + gửi.
   * - Không render chữ Hán (đã enforce ở contracts + server prompt + scan test).
   */
  import { getAuthStore } from '$lib/auth/auth-context';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { viCopy } from '$lib/i18n/vi';
  import { createAssistantModel } from './assistant-model.svelte';
  import { QUICK_PROMPT_KEYS, QUICK_PROMPT_LABELS, type QuickPromptKey } from './quick-prompts';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';

  interface Props {
    chartSnapshotId: string;
    conversationId?: string | null;
    onConversationCreated?: (id: string) => void;
  }

  let { chartSnapshotId, conversationId: initialConversationId = null, onConversationCreated }: Props = $props();

  const auth = getAuthStore();
  const queryClient = useQueryClient();

  // Conversation id lives here. Seeded from the prop, then owned locally once the model creates one.
  // The parent (ChartDetailScreen) is remounted via {#key chartId} on every chart switch, so there is
  // no stale-prop case to reconcile and NO $effect write-back is needed (unidirectional flow, §3).
  // Intentional one-time seed; remount handles prop changes.
  // svelte-ignore state_referenced_locally
  let localConversationId = $state<string | null>(initialConversationId);

  const assistant = createAssistantModel({
    auth,
    queryClient,
    getChartSnapshotId: () => chartSnapshotId,
    getConversationId: () => localConversationId,
    setConversationId: (id) => {
      localConversationId = id;
      onConversationCreated?.(id);
    },
  });

  let inputValue = $state('');

  async function handleSendText() {
    const text = inputValue.trim();
    if (!text) return;
    inputValue = '';
    const ok = await assistant.sendText(text);
    if (!ok) {
      // Restore the draft so a failed send (network/quota/provider) does not make the user retype it.
      inputValue = text;
    }
  }

  async function handleQuickPrompt(key: QuickPromptKey) {
    await assistant.sendQuickPrompt(key);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendText();
    }
  }
</script>

<section class="assistant" aria-labelledby="assistant-title">
  <h3 id="assistant-title" class="title">{viCopy.assistant.title}</h3>

  <div class="quick-row" role="group" aria-label={viCopy.assistant.quickPromptsLabel}>
    {#each QUICK_PROMPT_KEYS as key (key)}
      <button
        type="button"
        class="quick-btn"
        onclick={() => handleQuickPrompt(key)}
        disabled={assistant.isGenerating}
      >
        {QUICK_PROMPT_LABELS[key]}
      </button>
    {/each}
  </div>

  <div class="transcript" aria-live="polite">
    {#if assistant.messages.length === 0}
      <p class="hint">{viCopy.assistant.hint}</p>
    {:else}
      {#each assistant.messages as m, idx (idx)}
        <div class={m.role === 'user' ? 'msg user' : 'msg assistant'}>
          <div class="role">{m.role === 'user' ? viCopy.assistant.roleUser : viCopy.assistant.roleAssistant}</div>
          <div class="content" class:streaming={m.isStreaming}>
            {#if m.role === 'assistant' && !m.quickPromptKey}
              <!-- Assistant prose is markdown: reuse the XSS-hardened MarkdownView (spans escaped,
                   no raw-HTML directive). User turns + quick-prompt labels stay plain text. -->
              <MarkdownView markdown={m.content} />
              {#if m.isStreaming}<span class="cursor">▍</span>{/if}
            {:else}
              {m.quickPromptKey ? (QUICK_PROMPT_LABELS[m.quickPromptKey] ?? m.content) : m.content}
              {#if m.isStreaming}<span class="cursor">▍</span>{/if}
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>

  {#if assistant.errorMessage}
    <p class="error">{assistant.errorMessage}</p>
  {/if}

  <div class="composer">
    <textarea
      bind:value={inputValue}
      onkeydown={handleKeydown}
      placeholder={viCopy.assistant.placeholder}
      rows={2}
      disabled={assistant.isGenerating}
    ></textarea>
    <button type="button" onclick={() => handleSendText()} disabled={assistant.isGenerating || !inputValue.trim()}>
      {viCopy.assistant.send}
    </button>
  </div>
</section>

<style>
  .assistant {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin-top: var(--space-lg);
  }
  .title {
    margin: 0 0 var(--space-xs);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  .quick-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
  .quick-btn {
    padding: 6px 10px;
    border: 1px solid var(--color-border-hairline);
    background: var(--color-bg-surface);
    color: var(--color-text-secondary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 12px;
  }
  .quick-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .transcript {
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
    background: var(--color-bg-surface);
    padding: var(--space-sm);
    min-height: 120px;
    max-height: 320px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .msg {
    display: flex;
    flex-direction: column;
  }
  .msg.user .role { color: var(--color-accent-sienna); }
  .msg.assistant .role { color: var(--color-text-muted); }
  .role {
    font-size: 11px;
    margin-bottom: 2px;
  }
  .content {
    font-size: 13px;
    line-height: 1.45;
    white-space: pre-wrap;
    color: var(--color-text-secondary);
  }
  /* MarkdownView lives in a child component, so its styles are out of this file's scope.
     Re-anchor with `.content :global(...)` to tighten the markdown to the transcript's
     compact scale (panel body is 13px) instead of the larger explanation-screen scale.
     Scoped to `.content` so it only affects assistant turns inside this panel. These
     rules apply to every assistant turn (streaming or settled). */
  .content :global(.markdown) {
    gap: var(--space-xs);
  }
  .content :global(.markdown .paragraph),
  .content :global(.markdown .list-item) {
    font-size: 13px;
    line-height: 1.5;
  }
  .content :global(.markdown .heading.h1) {
    font-size: 15px;
    margin-top: var(--space-xs);
  }
  .content :global(.markdown .heading.h2) {
    font-size: 14px;
    margin-top: 2px;
  }
  .content :global(.markdown .heading.h3) {
    font-size: 13px;
  }
  /* Streaming only: MarkdownView's container is `display: flex; flex-direction: column`,
     a block-level box, so the cursor (a sibling of <MarkdownView />) drops onto its own
     line below the text. While streaming, make the container and its LAST block inline so
     the cursor trails the final line. `gap` is inert on an inline box, so restore
     inter-block spacing with `margin-bottom`; the last block drops it so the cursor sits
     flush. Settled turns keep the flex+gap layout above, so block headings and flex
     list-items (bullets/hanging indents) stay intact. */
  .content.streaming :global(.markdown) {
    display: inline;
  }
  .content.streaming :global(.markdown > *) {
    margin-bottom: var(--space-xs);
  }
  .content.streaming :global(.markdown > :last-child) {
    display: inline;
    margin-bottom: 0;
  }
  .cursor {
    display: inline-block;
    animation: blink 1s step-end infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }
  .hint {
    color: var(--color-text-muted);
    font-size: 12px;
    margin: 0;
  }
  .error {
    color: #c0392b;
    font-size: 12px;
    margin: 0;
  }
  .composer {
    display: flex;
    gap: var(--space-xs);
    align-items: flex-start;
  }
  .composer textarea {
    flex: 1;
    resize: vertical;
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-sm);
    padding: 8px;
    /* 16px: below this, iOS Safari auto-zooms the viewport on focus. Keep >=16px. */
    font-size: 16px;
    background: var(--color-bg-surface);
    color: var(--color-text-secondary);
  }
  .composer button {
    padding: 8px 12px;
    border: 1px solid var(--color-border-hairline);
    background: var(--color-bg-surface);
    color: var(--color-text-secondary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 13px;
  }
  .composer button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
