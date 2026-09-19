<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Sparkles } from 'lucide-svelte';

  interface Props {
    isPending: boolean;
  }

  let { isPending }: Props = $props();

  let secondsElapsed = $state(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  const stages = [
    { threshold: 0, percentage: 25, icon: '🔮', label: 'Khởi tạo thiên can địa chi & an sao bản mệnh...' },
    { threshold: 3, percentage: 55, icon: '☯️', label: 'Khâm Thiên Giám phân tích cát hung & ngũ hành hội tụ...' },
    { threshold: 10, percentage: 85, icon: '📜', label: 'AI khởi thảo sớ luận giải chi tiết & chỉ dẫn vận hạn...' },
    { threshold: 22, percentage: 95, icon: '✨', label: 'Thiên cơ sắp xuất lộ, đang tinh chỉnh kết quả...' },
  ];

  const currentStage = $derived.by(() => {
    let current = stages[0];
    for (const stage of stages) {
      if (secondsElapsed >= stage.threshold) {
        current = stage;
      }
    }
    return current;
  });

  const progressPercentage = $derived(isPending ? currentStage.percentage : 100);

  onMount(() => {
    timer = setInterval(() => {
      secondsElapsed += 1;
    }, 1000);
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });
</script>

<div class="explanation-loader celestial-card-glass">
  <!-- Glowing Celestial Aura -->
  <div class="glow-aura" aria-hidden="true"></div>

  <div class="loader-top">
    <div class="badge-stage">
      <span class="stage-emoji">{currentStage.icon}</span>
      <span class="stage-label">{currentStage.label}</span>
    </div>
    <span class="percentage text-gold">{progressPercentage}%</span>
  </div>

  <div class="progress-track">
    <div
      class="progress-fill"
      style="width: {progressPercentage}%;"
    >
      <div class="shimmer-effect"></div>
    </div>
  </div>

  <div class="loader-bottom">
    <div class="star-particles">
      <span class="sparkle-icon"><Sparkles size={13} /></span>
      <span class="subtext">Thời gian xử lý: {secondsElapsed}s · Thuật toán Khâm Thiên Bảo Giám</span>
    </div>
    <div class="dots-indicator">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  </div>
</div>

<style>
  .explanation-loader {
    position: relative;
    margin-top: var(--space-md);
    padding: 20px 24px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    border: 1px solid rgba(212, 175, 55, 0.35);
    background: linear-gradient(135deg, rgba(24, 18, 48, 0.85) 0%, rgba(14, 10, 30, 0.95) 100%);
    backdrop-filter: blur(16px);
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(212, 175, 55, 0.08);
  }

  .glow-aura {
    position: absolute;
    top: -50%;
    left: 20%;
    width: 60%;
    height: 100%;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  .loader-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  .badge-stage {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14.5px;
    font-weight: 600;
    color: #fef08a;
  }

  .stage-emoji {
    font-size: 16px;
    animation: float 2s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }

  .percentage {
    font-size: 15px;
    font-weight: 700;
    color: #fbbf24;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
  }

  .progress-track {
    width: 100%;
    height: 10px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 9999px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(212, 175, 55, 0.2);
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #d97706, #fbbf24, #fef08a);
    border-radius: 9999px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 16px rgba(245, 158, 11, 0.6);
    position: relative;
    overflow: hidden;
  }

  .shimmer-effect {
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
    animation: shimmer 1.8s infinite;
  }

  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 200%; }
  }

  .loader-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  .star-particles {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sparkle-icon {
    color: #fbbf24;
    animation: spin-slow 4s linear infinite;
  }

  @keyframes spin-slow {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .subtext {
    font-size: 12.5px;
    color: #9ca3af;
    font-style: italic;
  }

  .dots-indicator {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #fbbf24;
    animation: pulse 1.4s infinite ease-in-out both;
  }

  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }

  @keyframes pulse {
    0%, 80%, 100% {
      transform: scale(0.4);
      opacity: 0.3;
    }
    40% {
      transform: scale(1.1);
      opacity: 1;
      box-shadow: 0 0 8px #fbbf24;
    }
  }

  /* Dual Theme: Light Mode */
  :global([data-theme="light"]) .explanation-loader {
    background: linear-gradient(135deg, #ffffff 0%, #fef3c7 100%);
    border-color: rgba(180, 83, 9, 0.3);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  }

  :global([data-theme="light"]) .badge-stage {
    color: #78350f;
  }

  :global([data-theme="light"]) .percentage {
    color: #b45309;
    text-shadow: none;
  }

  :global([data-theme="light"]) .progress-track {
    background: rgba(180, 83, 9, 0.08);
    border-color: rgba(180, 83, 9, 0.2);
  }

  :global([data-theme="light"]) .subtext {
    color: #6b7280;
  }

  :global([data-theme="light"]) .dot {
    background-color: #b45309;
  }
</style>

