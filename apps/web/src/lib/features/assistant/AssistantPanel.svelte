<script lang="ts">
  /**
   * AssistantPanel: Khâm Thiên Giám — ViOS Native Astrological Agent (Sprint 41).
   *
   * - Hội thoại AI multi-turn thời gian thực với streaming SSE.
   * - Nạp sâu context tinh bàn 12 cung, Tứ Hóa, Thân Mệnh & Lưu niên 2026.
   * - Dynamic Smart Astro Prompt Chips + Quick Prompts truyền thống.
   * - Hiển thị số dư XU và minh bạch phí 1 XU / lượt vấn đáp.
   * - Hỗ trợ auto-scroll, sao chép lời luận giải và giao diện Celestial Luxury.
   */
  import { getAuthStore } from '$lib/auth/auth-context';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { createAssistantModel } from './assistant-model.svelte';
  import {
    QUICK_PROMPT_KEYS,
    QUICK_PROMPT_LABELS,
    SMART_ASTRO_PROMPTS,
    type QuickPromptKey,
    type SmartAstroPrompt,
  } from './quick-prompts';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import { getWalletStore, type WalletStore } from '$lib/features/payment/wallet-context';
  import { toast } from '$lib/stores/toast';
  import { resolve } from '$app/paths';

  interface Props {
    chartSnapshotId: string;
    conversationId?: string | null;
    onConversationCreated?: (id: string) => void;
  }

  let { chartSnapshotId, conversationId: initialConversationId = null, onConversationCreated }: Props = $props();

  const auth = getAuthStore();
  const queryClient = useQueryClient();

  // Lấy wallet store để hiển thị số dư XU (phòng thủ an toàn)
  let walletStore: WalletStore | null = $state(null);
  try {
    walletStore = getWalletStore();
  } catch {
    walletStore = null;
  }

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
  let transcriptContainer = $state<HTMLDivElement | null>(null);
  let copiedMessageId = $state<string | null>(null);

  // Auto-scroll transcript khi có tin nhắn mới hoặc đang streaming
  $effect(() => {
    if (transcriptContainer && (assistant.isGenerating || assistant.messages.length > 0)) {
      transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
    }
  });

  async function handleSendText(customText?: string) {
    const text = (customText ?? inputValue).trim();
    if (!text || assistant.isGenerating) return;

    if (!customText) {
      inputValue = '';
    }

    const ok = await assistant.sendText(text);
    if (!ok && !customText) {
      inputValue = text;
    }
  }

  async function handleQuickPrompt(key: QuickPromptKey) {
    if (assistant.isGenerating) return;
    await assistant.sendQuickPrompt(key);
  }

  async function handleSmartPrompt(prompt: SmartAstroPrompt) {
    if (assistant.isGenerating) return;
    await handleSendText(prompt.query);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendText();
    }
  }

  async function copyToClipboard(text: string, msgIdx: number) {
    try {
      await navigator.clipboard.writeText(text);
      copiedMessageId = `msg-${msgIdx}`;
      toast.show('Đã sao chép lời luận giải vào bộ nhớ tạm', 'success');
      setTimeout(() => {
        if (copiedMessageId === `msg-${msgIdx}`) {
          copiedMessageId = null;
        }
      }, 2500);
    } catch {
      toast.show('Không thể sao chép lời giải', 'danger');
    }
  }
</script>

