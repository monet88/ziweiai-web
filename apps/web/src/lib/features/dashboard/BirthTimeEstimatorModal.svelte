<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { Clock, X, Sparkles, Check } from 'lucide-svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (hour: string, minute: string) => void;
  }

  let { isOpen, onClose, onSelect }: Props = $props();

  interface DoubleHourOption {
    branch: string;
    solarRange: string;
    hour: string;
    minute: string;
    label: string;
    clue: string;
    icon: string;
  }

  const CANH_GIO_OPTIONS: DoubleHourOption[] = [
    {
      branch: 'Tý',
      solarRange: '23:00 – 00:59',
      hour: '0',
      minute: '0',
      label: 'Giờ Tý (Nửa đêm)',
      clue: 'Nửa đêm khuya khoắt, mọi nhà đã tắt đèn chìm vào giấc ngủ say.',
      icon: '🌙',
    },
    {
      branch: 'Sửu',
      solarRange: '01:00 – 02:59',
      hour: '2',
      minute: '0',
      label: 'Giờ Sửu (Đêm khuya)',
      clue: 'Đêm sâu tĩnh mịch, tiếng gà gáy canh đầu tiên, sương giăng.',
      icon: '🌌',
    },
    {
      branch: 'Dần',
      solarRange: '03:00 – 04:59',
      hour: '4',
      minute: '0',
      label: 'Giờ Dần (Rạng đông)',
      clue: 'Tảng sáng, chân trời phía đông vừa hửng sáng, gà gáy rộ.',
      icon: '🌅',
    },
    {
      branch: 'Mão',
      solarRange: '05:00 – 06:59',
      hour: '6',
      minute: '0',
      label: 'Giờ Mão (Bình minh)',
      clue: 'Mặt trời ló rạng, chim hót ríu rít, mọi người thức dậy bắt đầu ngày mới.',
      icon: '☀️',
    },
    {
      branch: 'Thìn',
      solarRange: '07:00 – 08:59',
      hour: '8',
      minute: '0',
      label: 'Giờ Thìn (Buổi sáng)',
      clue: 'Ăn điểm tâm sáng, trẻ em đi học, người lớn bắt đầu giờ làm việc.',
      icon: '☕',
    },
    {
      branch: 'Tỵ',
      solarRange: '09:00 – 10:59',
      hour: '10',
      minute: '0',
      label: 'Giờ Tỵ (Gần trưa)',
      clue: 'Ánh nắng lên cao chói chang, năng suất làm việc hăng say nhất.',
      icon: '🌾',
    },
    {
      branch: 'Ngọ',
      solarRange: '11:00 – 12:59',
      hour: '12',
      minute: '0',
      label: 'Giờ Ngọ (Đứng bóng)',
      clue: 'Chính ngọ, mặt trời đứng bóng, cả nhà quây quần ăn bữa cơm trưa.',
      icon: '🍲',
    },
    {
      branch: 'Mùi',
      solarRange: '13:00 – 14:59',
      hour: '14',
      minute: '0',
      label: 'Giờ Mùi (Đầu chiều)',
      clue: 'Mặt trời xế bóng nhẹ, vừa xong giấc ngủ trưa, bắt đầu ca chiều.',
      icon: '🌿',
    },
    {
      branch: 'Thân',
      solarRange: '15:00 – 16:59',
      hour: '16',
      minute: '0',
      label: 'Giờ Thân (Xế chiều)',
      clue: 'Nắng chiều ngả vàng dịu mát, chuẩn bị tan tầm, gà rục rịch về chuồng.',
      icon: '🌇',
    },
    {
      branch: 'Dậu',
      solarRange: '17:00 – 18:59',
      hour: '18',
      minute: '0',
      label: 'Giờ Dậu (Chập tối)',
      clue: 'Hoàng hôn buông xuống, phố phường lên đèn, mọi người về nhà nấu cơm tối.',
      icon: '🏮',
    },
    {
      branch: 'Tuất',
      solarRange: '19:00 – 20:59',
      hour: '20',
      minute: '0',
      label: 'Giờ Tuất (Buổi tối)',
      clue: 'Bữa cơm tối sum họp xong xuôi, gia đình quây quần trò chuyện, xem tivi.',
      icon: '📺',
    },
    {
      branch: 'Hợi',
      solarRange: '21:00 – 22:59',
      hour: '22',
      minute: '0',
      label: 'Giờ Hợi (Đêm tối)',
      clue: 'Đêm tối tĩnh lặng, chuẩn bị kết thúc ngày làm việc và lên giường nghỉ ngơi.',
      icon: '🕯️',
    },
  ];

  function handleSelect(item: DoubleHourOption) {
    onSelect(item.hour, item.minute);
    onClose();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  $effect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div
    class="modal-backdrop"
    role="presentation"
    onclick={onClose}
    transition:fade={{ duration: 200 }}
  ></div>

  <div
    class="modal-dialog surface-glass"
    role="dialog"
    aria-modal="true"
    aria-labelledby="estimator-title"
    transition:scale={{ duration: 250, start: 0.95 }}
  >
    <div class="modal-header">
      <div class="header-content">
        <div class="header-icon-wrap">
          <Clock class="icon-clock" />
        </div>
        <div>
          <h3 class="modal-title" id="estimator-title">Ước Lượng Canh Giờ Sinh Dân Gian</h3>
          <p class="modal-subtitle">
            Nếu cha mẹ chỉ nhớ mang máng buổi sinh, hãy chọn khoảng thời gian sinh hoạt tương ứng dưới đây:
          </p>
        </div>
      </div>
      <button
        type="button"
        class="btn-close"
        onclick={onClose}
        aria-label="Đóng cửa sổ tra cứu"
      >
        <X size={18} />
      </button>
    </div>

    <div class="modal-body">
      <div class="canh-gio-grid">
        {#each CANH_GIO_OPTIONS as item (item.branch)}
          <button
            type="button"
            class="canh-gio-card"
            onclick={() => handleSelect(item)}
          >
            <div class="card-top">
              <span class="canh-gio-icon">{item.icon}</span>
              <div class="canh-gio-badge">
                <span>{item.branch}</span>
                <span class="range-pill">{item.solarRange}</span>
              </div>
            </div>
            <div class="canh-gio-name">{item.label}</div>
            <div class="canh-gio-clue">{item.clue}</div>
            <div class="card-footer">
              <span class="action-hint">
                <Check size={13} />
                <span>Chọn canh giờ này</span>
              </span>
            </div>
          </button>
        {/each}
      </div>
    </div>

    <div class="modal-footer">
      <div class="footer-tip">
        <Sparkles size={14} class="sparkle-icon" />
        <span>Hệ thống sẽ điền thời khắc trung chính của canh giờ vào form để dựng lá số tham chiếu chuẩn xác nhất.</span>
      </div>
      <button type="button" class="btn-cancel" onclick={onClose}>
        Đóng lại
      </button>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1050;
    background: rgba(10, 10, 15, 0.75);
    backdrop-filter: blur(8px);
  }

  .modal-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1051;
    width: 92vw;
    max-width: 820px;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg-surface, #1e1b18);
    border: 1px solid rgba(212, 168, 83, 0.35);
    border-radius: var(--radius-xl, 16px);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(212, 168, 83, 0.15);
    overflow: hidden;
  }

  .modal-header {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 18px 24px;
    border-bottom: 1px solid var(--color-border-hairline, rgba(255, 255, 255, 0.08));
    background: rgba(212, 168, 83, 0.05);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .header-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: rgba(212, 168, 83, 0.15);
    border: 1px solid rgba(212, 168, 83, 0.3);
    color: var(--color-accent-gold, #d4a853);
    flex-shrink: 0;
  }

  .modal-title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-text-primary, #f5f0eb);
    letter-spacing: -0.01em;
  }

  .modal-subtitle {
    margin: 4px 0 0;
    font-size: 0.85rem;
    color: var(--color-text-secondary, #a89f91);
    line-height: 1.4;
  }

  .btn-close {
    background: transparent;
    border: none;
    color: var(--color-text-tertiary, #7a7367);
    padding: 6px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-close:hover {
    color: var(--color-text-primary, #fff);
    background: rgba(255, 255, 255, 0.1);
  }

  .modal-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 20px 24px;
  }

  .canh-gio-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 12px;
  }

  .canh-gio-card {
    text-align: left;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--color-border-hairline, rgba(255, 255, 255, 0.08));
    border-radius: 12px;
    padding: 14px;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .canh-gio-card:hover {
    background: rgba(212, 168, 83, 0.08);
    border-color: rgba(212, 168, 83, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .canh-gio-icon {
    font-size: 1.2rem;
  }

  .canh-gio-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
    color: var(--color-accent-gold, #d4a853);
    font-size: 0.9rem;
  }

  .range-pill {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: 12px;
    background: rgba(212, 168, 83, 0.15);
    color: var(--color-text-secondary, #dcd4c8);
  }

  .canh-gio-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text-primary, #f5f0eb);
    margin-bottom: 4px;
  }

  .canh-gio-clue {
    font-size: 0.8rem;
    color: var(--color-text-tertiary, #9e9587);
    line-height: 1.4;
    margin-bottom: 12px;
    flex-grow: 1;
  }

  .card-footer {
    padding-top: 8px;
    border-top: 1px dashed rgba(255, 255, 255, 0.06);
  }

  .action-hint {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-accent-gold, #d4a853);
    opacity: 0.85;
  }

  .canh-gio-card:hover .action-hint {
    opacity: 1;
    text-decoration: underline;
  }

  .modal-footer {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 24px;
    border-top: 1px solid var(--color-border-hairline, rgba(255, 255, 255, 0.08));
    background: rgba(0, 0, 0, 0.2);
    gap: 16px;
  }

  .footer-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: var(--color-text-secondary, #a89f91);
  }

  :global(.sparkle-icon) {
    color: var(--color-accent-gold, #d4a853);
    flex-shrink: 0;
  }

  .btn-cancel {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--color-border-hairline, rgba(255, 255, 255, 0.12));
    color: var(--color-text-primary, #f5f0eb);
    font-size: 0.85rem;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .btn-cancel:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  @media (max-width: 640px) {
    .canh-gio-grid {
      grid-template-columns: 1fr;
    }
    .modal-footer {
      flex-direction: column;
      align-items: stretch;
    }
    .btn-cancel {
      width: 100%;
      text-align: center;
    }
  }

  /* Tối ưu riêng biệt cho màn hình chiều dọc thấp (như viewport 560px zoom 125%) */
  @media (max-height: 650px) {
    .modal-dialog {
      max-height: 94vh;
    }
    .modal-header {
      padding: 10px 18px;
    }
    .header-icon-wrap {
      width: 32px;
      height: 32px;
    }
    .modal-title {
      font-size: 1rem;
    }
    .modal-subtitle {
      display: none;
    }
    .modal-body {
      padding: 10px 16px;
    }
    .canh-gio-card {
      padding: 10px 12px;
    }
    .canh-gio-clue {
      margin-bottom: 6px;
      font-size: 0.76rem;
    }
    .modal-footer {
      padding: 8px 18px;
    }
    .footer-tip {
      font-size: 0.74rem;
    }
  }

  /* Đồng bộ Theme Light cho Modal Ước Lượng */
  :global([data-theme="light"]) .modal-dialog {
    background: #ffffff !important;
    border-color: rgba(212, 175, 55, 0.5) !important;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2), 0 0 35px rgba(212, 175, 55, 0.2) !important;
  }

  :global([data-theme="light"]) .modal-header {
    background: linear-gradient(180deg, #fffbeb 0%, #ffffff 100%) !important;
    border-bottom-color: rgba(212, 175, 55, 0.25) !important;
  }

  :global([data-theme="light"]) .modal-title {
    color: #1c1917 !important;
  }

  :global([data-theme="light"]) .modal-subtitle {
    color: #57534e !important;
  }

  :global([data-theme="light"]) .header-icon-wrap {
    background: #fef3c7 !important;
    border-color: #f59e0b !important;
    color: #b45309 !important;
  }

  :global([data-theme="light"]) .canh-gio-card {
    background: #fafaf9 !important;
    border-color: rgba(212, 175, 55, 0.3) !important;
  }

  :global([data-theme="light"]) .canh-gio-card:hover {
    background: #fffbeb !important;
    border-color: #d97706 !important;
    box-shadow: 0 4px 14px rgba(217, 119, 6, 0.15) !important;
  }

  :global([data-theme="light"]) .canh-gio-name {
    color: #1c1917 !important;
  }

  :global([data-theme="light"]) .canh-gio-clue {
    color: #57534e !important;
  }

  :global([data-theme="light"]) .range-pill {
    background: #fef3c7 !important;
    color: #92400e !important;
  }

  :global([data-theme="light"]) .canh-gio-badge {
    color: #b45309 !important;
  }

  :global([data-theme="light"]) .action-hint {
    color: #b45309 !important;
  }

  :global([data-theme="light"]) .modal-footer {
    background: #fafaf9 !important;
    border-top-color: rgba(212, 175, 55, 0.25) !important;
  }

  :global([data-theme="light"]) .footer-tip {
    color: #78716c !important;
  }

  :global([data-theme="light"]) .btn-cancel {
    background: #f5f5f4 !important;
    border-color: #d6d3d1 !important;
    color: #1c1917 !important;
  }

  :global([data-theme="light"]) .btn-cancel:hover {
    background: #e7e5e4 !important;
  }

  :global([data-theme="light"]) .btn-close {
    color: #78716c !important;
  }

  :global([data-theme="light"]) .btn-close:hover {
    color: #1c1917 !important;
    background: #f5f5f4 !important;
  }
</style>
