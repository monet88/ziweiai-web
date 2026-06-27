<script lang="ts">
  // US-031 (backlog #25): lớp phủ đường nét bàn tay phủ LÊN ảnh preview Xem Tay. Thuần trình bày,
  // CHỈ phía client, KHÔNG gọi backend. MediaPipe nạp lazy qua palm-landmark-detector; nếu nạp/nhận
  // diện thất bại thì overlay tự ẩn đi, luồng upload + luận giải vẫn nguyên vẹn (lớp phủ chỉ phụ trợ).
  import { detectHandLandmarks } from './palm-landmark-detector';
  import {
    buildOverlaySegments,
    computeContainLayout,
    projectLandmarks,
    type NormalizedLandmark,
    type OverlaySegment,
  } from './palm-overlay-geometry';

  interface Props {
    /** Ảnh preview đã render (object-fit: contain). Overlay khớp đúng vùng letterbox của ảnh này. */
    image: HTMLImageElement | null;
    /** Nguồn ảnh hiện tại. Cùng một <img> bị gán src mới (đổi tệp) thì phải nhận diện lại — vì
     * tham chiếu phần tử KHÔNG đổi, $effect cần phụ thuộc src để re-run, tránh vẽ landmark ảnh cũ. */
    src: string | null;
    /** Nhãn mô tả lớp phủ cho công nghệ hỗ trợ tiếp cận (tiếng Việt). */
    label: string;
  }

  let { image, src, label }: Props = $props();

  let landmarks = $state<NormalizedLandmark[] | null>(null);
  let containerWidth = $state(0);
  let containerHeight = $state(0);
  let naturalWidth = $state(0);
  let naturalHeight = $state(0);

  // Chạy nhận diện khi đổi ảnh. Bỏ qua mọi lỗi (CDN/wasm/WebGL) một cách êm: chỉ không vẽ overlay.
  // Cờ cancelled chặn cập nhật state khi ảnh đã đổi giữa chừng (tránh vẽ landmark của ảnh cũ).
  $effect(() => {
    const el = image;
    // Đọc src để $effect phụ thuộc nó: cùng một phần tử <img> nhưng src đổi vẫn kích hoạt nhận diện lại.
    const currentSrc = src;
    landmarks = null;
    naturalWidth = 0;
    naturalHeight = 0;
    if (!el || !currentSrc) return;

    let cancelled = false;

    const run = async (): Promise<void> => {
      try {
        const detected = await detectHandLandmarks(el);
        if (cancelled) return;
        naturalWidth = el.naturalWidth;
        naturalHeight = el.naturalHeight;
        landmarks = detected;
      } catch {
        if (!cancelled) landmarks = null;
      }
    };

    if (el.complete && el.naturalWidth > 0 && el.currentSrc.length > 0) {
      void run();
    } else {
      el.addEventListener('load', run, { once: true });
    }

    return () => {
      cancelled = true;
      el.removeEventListener('load', run);
    };
  });

  // Theo dõi kích thước hiển thị thực của ảnh để quy đổi landmark đúng vùng letterbox khi layout đổi.
  $effect(() => {
    const el = image;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth = entry.contentRect.width;
        containerHeight = entry.contentRect.height;
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  });

  const segments = $derived.by<OverlaySegment[]>(() => {
    if (!landmarks || landmarks.length === 0) return [];
    const layout = computeContainLayout(
      { width: naturalWidth, height: naturalHeight },
      { width: containerWidth, height: containerHeight },
    );
    if (layout.scale <= 0) return [];
    return buildOverlaySegments(projectLandmarks(landmarks, layout));
  });

  const hasOverlay = $derived(segments.length > 0 && containerWidth > 0 && containerHeight > 0);
</script>

{#if hasOverlay}
  <svg
    class="overlay"
    viewBox={`0 0 ${containerWidth} ${containerHeight}`}
    preserveAspectRatio="none"
    role="img"
    aria-label={label}
  >
    {#each segments as segment, index (index)}
      <line
        x1={segment.x1}
        y1={segment.y1}
        x2={segment.x2}
        y2={segment.y2}
        vector-effect="non-scaling-stroke"
      />
    {/each}
  </svg>
{/if}

<style>
  .overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0;
    animation: overlay-fade-in var(--duration-slow, 360ms) ease forwards;
  }

  .overlay line {
    stroke: var(--color-accent-primary);
    stroke-width: 2;
    stroke-linecap: round;
    opacity: 0.85;
  }

  @keyframes overlay-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .overlay {
      animation: none;
      opacity: 1;
    }
  }
</style>