<section class="vios-agent-panel" aria-labelledby="agent-header-title">
  <!-- Agent Header -->
  <header class="agent-header">
    <div class="agent-profile">
      <div class="agent-avatar-wrap">
        <div class="agent-avatar">🔮</div>
        <span class="pulse-status" title="Khâm Thiên Giám Agent đang trực tuyến"></span>
      </div>
      <div class="agent-meta">
        <div class="agent-title-row">
          <h3 id="agent-header-title" class="agent-name">Khâm Thiên Giám AI</h3>
          <span class="agent-badge">Cố Vấn Bản Mệnh</span>
        </div>
        <p class="agent-subtitle">Trợ lý hội thoại Tử Vi đa tầng • Đã nạp toạ độ 12 cung & Lưu niên 2026</p>
      </div>
    </div>

    <!-- Wallet / Quota Bar -->
    <div class="agent-wallet-chip">
      {#if walletStore}
        <a href={resolve('/wallet')} class="wallet-badge" title="Mở ví XU để nạp thêm">
          <span class="coin-icon">💎</span>
          <span class="balance-text">{walletStore.balance ?? 0} XU</span>
        </a>
      {/if}
      <span class="cost-tag">⚡ 1 XU / lượt đàm đạo</span>
    </div>
  </header>

  <!-- Smart Astrological Prompt Chips -->
  <div class="chips-container" role="region" aria-label="Gợi ý câu hỏi tinh bàn chuyên sâu">
    <div class="chips-label">✨ Gợi ý trọng điểm:</div>
    <div class="chips-scroll">
      {#each SMART_ASTRO_PROMPTS as prompt (prompt.id)}
        <button
          type="button"
          class="smart-chip"
          onclick={() => handleSmartPrompt(prompt)}
          disabled={assistant.isGenerating}
          title={prompt.query}
        >
          <span class="chip-icon">{prompt.icon}</span>
          <span class="chip-title">{prompt.title}</span>
        </button>
      {/each}

      {#each QUICK_PROMPT_KEYS as key (key)}
        <button
          type="button"
          class="quick-pill"
          onclick={() => handleQuickPrompt(key)}
          disabled={assistant.isGenerating}
        >
          {QUICK_PROMPT_LABELS[key]}
        </button>
      {/each}
    </div>
  </div>

  <!-- Chat Transcript -->
  <div class="transcript-box" bind:this={transcriptContainer} aria-live="polite">
    {#if assistant.messages.length === 0}
      <!-- Welcome Greeting Card -->
      <div class="welcome-card">
        <div class="welcome-badge">✦ Đàm Đạo Cùng Khâm Thiên Giám ✦</div>
        <h4 class="welcome-title">Kính chào Đương Số, tôi là ViOS Astrological Agent</h4>
        <p class="welcome-text">
          Toàn bộ cấu trúc tinh bàn, tương quan 12 cung, vị trí Tứ Hóa và lưu niên Bính Ngọ 2026 của bạn đã được tôi tiếp nhận.
          Mỗi khúc mắc đều có căn nguyên từ cơ chế sao chiếu và vận hạn. Bạn muốn tôi làm rõ điều gì hôm nay?
        </p>
        <div class="welcome-suggestions">
          <span class="sugg-hint">Chủ đề thường vấn đáp:</span>
          <div class="sugg-tags">
            <span class="sugg-tag">Đại hạn 10 năm</span>
            <span class="sugg-tag">Cung Tài Bạch & Dòng tiền</span>
            <span class="sugg-tag">Hôn nhân & Phu Thê</span>
            <span class="sugg-tag">Hóa giải hung tinh</span>
          </div>
        </div>
      </div>
    {:else}
      {#each assistant.messages as m, idx (idx)}
        <div class={m.role === 'user' ? 'msg-row user-row' : 'msg-row assistant-row'}>
          {#if m.role === 'assistant'}
            <div class="avatar-cell">
              <span class="mini-avatar">🔮</span>
            </div>
          {/if}

          <div class="msg-bubble" class:streaming={m.isStreaming}>
            <div class="bubble-header">
              <span class="sender-name">
                {m.role === 'user' ? 'Đương số' : 'Khâm Thiên Giám AI'}
              </span>
              {#if m.role === 'assistant' && !m.isStreaming && m.content}
                <button
                  type="button"
                  class="copy-btn"
                  onclick={() => copyToClipboard(m.content, idx)}
                  title="Sao chép lời luận giải"
                >
                  {#if copiedMessageId === `msg-${idx}`}
                    ✓ Đã chép
                  {:else}
                    📋 Sao chép
                  {/if}
                </button>
              {/if}
            </div>

            <div class="bubble-content">
              {#if m.role === 'assistant' && !m.quickPromptKey}
                <MarkdownView markdown={m.content} />
                {#if m.isStreaming}
                  <span class="streaming-cursor">▍</span>
                {/if}
              {:else}
                <p class="plain-turn">
                  {m.quickPromptKey ? (QUICK_PROMPT_LABELS[m.quickPromptKey] ?? m.content) : m.content}
                  {#if m.isStreaming}
                    <span class="streaming-cursor">▍</span>
                  {/if}
                </p>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  {#if assistant.errorMessage}
    <div class="error-banner">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{assistant.errorMessage}</span>
    </div>
  {/if}

  <!-- Chat Composer -->
  <div class="composer-wrap">
    <div class="composer-inner">
      <textarea
        bind:value={inputValue}
        onkeydown={handleKeydown}
        placeholder="Hỏi Khâm Thiên Giám về công danh, thời vận 2026, cung vị cần hóa giải... (Enter để gửi)"
        rows={2}
        disabled={assistant.isGenerating}
      ></textarea>
      <button
        type="button"
        class="btn-send-agent"
        onclick={() => handleSendText()}
        disabled={assistant.isGenerating || !inputValue.trim()}
        title="Gửi câu hỏi (1 XU)"
      >
        {#if assistant.isGenerating}
          <span class="spinner-ring"></span>
          <span>Đang giải đoán...</span>
        {:else}
          <span>Gửi</span>
          <span class="send-arrow">➔</span>
        {/if}
      </button>
    </div>
    <div class="composer-footer">
      <span class="cost-notice">⚡ 1 XU / câu trả lời chuyên sâu • Hoàn XU tự động nếu gián đoạn</span>
      {#if walletStore && (walletStore.balance ?? 0) < 1}
        <a href={resolve('/wallet')} class="topup-link">Nạp XU ngay ➜</a>
      {/if}
    </div>
  </div>
</section>

<style>
  .vios-agent-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 16px);
    background: linear-gradient(180deg, rgba(22, 24, 35, 0.85) 0%, rgba(14, 16, 24, 0.95) 100%);
    border: 1px solid rgba(212, 175, 55, 0.25);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    border-radius: var(--radius-lg, 16px);
    padding: var(--space-lg, 20px);
    color: var(--color-text-primary, #f5f6fa);
    backdrop-filter: blur(12px);
  }

  /* Header */
  .agent-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 14px;
  }

  .agent-profile {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .agent-avatar-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .agent-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: radial-gradient(circle, #3a2e1d 0%, #171510 100%);
    border: 1.5px solid #d4af37;
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .pulse-status {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #2ecc71;
    border: 2px solid #161823;
    box-shadow: 0 0 8px #2ecc71;
  }

  .agent-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .agent-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .agent-name {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #f1dfa5;
    letter-spacing: 0.3px;
  }

  .agent-badge {
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 20px;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.35);
    color: #ffd700;
    font-weight: 600;
    text-transform: uppercase;
  }

  .agent-subtitle {
    margin: 0;
    font-size: 12px;
    color: rgba(245, 246, 250, 0.65);
  }

  .agent-wallet-chip {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .wallet-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.35);
    padding: 5px 11px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    color: #ffd700;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .wallet-badge:hover {
    background: rgba(212, 175, 55, 0.25);
    transform: translateY(-1px);
  }

  .cost-tag {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }

  /* Chips */
  .chips-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .chips-label {
    font-size: 12px;
    font-weight: 600;
    color: #d4af37;
  }

  .chips-scroll {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .smart-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 20px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    color: #e5e9f0;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .smart-chip:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.15);
    border-color: #ffd700;
    color: #ffd700;
    transform: translateY(-1px);
  }

  .smart-chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .quick-pill {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    padding: 6px 10px;
    font-size: 12px;
    color: rgba(245, 246, 250, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .quick-pill:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }

  .quick-pill:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Transcript */
  .transcript-box {
    background: rgba(10, 11, 16, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 16px;
    min-height: 220px;
    max-height: 480px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scroll-behavior: smooth;
  }

  /* Welcome Card */
  .welcome-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 24px 16px;
    gap: 10px;
    background: radial-gradient(circle at top, rgba(212, 175, 55, 0.08) 0%, transparent 70%);
    border-radius: 12px;
    border: 1px dashed rgba(212, 175, 55, 0.25);
  }

  .welcome-badge {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    color: #ffd700;
    text-transform: uppercase;
  }

  .welcome-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #f1dfa5;
  }

  .welcome-text {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: rgba(245, 246, 250, 0.8);
    max-width: 580px;
  }

  .welcome-suggestions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
  }

  .sugg-hint {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
  }

  .sugg-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }

  .sugg-tag {
    font-size: 11px;
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 8px;
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.7);
  }

  /* Message Rows */
  .msg-row {
    display: flex;
    gap: 10px;
    width: 100%;
  }

  .user-row {
    justify-content: flex-end;
  }

  .assistant-row {
    justify-content: flex-start;
  }

  .avatar-cell {
    display: flex;
    align-items: flex-start;
    padding-top: 2px;
  }

  .mini-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #252016;
    border: 1px solid #d4af37;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  .msg-bubble {
    max-width: 82%;
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .user-row .msg-bubble {
    background: linear-gradient(135deg, #2b3040 0%, #1e2230 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f1f3f9;
    border-bottom-right-radius: 2px;
  }

  .assistant-row .msg-bubble {
    background: rgba(20, 22, 30, 0.9);
    border: 1px solid rgba(212, 175, 55, 0.2);
    color: #e5e9f0;
    border-bottom-left-radius: 2px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  }

  .bubble-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .sender-name {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
  }

  .assistant-row .sender-name {
    color: #d4af37;
  }

  .copy-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.45);
    font-size: 11px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    transition: color 0.2s ease;
  }

  .copy-btn:hover {
    color: #ffd700;
  }

  .bubble-content {
    font-size: 13.5px;
    line-height: 1.6;
    color: rgba(245, 246, 250, 0.9);
  }

  .plain-turn {
    margin: 0;
    white-space: pre-wrap;
  }

  /* Scoped Markdown inside assistant bubbles */
  .bubble-content :global(.markdown) {
    gap: 8px;
  }

  .bubble-content :global(.markdown .paragraph),
  .bubble-content :global(.markdown .list-item) {
    font-size: 13.5px;
    line-height: 1.6;
    color: rgba(245, 246, 250, 0.92);
  }

  .bubble-content :global(.markdown .heading.h1) {
    font-size: 15px;
    font-weight: 700;
    color: #f1dfa5;
    margin-top: 4px;
  }

  .bubble-content :global(.markdown .heading.h2) {
    font-size: 14px;
    font-weight: 700;
    color: #d4af37;
    margin-top: 4px;
  }

  .bubble-content :global(.markdown .heading.h3) {
    font-size: 13.5px;
    font-weight: 600;
    color: #f5f6fa;
  }

  .streaming-cursor {
    display: inline-block;
    color: #ffd700;
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  /* Error Banner */
  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(231, 76, 60, 0.15);
    border: 1px solid rgba(231, 76, 60, 0.4);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    color: #ff7675;
  }

  /* Composer */
  .composer-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .composer-inner {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  .composer-inner textarea {
    flex: 1;
    background: rgba(14, 16, 22, 0.9);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 16px;
    color: #f5f6fa;
    resize: none;
    line-height: 1.45;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .composer-inner textarea:focus {
    border-color: #ffd700;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);
  }

  .btn-send-agent {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: linear-gradient(135deg, #d4af37 0%, #aa8010 100%);
    color: #0b0c10;
    font-weight: 700;
    font-size: 13px;
    border: none;
    border-radius: 10px;
    padding: 12px 18px;
    height: 46px;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35);
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .btn-send-agent:hover:not(:disabled) {
    background: linear-gradient(135deg, #ffd700 0%, #c49514 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(212, 175, 55, 0.5);
  }

  .btn-send-agent:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  .send-arrow {
    font-size: 12px;
  }

  .spinner-ring {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-top-color: #000;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .composer-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
    padding: 0 4px;
  }

  .topup-link {
    color: #ffd700;
    text-decoration: none;
    font-weight: 600;
  }

  .topup-link:hover {
    text-decoration: underline;
  }

  @media (max-width: 640px) {
    .vios-agent-panel {
      padding: 14px;
    }
    .agent-header {
      flex-direction: column;
      align-items: flex-start;
    }
    .agent-wallet-chip {
      width: 100%;
      justify-content: space-between;
    }
    .msg-bubble {
      max-width: 92%;
    }
  }

  /* Dual-Theme: Light Mode Support */
  :global([data-theme="light"]) .vios-agent-panel {
    background: linear-gradient(180deg, #ffffff 0%, #faf8f5 100%);
    border-color: rgba(180, 83, 9, 0.22);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8);
    color: #1f2937;
  }

  :global([data-theme="light"]) .agent-header {
    border-bottom-color: rgba(180, 83, 9, 0.12);
  }

  :global([data-theme="light"]) .agent-avatar {
    background: radial-gradient(circle, #fef3c7 0%, #fae8b2 100%);
    border-color: #d97706;
    box-shadow: 0 0 12px rgba(217, 119, 6, 0.25);
  }

  :global([data-theme="light"]) .pulse-status {
    border-color: #ffffff;
  }

  :global([data-theme="light"]) .agent-name {
    color: #78350f;
  }

  :global([data-theme="light"]) .agent-badge {
    background: #fef3c7;
    border-color: #d97706;
    color: #92400e;
  }

  :global([data-theme="light"]) .agent-subtitle {
    color: #4b5563;
  }

  :global([data-theme="light"]) .wallet-badge {
    background: #fffbeb;
    border-color: #d97706;
    color: #92400e;
  }

  :global([data-theme="light"]) .cost-tag {
    color: #6b7280;
  }

  :global([data-theme="light"]) .chips-label {
    color: #92400e;
  }

  :global([data-theme="light"]) .smart-chip {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.25);
    color: #374151;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  }

  :global([data-theme="light"]) .smart-chip:hover:not(:disabled) {
    background: #fef3c7;
    border-color: #d97706;
    color: #78350f;
  }

  :global([data-theme="light"]) .quick-pill {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #4b5563;
  }

  :global([data-theme="light"]) .quick-pill:hover:not(:disabled) {
    background: #e5e7eb;
    color: #111827;
  }

  :global([data-theme="light"]) .transcript-box {
    background: #f9fafb;
    border-color: #e5e7eb;
  }

  :global([data-theme="light"]) .welcome-card {
    background: radial-gradient(circle at top, rgba(245, 158, 11, 0.08) 0%, #ffffff 70%);
    border-color: rgba(180, 83, 9, 0.25);
  }

  :global([data-theme="light"]) .welcome-badge {
    color: #b45309;
  }

  :global([data-theme="light"]) .welcome-title {
    color: #78350f;
  }

  :global([data-theme="light"]) .welcome-text {
    color: #374151;
  }

  :global([data-theme="light"]) .sugg-hint {
    color: #6b7280;
  }

  :global([data-theme="light"]) .sugg-tag {
    background: #f3f4f6;
    color: #4b5563;
  }

  :global([data-theme="light"]) .mini-avatar {
    background: #fef3c7;
    border-color: #d97706;
  }

  :global([data-theme="light"]) .user-row .msg-bubble {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #1f2937;
  }

  :global([data-theme="light"]) .assistant-row .msg-bubble {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.2);
    color: #1f2937;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  }

  :global([data-theme="light"]) .user-row .sender-name {
    color: #6b7280;
  }

  :global([data-theme="light"]) .assistant-row .sender-name {
    color: #b45309;
  }

  :global([data-theme="light"]) .copy-btn {
    color: #6b7280;
  }

  :global([data-theme="light"]) .copy-btn:hover {
    color: #b45309;
  }

  :global([data-theme="light"]) .bubble-content {
    color: #1f2937;
  }

  :global([data-theme="light"]) .bubble-content :global(.markdown .paragraph),
  :global([data-theme="light"]) .bubble-content :global(.markdown .list-item) {
    color: #1f2937;
  }

  :global([data-theme="light"]) .composer-inner textarea {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.3);
    color: #111827;
  }

  :global([data-theme="light"]) .composer-inner textarea:focus {
    border-color: #b45309;
    box-shadow: 0 0 10px rgba(180, 83, 9, 0.2);
  }

  :global([data-theme="light"]) .btn-send-agent {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(180, 83, 9, 0.3);
  }

  :global([data-theme="light"]) .btn-send-agent:hover:not(:disabled) {
    background: linear-gradient(135deg, #b45309 0%, #92400e 100%);
  }

  :global([data-theme="light"]) .composer-footer {
    color: #6b7280;
  }

  :global([data-theme="light"]) .topup-link {
    color: #b45309;
  }
</style>
