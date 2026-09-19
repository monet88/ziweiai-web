<script lang="ts">
  import { audioAdvisor } from './audio-advisor.svelte';
  import { Play, Pause, Square, Bell, X, Sparkles } from 'lucide-svelte';

  interface Props {
    embedded?: boolean;
    onClose?: () => void;
  }

  let { embedded = false, onClose }: Props = $props();

  const rates = [0.8, 1.0, 1.2];

  function handleClose() {
    audioAdvisor.stop();
    if (onClose) onClose();
  }
</script>

{#if audioAdvisor.isPlaying}
  <aside
    class="audio-advisor-player"
    class:embedded
    role="region"
    aria-label="Trình phát giọng đọc Luận giải Hoàng Cung"
  >
    <div class="player-glow"></div>
    <div class="player-content">
      <!-- Info & Waveform -->
      <div class="player-main">
        <div class="title-row">
          <div class="sound-wave" class:animating={audioAdvisor.isPlaying && !audioAdvisor.isPaused}>
            <span class="bar bar-1"></span>
            <span class="bar bar-2"></span>
            <span class="bar bar-3"></span>
            <span class="bar bar-4"></span>
            <span class="bar bar-5"></span>
          </div>
          <span class="title-text">
            <Sparkles size={13} class="icon-sparkle" />
            {audioAdvisor.title}
          </span>
          <span class="progress-badge">{audioAdvisor.progressPercent}%</span>
        </div>

        {#if audioAdvisor.currentSentence}
          <p class="sentence-text" title={audioAdvisor.currentSentence}>
            "{audioAdvisor.currentSentence}"
          </p>
        {/if}

        <!-- Progress Track -->
        <div class="progress-track" role="progressbar" aria-valuenow={audioAdvisor.progressPercent} aria-valuemin="0" aria-valuemax="100">
          <div class="progress-fill" style="width: {audioAdvisor.progressPercent}%"></div>
        </div>
      </div>

      <!-- Controls -->
      <div class="player-actions">
        <!-- Zen Sound Toggle -->
        <button
          type="button"
          class="control-btn"
          class:active={audioAdvisor.zenSoundEnabled}
          onclick={() => audioAdvisor.toggleZenSound()}
          title={audioAdvisor.zenSoundEnabled ? 'Chuông bát nhã 432Hz đang bật' : 'Bật chuông bát nhã 432Hz'}
          aria-label="Bật tắt chuông thiền định"
        >
          <Bell size={14} />
          <span class="btn-subtext">432Hz</span>
        </button>

        <!-- Rate Selector -->
        <div class="rate-group" role="group" aria-label="Tốc độ đọc">
          {#each rates as r (r)}
            <button
              type="button"
              class="rate-btn"
              class:selected={audioAdvisor.rate === r}
              onclick={() => audioAdvisor.setRate(r)}
            >
              {r}x
            </button>
          {/each}
        </div>

        <!-- Play / Pause -->
        <button
          type="button"
          class="primary-control-btn"
          onclick={() => audioAdvisor.togglePlayPause()}
          aria-label={audioAdvisor.isPaused ? 'Tiếp tục đọc' : 'Tạm dừng'}
          title={audioAdvisor.isPaused ? 'Tiếp tục đọc' : 'Tạm dừng'}
        >
          {#if audioAdvisor.isPaused}
            <Play size={16} />
          {:else}
            <Pause size={16} />
          {/if}
        </button>

        <!-- Stop -->
        <button
          type="button"
          class="control-btn stop-btn"
          onclick={() => audioAdvisor.stop()}
          aria-label="Dừng phát"
          title="Dừng phát"
        >
          <Square size={14} />
        </button>

        <!-- Close -->
        {#if !embedded}
          <button
            type="button"
            class="control-btn close-btn"
            onclick={handleClose}
            aria-label="Đóng thanh phát âm thanh"
            title="Đóng thanh phát"
          >
            <X size={15} />
          </button>
        {/if}
      </div>
    </div>
  </aside>
{/if}

<style>
  .audio-advisor-player {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999;
    width: calc(100vw - 48px);
    max-width: 480px;
    background: rgba(18, 14, 33, 0.88);
    border: 1px solid rgba(212, 175, 55, 0.4);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 175, 55, 0.2);
    border-radius: 16px;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    overflow: hidden;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .audio-advisor-player.embedded {
    position: static;
    width: 100%;
    max-width: none;
    margin-top: 12px;
    margin-bottom: 12px;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .player-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #ffd700, #f59e0b, transparent);
  }

  .player-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 16px;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .title-text {
    font-size: 13.5px;
    font-weight: 700;
    color: #fef08a;
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.audio-advisor-player .icon-sparkle) {
    color: #fbbf24;
  }

  .progress-badge {
    font-size: 11px;
    font-weight: 600;
    color: #ffd700;
    background: rgba(212, 175, 55, 0.15);
    padding: 2px 7px;
    border-radius: 10px;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  /* Sound Wave Bars */
  .sound-wave {
    display: flex;
    align-items: flex-end;
    gap: 2.5px;
    height: 16px;
  }

  .bar {
    width: 3px;
    height: 4px;
    background: #fbbf24;
    border-radius: 2px;
    transition: height 0.2s ease;
  }

  .sound-wave.animating .bar-1 { animation: wave 0.8s ease-in-out infinite alternate; }
  .sound-wave.animating .bar-2 { animation: wave 1.1s ease-in-out infinite alternate 0.2s; }
  .sound-wave.animating .bar-3 { animation: wave 0.9s ease-in-out infinite alternate 0.4s; }
  .sound-wave.animating .bar-4 { animation: wave 1.2s ease-in-out infinite alternate 0.1s; }
  .sound-wave.animating .bar-5 { animation: wave 0.7s ease-in-out infinite alternate 0.3s; }

  @keyframes wave {
    0% { height: 4px; }
    100% { height: 16px; }
  }

  .sentence-text {
    margin: 4px 0 6px 0;
    font-size: 12px;
    color: #e5e7eb;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-style: italic;
  }

  .progress-track {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #d4af37, #ffd700);
    transition: width 0.25s ease;
  }

  /* Actions row */
  .player-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 2px;
  }

  .control-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 32px;
    padding: 0 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #d1d5db;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-btn:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: rgba(212, 175, 55, 0.4);
    color: #fef08a;
  }

  .control-btn.active {
    background: rgba(212, 175, 55, 0.25);
    border-color: #ffd700;
    color: #ffd700;
  }

  .btn-subtext {
    font-size: 10px;
    font-weight: 600;
  }

  .rate-group {
    display: flex;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }

  .rate-btn {
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .rate-btn.selected {
    background: #d4af37;
    color: #0d0f18;
  }

  .primary-control-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffd700 0%, #d4af37 100%);
    border: none;
    color: #0d0f18;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(212, 175, 55, 0.4);
    transition: all 0.2s ease;
  }

  .primary-control-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 16px rgba(255, 215, 0, 0.6);
  }

  .stop-btn:hover {
    color: #f87171;
    border-color: rgba(239, 68, 68, 0.4);
  }

  .close-btn {
    width: 32px;
    padding: 0;
  }

  @media (max-width: 500px) {
    .audio-advisor-player {
      bottom: 12px;
      right: 12px;
      width: calc(100vw - 24px);
    }
  }

  /* Dual-Theme: Light Mode */
  :global([data-theme="light"]) .audio-advisor-player {
    background: rgba(255, 255, 255, 0.94);
    border-color: rgba(180, 83, 9, 0.25);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }

  :global([data-theme="light"]) .title-text {
    color: #78350f;
  }

  :global([data-theme="light"]) .sentence-text {
    color: #374151;
  }

  :global([data-theme="light"]) .control-btn {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #4b5563;
  }

  :global([data-theme="light"]) .control-btn:hover {
    background: #fef3c7;
    border-color: #d97706;
    color: #92400e;
  }

  :global([data-theme="light"]) .rate-group {
    background: #f3f4f6;
    border-color: #e5e7eb;
  }

  :global([data-theme="light"]) .rate-btn {
    color: #6b7280;
  }
</style>
