<script lang="ts">
  // Spinner thuần CSS (thay ActivityIndicator của RN). Chỉ animate transform (rotate)
  // để giữ trên compositor — không animate layout-bound property.
  // A11y: role="status" + nhãn ẩn tiếng Việt để screen reader thông báo trạng thái tải.
  interface Props {
    size?: 'sm' | 'lg';
    tone?: 'gold' | 'dark';
    label?: string;
  }

  let { size = 'sm', tone = 'gold', label = 'Đang tải' }: Props = $props();
</script>

<span class="spinner" class:lg={size === 'lg'} class:dark={tone === 'dark'} role="status">
  <span class="visually-hidden">{label}</span>
</span>

<style>
  .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid color-mix(in srgb, var(--color-accent-gold) 30%, transparent);
    border-top-color: var(--color-accent-gold);
    border-radius: var(--radius-pill);
    animation: spin 0.7s linear infinite;
  }

  .spinner.lg {
    width: 36px;
    height: 36px;
    border-width: 3px;
  }

  .spinner.dark {
    border-color: color-mix(in srgb, #15120a 30%, transparent);
    border-top-color: #15120a;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation-duration: 1.6s;
    }
  }
</style>
