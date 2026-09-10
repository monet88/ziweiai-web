<script lang="ts">
  // Trang Thư Viện Hoàng Triều (Sprint 58 - Royal Gallery & Cloud Sync VIP PRO)
  // Cho phép xem, lọc, và tải các thiệp hoàng triều đã tạo và đồng bộ từ Mobile & Web
  import { onMount } from 'svelte';
  import { AppScaffold, EmptyStateCard, Spinner } from '$lib/components/ui';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { supabase } from '$lib/supabase/supabase-client';

  interface RoyalGalleryItem {
    id: string;
    card_type: 'ziwei' | 'sacredStick' | 'tarot' | 'iching';
    title: string;
    subtitle?: string | null;
    aspect_ratio: 'standard' | 'story9_16';
    custom_seal_name?: string | null;
    image_path?: string | null;
    image_url?: string | null;
    created_at: string;
  }

  const auth = getAuthStore();

  let loading = $state(true);
  let items = $state<RoyalGalleryItem[]>([]);
  let selectedFilter = $state<string>('all');
  let previewItem = $state<RoyalGalleryItem | null>(null);

  const filterOptions = [
    { key: 'all', label: 'Tất Cả', icon: '👑' },
    { key: 'ziwei', label: 'Chiếu Chỉ Tử Vi', icon: '📜' },
    { key: 'sacredStick', label: 'Thẻ Quẻ Thánh', icon: '🎋' },
    { key: 'tarot', label: 'Tarot Cung Đình', icon: '🔮' },
    { key: 'iching', label: 'Lục Hào Chiêm Bốc', icon: '🪙' },
  ];

  async function loadGallery() {
    loading = true;
    try {
      const user = auth.user;
      let cloudItems: RoyalGalleryItem[] = [];

      // 1. Tải từ Supabase nếu đã đăng nhập
      if (user) {
        const { data, error } = await supabase
          .from('royal_gallery_shares')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          cloudItems = data as RoyalGalleryItem[];
        }
      }

      // 2. Tải từ LocalStorage (fallback hoặc các item offline)
      let localItems: RoyalGalleryItem[] = [];
      try {
        const raw = localStorage.getItem('vios_royal_share_gallery_items_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localItems = parsed.map((p: any) => ({
              id: p.id || String(Math.random()),
              card_type: p.type || 'ziwei',
              title: p.title || 'Thiệp Hoàng Triều',
              subtitle: p.subtitle,
              aspect_ratio: p.aspectRatio || 'standard',
              custom_seal_name: p.customSealName,
              image_path: p.imagePath,
              created_at: p.createdAt || new Date().toISOString(),
            }));
          }
        }
      } catch (storageErr) {
        void storageErr;
      }

      // Hợp nhất dữ liệu
      const mergedRecords: Record<string, RoyalGalleryItem> = {};
      for (const item of cloudItems) {
        mergedRecords[item.id] = item;
      }
      for (const item of localItems) {
        if (!mergedRecords[item.id]) {
          mergedRecords[item.id] = item;
        }
      }

      items = Object.values(mergedRecords).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (loadErr) {
      void loadErr;
      items = [];
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadGallery();
  });

  const filteredItems = $derived(
    selectedFilter === 'all'
      ? items
      : items.filter((i) => i.card_type === selectedFilter)
  );

  function getCardTypeLabel(type: string): string {
    switch (type) {
      case 'ziwei':
        return 'Chiếu Chỉ Tử Vi';
      case 'sacredStick':
        return 'Thẻ Quẻ Thánh';
      case 'tarot':
        return 'Tarot Cung Đình';
      case 'iching':
        return 'Lục Hào Chiêm Bốc';
      default:
        return 'Thiệp Hoàng Triều';
    }
  }

  function formatDate(isoStr: string): string {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  }
</script>

<svelte:head>
  <title>Thư Viện Hoàng Triều - Tử Vi Toàn Tập ViOS</title>
</svelte:head>

<AppScaffold
  eyebrow="THƯ VIỆN HOÀNG TRIỀU · CLOUD SYNC"
  title="Thư Viện Thiệp Cung Đình"
  subtitle="Lưu trữ và xem lại các ấn phẩm Chiếu Chỉ Tử Vi, Thẻ Quẻ Thánh, Tarot Cung Đình và Lục Hào Chiêm Bốc đồng bộ đa nền tảng"
