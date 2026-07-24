<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    isPending: boolean;
  }

  let { isPending }: Props = $props();

  let secondsElapsed = $state(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  const stages = [
    { threshold: 0, percentage: 25, label: '🔮 Đang an sao & nạp dữ liệu lá số...' },
    { threshold: 3, percentage: 55, label: '☯️ Đang phân tích cát hung & tương quan ngũ hành...' },
    { threshold: 10, percentage: 85, label: '📜 AI đang lập bài luận chi tiết & tổng hợp lời khuyên...' },
    { threshold: 22, percentage: 95, label: '✨ Sắp hoàn tất, đang tinh chỉnh kết quả...' },
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

<div class="explanation-loader surface-glass">
  <div class="loader-header">
    <span class="stage-label">{currentStage.label}</span>
    <span class="percentage">{progressPercentage}%</span>
  </div>

  <div class="progress-track">
    <div
      class="progress-fill"
      style="width: {progressPercentage}%;"
    ></div>
  </div>

  <div class="dots-indicator">
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  </div>
</div>

<style>
  .explanation-loader {
    margin-top: var(--space-md);
    padding: var(--space-lg);
    border-radius: var(--radius-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    border: 1px solid var(--overlay-border);
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(12px);
  }

  .loader-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .stage-label {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--color-text-primary);
  }

  .percentage {
    color: var(--color-gold-400, #f59e0b);
    font-variant-numeric: tabular-nums;
  }

  .progress-track {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #d97706, #fbbf24, #f59e0b);
    border-radius: 4px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
  }

  .dots-indicator {
    display: flex;
    gap: 4px;
    justify-content: center;
    margin-top: var(--space-xs);
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--color-gold-400, #f59e0b);
    animation: pulse 1.4s infinite ease-in-out both;
  }

  .dot:nth-child(1) {
    animation-delay: -0.32s;
  }

  .dot:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes pulse {
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.3;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
