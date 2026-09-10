<script lang="ts">
  import { Loader2, X, Award, ShieldCheck } from 'lucide-svelte';
  import type { DossierExportProgress } from './dossier-pdf-exporter';

  interface Props {
    progress: DossierExportProgress;
    onCancel: () => void;
  }

  let { progress, onCancel }: Props = $props();
</script>

<div
  class="export-overlay no-print"
  role="dialog"
  aria-modal="true"
  aria-labelledby="export-progress-title"
>
  <div class="export-card">
    <div class="card-ornament top-left">❖</div>
    <div class="card-ornament top-right">❖</div>
    <div class="card-ornament bottom-left">❖</div>
    <div class="card-ornament bottom-right">❖</div>

    <!-- Seal Header Icon -->
    <div class="export-icon-box">
      <div class="icon-halo"></div>
      <div class="spinner-ring">
        <Loader2 size={36} class="animate-spin text-gold" />
      </div>
      <div class="center-award">
        <Award size={20} class="text-gold" />
      </div>
    </div>

    <!-- Titles -->
    <div class="export-header-text">
      <span class="dynasty-badge">✦ KHÂM THIÊN GIÁM · ĐẶC BẢN HOÀNG TRIỀU ✦</span>
      <h3 id="export-progress-title" class="export-title">ĐANG KẾT XUẤT TỆP PDF HOÀNG GIA</h3>
      <p class="export-desc">
        Đang xử lý vector & raster 19 trang chuẩn in A4 bảo mật cao...
      </p>
    </div>

    <!-- Progress Track -->
    <div class="progress-section">
      <div class="progress-labels">
        <span class="page-count">
          {#if progress.current > 0}
            Trang {progress.current} / {progress.total}
          {:else}
            Khởi tạo...
          {/if}
        </span>
        <span class="percent-val">{progress.percent}%</span>
      </div>

      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width: {progress.percent}%">
          <div class="shimmer"></div>
        </div>
      </div>

      <div class="stage-info">
        <span class="stage-text">{progress.stage}</span>
      </div>
    </div>

    <!-- Security Guarantee Badge -->
    <div class="security-guarantee">
      <ShieldCheck size={14} class="text-gold" />
      <span>Tự động tích hợp Watermark bảo mật & Mã số bảo chứng đương số</span>
    </div>

    <!-- Cancel Button -->
    <div class="export-actions">
      <button type="button" class="btn-cancel-export" onclick={onCancel}>
        <X size={15} />
        <span>Hủy bỏ xuất tệp</span>
      </button>
    </div>
  </div>
</div>

<style>
  .export-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: rgba(10, 8, 6, 0.88);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: fadeIn 0.25s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .export-card {
    position: relative;
    width: 100%;
    max-width: 480px;
    background: radial-gradient(circle at 50% 0%, #2a2218 0%, #17130e 100%);
    border: 1px solid #d4af37;
    border-radius: 8px;
    padding: 32px 24px 24px;
    box-shadow:
      0 0 40px rgba(212, 175, 55, 0.2),
      0 20px 40px rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .card-ornament {
    position: absolute;
    color: #d4af37;
    font-size: 12px;
    opacity: 0.6;
    line-height: 1;
  }

  .card-ornament.top-left {
    top: 8px;
    left: 8px;
  }
  .card-ornament.top-right {
    top: 8px;
    right: 8px;
  }
  .card-ornament.bottom-left {
    bottom: 8px;
    left: 8px;
  }
  .card-ornament.bottom-right {
    bottom: 8px;
    right: 8px;
  }

  .export-icon-box {
    position: relative;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  .icon-halo {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212, 175, 55, 0.25) 0%, transparent 70%);
  }

  :global(.text-gold) {
    color: #d4af37 !important;
  }

  .spinner-ring {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .center-award {
    position: relative;
    z-index: 2;
  }

  .export-header-text {
    margin-bottom: 24px;
  }

  .dynasty-badge {
    display: inline-block;
    font-size: 10px;
    letter-spacing: 2px;
    color: #d4af37;
    margin-bottom: 6px;
    font-weight: 600;
  }

  .export-title {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #f5eedc;
    margin: 0 0 6px 0;
  }

  .export-desc {
    font-size: 12px;
    color: #a89f91;
    margin: 0;
  }

  .progress-section {
    width: 100%;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 18px;
  }

  .progress-labels {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .page-count {
    color: #f5eedc;
  }

  .percent-val {
    color: #d4af37;
    font-size: 15px;
    font-weight: 800;
  }

  .progress-bar-track {
    width: 100%;
    height: 10px;
    background: rgba(40, 32, 22, 0.9);
    border-radius: 5px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(212, 175, 55, 0.2);
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #aa821c 0%, #d4af37 50%, #f59e0b 100%);
    border-radius: 4px;
    transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .shimmer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.4) 50%,
      transparent 100%
    );
    animation: shimmerMove 1.5s infinite;
  }

  @keyframes shimmerMove {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(100%);
    }
  }

  .stage-info {
    margin-top: 10px;
    font-size: 12px;
    color: #d1c7b7;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .security-guarantee {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 11px;
    color: #a89f91;
    margin-bottom: 20px;
  }

  .export-actions {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .btn-cancel-export {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 1px solid rgba(212, 175, 55, 0.4);
    color: #d1c7b7;
    padding: 8px 18px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-cancel-export:hover {
    background: rgba(212, 175, 55, 0.1);
    border-color: #d4af37;
    color: #f5eedc;
  }
</style>
