<script lang="ts">
  // TarotCardBack: lưng bài Tarot vẽ bằng SVG gốc (sao, hành tinh có vành, mắt, pha trăng) theo
  // tinh thần thiên văn của bộ Rider-Waite NHƯNG không sao chép art bản quyền. Toàn bộ nét dùng
  // currentColor + var(--*) nên đổi theme tự động. Trang trí thuần (aria-hidden); nhãn/nút do
  // component cha lo (a11y). Aspect 100/171 khớp .card-image để lưới đồng đều.
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="card-back">
  <svg
    class="art"
    viewBox="0 0 200 342"
    role="presentation"
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
  >
    <!-- viền trong -->
    <rect x="10" y="10" width="180" height="322" rx="14" class="frame" />
    <rect x="18" y="18" width="164" height="306" rx="10" class="frame-soft" />

    <!-- băng pha trăng trên -->
    <g class="moons" transform="translate(100 40)">
      <circle cx="-30" cy="0" r="4" class="dot" />
      <path d="M -16 -6 A 6 6 0 1 0 -16 6 A 8 8 0 1 1 -16 -6 Z" class="line" />
      <circle cx="0" cy="0" r="6" class="ring" />
      <path d="M 16 -6 A 6 6 0 1 1 16 6 A 8 8 0 1 0 16 -6 Z" class="line" />
      <circle cx="30" cy="0" r="4" class="dot" />
    </g>

    <!-- hành tinh có vành + sao -->
    <g transform="translate(135 92)">
      <circle cx="0" cy="0" r="13" class="line" />
      <ellipse cx="0" cy="0" rx="22" ry="7" transform="rotate(-22)" class="line" />
    </g>
    <g class="star" transform="translate(72 96)">
      <path d="M 0 -16 L 4 -4 L 16 0 L 4 4 L 0 16 L -4 4 L -16 0 L -4 -4 Z" class="fill" />
    </g>
    <circle cx="58" cy="62" r="2" class="dot" />
    <circle cx="150" cy="128" r="2.4" class="dot" />
    <circle cx="46" cy="128" r="1.6" class="dot" />

    <!-- con mắt huyền học giữa -->
    <g transform="translate(100 200)">
      <path d="M -34 0 Q 0 -26 34 0 Q 0 26 -34 0 Z" class="line" />
      <circle cx="0" cy="0" r="11" class="ring" />
      <circle cx="0" cy="0" r="4.5" class="fill" />
      <path d="M -50 0 L -42 0 M 50 0 L 42 0" class="line" />
      <path d="M 0 -40 L 0 -33 M 0 40 L 0 33" class="line" />
    </g>

    <!-- chùm sao dưới -->
    <g class="star small" transform="translate(70 268)">
      <path d="M 0 -9 L 2.4 -2.4 L 9 0 L 2.4 2.4 L 0 9 L -2.4 2.4 L -9 0 L -2.4 -2.4 Z" class="fill" />
    </g>
    <circle cx="100" cy="276" r="1.8" class="dot" />
    <g class="star small" transform="translate(130 268)">
      <path d="M 0 -7 L 2 -2 L 7 0 L 2 2 L 0 7 L -2 2 L -7 0 L -2 -2 Z" class="fill" />
    </g>

    <!-- băng pha trăng dưới -->
    <g class="moons" transform="translate(100 304)">
      <circle cx="-30" cy="0" r="4" class="dot" />
      <path d="M -16 -6 A 6 6 0 1 0 -16 6 A 8 8 0 1 1 -16 -6 Z" class="line" />
      <circle cx="0" cy="0" r="6" class="ring" />
      <path d="M 16 -6 A 6 6 0 1 1 16 6 A 8 8 0 1 0 16 -6 Z" class="line" />
      <circle cx="30" cy="0" r="4" class="dot" />
    </g>
  </svg>

  {#if children}
    <div class="overlay">{@render children()}</div>
  {/if}
</div>

<style>
  .card-back {
    position: relative;
    width: 100%;
    aspect-ratio: 100 / 171;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background:
      radial-gradient(
        120% 80% at 50% 0%,
        color-mix(in srgb, var(--color-accent-ai) 28%, transparent),
        transparent 60%
      ),
      linear-gradient(
        180deg,
        var(--color-tarot-back-top),
        var(--color-tarot-back-mid) 60%,
        var(--color-tarot-back-bottom)
      );
    border: 1px solid var(--color-border-gold);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 12%, transparent) inset;
  }

  .art {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    color: var(--color-accent-gold);
  }

  .frame {
    fill: none;
    stroke: var(--color-accent-gold);
    stroke-width: 1.4;
    opacity: 0.55;
  }

  .frame-soft {
    fill: none;
    stroke: var(--color-accent-gold-soft);
    stroke-width: 0.8;
    opacity: 0.3;
  }

  .line {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    stroke-linecap: round;
    opacity: 0.85;
  }

  .ring {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.2;
    opacity: 0.7;
  }

  .fill {
    fill: var(--color-accent-gold-soft);
    opacity: 0.92;
  }

  .dot {
    fill: var(--color-accent-gold-soft);
    opacity: 0.65;
  }

  .star.small {
    opacity: 0.8;
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    text-align: center;
    padding: var(--space-md);
  }
</style>