>
  <div class="gallery-container">
    <!-- VIP Cloud Sync Badge Bar -->
    <div class="sync-status-bar">
      <div class="sync-info">
        <span class="sync-icon">☁️</span>
        <div>
          <strong class="sync-title">Đồng Bộ Đám Mây Hoàng Triều</strong>
          <p class="sync-subtitle">
            {auth.user
              ? 'Tài khoản đã liên kết: Dữ liệu thiệp tự động đồng bộ hai chiều với thiết bị Mobile.'
              : 'Đăng nhập tài khoản để lưu trữ vĩnh viễn và đồng bộ thiệp lên mọi thiết bị.'}
          </p>
        </div>
      </div>
      <button class="refresh-btn" onclick={loadGallery} title="Làm mới thư viện">
        🔄 Làm Mới
      </button>
    </div>

    <!-- Category Filter Bar -->
    <div class="filter-bar">
      {#each filterOptions as opt (opt.key)}
        <button
          class="filter-chip"
          class:active={selectedFilter === opt.key}
          onclick={() => (selectedFilter = opt.key)}
        >
          <span class="chip-icon">{opt.icon}</span>
          <span>{opt.label}</span>
          {#if opt.key === 'all'}
            <span class="chip-count">({items.length})</span>
          {:else}
            <span class="chip-count">
              ({items.filter((i) => i.card_type === opt.key).length})
            </span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Gallery Body -->
    {#if loading}
      <div class="loading-state">
        <Spinner />
        <p>Đang tải thư viện hoàng triều...</p>
      </div>
    {:else if filteredItems.length === 0}
      <EmptyStateCard
        title="Chưa Có Thiệp Hoàng Triều Nào"
        description="Khi bạn xuất thiệp chia sẻ Tử Vi, bốc Thẻ Xăm, rút bài Tarot hoặc gieo quẻ Kinh Dịch, các thiệp sẽ được lưu trữ tự động tại đây."
      />
    {:else}
      <div class="gallery-grid">
        {#each filteredItems as item (item.id)}
          <div class="gallery-card">
            <!-- Header Tags -->
            <div class="card-header">
              <span class="category-badge {item.card_type}">
                {getCardTypeLabel(item.card_type)}
              </span>
              <span class="ratio-badge">
                {item.aspect_ratio === 'story9_16' ? 'Story 9:16' : 'Chuẩn 3:4'}
              </span>
            </div>

            <!-- Card Thumbnail / Visual Box -->
            <div class="card-visual">
              <div class="card-emblem">
                {#if item.card_type === 'ziwei'}📜
                {:else if item.card_type === 'sacredStick'}🎋
                {:else if item.card_type === 'tarot'}🔮
                {:else}🪙{/if}
              </div>
              <div class="card-title-box">
                <h4 class="card-title">{item.title}</h4>
                {#if item.subtitle}
                  <p class="card-subtitle">{item.subtitle}</p>
                {/if}
              </div>
            </div>

            <!-- Seal Badge if exists -->
            {#if item.custom_seal_name}
              <div class="seal-badge">
                <span class="seal-mark">ẤN</span>
                <span>{item.custom_seal_name}</span>
              </div>
            {/if}

            <!-- Card Footer -->
            <div class="card-footer">
              <span class="card-time">{formatDate(item.created_at)}</span>
              <button
                class="view-btn"
                onclick={() => (previewItem = item)}
              >
                Chi Tiết
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Detail Preview Modal -->
  {#if previewItem}
    <div class="modal-wrapper">
      <div
        class="modal-backdrop"
        role="presentation"
        onclick={() => (previewItem = null)}
      ></div>

      <div
        class="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={previewItem.title}
        tabindex="-1"
      >
        <div class="modal-header">
          <span class="modal-category">{getCardTypeLabel(previewItem.card_type)}</span>
          <button class="close-btn" onclick={() => (previewItem = null)}>✕</button>
        </div>

        <div class="modal-body">
          <h3 class="modal-title">{previewItem.title}</h3>
          {#if previewItem.subtitle}
            <p class="modal-sub">{previewItem.subtitle}</p>
          {/if}

          <div class="modal-meta">
            <p><strong>Định dạng:</strong> {previewItem.aspect_ratio === 'story9_16' ? 'Story Hoàng Triều (9:16)' : 'Chuẩn Văn Bản (3:4)'}</p>
            {#if previewItem.custom_seal_name}
              <p><strong>Ấn danh xưng:</strong> {previewItem.custom_seal_name}</p>
            {/if}
            <p><strong>Thời gian tạo:</strong> {formatDate(previewItem.created_at)}</p>
          </div>

          <div class="modal-seal-display">
            <div class="royal-square-seal">
              <span>KHÂM THIÊN</span>
              <span>NGỰ BÚT</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="action-btn" onclick={() => (previewItem = null)}>
            Đóng Lại
          </button>
        </div>
      </div>
    </div>
  {/if}
</AppScaffold>

<style>
  .gallery-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  .sync-status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(26, 17, 48, 0.65);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    backdrop-filter: blur(8px);
  }

  .sync-info {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .sync-icon {
    font-size: 1.5rem;
  }

  .sync-title {
    color: #ffd700;
    font-size: 0.95rem;
    letter-spacing: 0.5px;
  }

  .sync-subtitle {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.82rem;
    margin: 0.2rem 0 0 0;
  }

  .refresh-btn {
    background: rgba(212, 175, 55, 0.15);
    color: #ffd700;
    border: 1px solid rgba(212, 175, 55, 0.4);
    padding: 0.45rem 0.9rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .refresh-btn:hover {
    background: rgba(212, 175, 55, 0.3);
  }

  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .filter-chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(20, 13, 38, 0.7);
    border: 1px solid rgba(212, 175, 55, 0.2);
    color: rgba(255, 255, 255, 0.75);
    padding: 0.5rem 0.9rem;
    border-radius: 20px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .filter-chip:hover {
    border-color: rgba(212, 175, 55, 0.6);
    color: #fff;
  }

  .filter-chip.active {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(184, 134, 11, 0.15));
    border-color: #ffd700;
    color: #ffd700;
    font-weight: 600;
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
  }

  .chip-count {
    font-size: 0.75rem;
    opacity: 0.7;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem;
    color: #ffd700;
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
  }

  .gallery-card {
    background: linear-gradient(145deg, rgba(24, 16, 44, 0.85), rgba(16, 10, 30, 0.95));
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 14px;
    padding: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .gallery-card:hover {
    transform: translateY(-3px);
    border-color: rgba(212, 175, 55, 0.5);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .category-badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    background: rgba(212, 175, 55, 0.15);
    color: #ffd700;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .ratio-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.6);
  }

  .card-visual {
    display: flex;
    gap: 0.85rem;
    align-items: center;
    background: rgba(0, 0, 0, 0.25);
    padding: 0.75rem;
    border-radius: 10px;
  }

  .card-emblem {
    font-size: 2rem;
  }

  .card-title-box {
    overflow: hidden;
  }

  .card-title {
    margin: 0;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-subtitle {
    margin: 0.2rem 0 0 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.78rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .seal-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.72rem;
    color: #ff6b6b;
    background: rgba(255, 82, 82, 0.12);
    border: 1px solid rgba(255, 82, 82, 0.3);
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    width: fit-content;
  }

  .seal-mark {
    background: #ff5252;
    color: #fff;
    font-size: 0.6rem;
    font-weight: 900;
    padding: 0.1rem 0.25rem;
    border-radius: 3px;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .card-time {
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.45);
  }

  .view-btn {
    background: rgba(212, 175, 55, 0.15);
    color: #ffd700;
    border: 1px solid rgba(212, 175, 55, 0.35);
    padding: 0.3rem 0.7rem;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .view-btn:hover {
    background: #ffd700;
    color: #140d26;
  }

  /* Modal Preview */
  .modal-wrapper {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    padding: 1.5rem;
  }

  .modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(6px);
  }

  .modal-card {
    position: relative;
    z-index: 1;
    background: #18112e;
    border: 1.5px solid #ffd700;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 24px rgba(212, 175, 55, 0.3);
    border-radius: 16px;
    max-width: 480px;
    width: 100%;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-category {
    color: #ffd700;
    font-size: 0.85rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .close-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 1.2rem;
    cursor: pointer;
  }

  .modal-title {
    margin: 0;
    color: #fff;
    font-size: 1.3rem;
  }

  .modal-sub {
    margin: 0.25rem 0 0 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }

  .modal-meta {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 0.85rem;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .modal-meta p {
    margin: 0;
  }

  .modal-seal-display {
    display: flex;
    justify-content: center;
    padding: 1rem 0;
  }

  .royal-square-seal {
    border: 3px solid #d32f2f;
    padding: 0.6rem 0.85rem;
    color: #d32f2f;
    font-weight: 900;
    font-size: 0.85rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    letter-spacing: 2px;
    background: rgba(211, 47, 47, 0.06);
    border-radius: 4px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
  }

  .action-btn {
    background: #ffd700;
    color: #140d26;
    border: none;
    font-weight: bold;
    padding: 0.6rem 1.4rem;
    border-radius: 8px;
    cursor: pointer;
  }
</style>
