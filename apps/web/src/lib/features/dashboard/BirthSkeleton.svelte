<script lang="ts">
  // BirthSkeleton: Hiển thị giao diện "xương" (Skeleton) mô phỏng 12 cung Tử Vi
  // trong thời gian chờ API phân tích/dựng lá số.
</script>

<div class="skeleton-wrapper">
  <div class="skeleton-header">
    <div class="pulse-line w-3/4"></div>
    <div class="pulse-line w-1/2"></div>
  </div>
  
  <div class="chart-grid">
    <!-- Row 1: Tỵ, Ngọ, Mùi, Thân -->
    <div class="palace-box"></div>
    <div class="palace-box"></div>
    <div class="palace-box"></div>
    <div class="palace-box"></div>
    
    <!-- Row 2: Thìn, Dậu (và Center) -->
    <div class="palace-box"></div>
    <div class="center-box">
       <div class="spinner-ring"></div>
       <div class="loading-text">Đang thiết lập tinh bàn...</div>
    </div>
    <div class="palace-box"></div>
    
    <!-- Row 3: Mão, Tuất -->
    <div class="palace-box"></div>
    <div class="palace-box"></div>

    <!-- Row 4: Dần, Sửu, Tý, Hợi -->
    <div class="palace-box"></div>
    <div class="palace-box"></div>
    <div class="palace-box"></div>
    <div class="palace-box"></div>
  </div>
</div>

<style>
  .skeleton-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    padding: var(--space-md);
    animation: fadeIn 0.4s ease-out forwards;
    width: 100%;
  }
  
  .skeleton-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    align-items: center;
    margin-bottom: var(--space-sm);
  }

  .pulse-line {
    height: 14px;
    background: var(--overlay-border-strong);
    border-radius: var(--radius-pill);
    animation: pulse 1.5s infinite ease-in-out;
  }
  
  .w-3\/4 { width: 65%; }
  .w-1\/2 { width: 40%; }

  .chart-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, minmax(70px, 1fr));
    gap: 6px;
    background: var(--overlay-ink-wash);
    padding: 6px;
    border-radius: var(--radius-xl);
    aspect-ratio: 1; /* Để grid hình vuông */
  }

  .palace-box {
    background: var(--color-bg-surface);
    border-radius: var(--radius-md);
    animation: pulse 1.8s infinite ease-in-out;
    opacity: 0.7;
    border: 1px solid var(--overlay-hairline);
  }

  /* Tạo hiệu ứng dải sóng cho các cung */
  .palace-box:nth-child(even) {
    animation-delay: 0.2s;
  }
  .palace-box:nth-child(3n) {
    animation-delay: 0.4s;
  }
  .palace-box:nth-child(5n) {
    animation-delay: 0.6s;
  }

  .center-box {
    grid-column: 2 / 4;
    grid-row: 2 / 4;
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-lg);
  }

  .spinner-ring {
    width: 48px;
    height: 48px;
    border: 4px solid var(--overlay-border-strong);
    border-top-color: var(--color-accent-ai);
    border-radius: 50%;
    animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  }

  .loading-text {
    color: var(--color-accent-ai);
    font-size: var(--text-body-sm);
    font-weight: 700;
    letter-spacing: 0.03em;
    text-align: center;
    animation: pulseText 2s infinite ease-in-out;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.8; }
  }

  @keyframes pulseText {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
</style>
