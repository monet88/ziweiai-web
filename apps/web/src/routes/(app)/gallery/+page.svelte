<script lang="ts">
  // Trang Thư Viện Hoàng Triều (Sprint 60 - Virtual Grid, Lazy Loading & Performance Optimization)
  // Kết nối qua API client, hỗ trợ Signed URL hiển thị ảnh thật, Zod validation
  import { onMount } from 'svelte';
  import { AppScaffold, EmptyStateCard, Spinner } from '$lib/components/ui';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { fetchGalleryShares } from '$lib/api-client/gallery';
  import type { RoyalGalleryShareRecord } from '@ziweiai/contracts';

  const auth = getAuthStore();

  let loading = $state(true);
  let items = $state<RoyalGalleryShareRecord[]>([]);
  let selectedFilter = $state<string>('all');
  let searchQuery = $state<string>('');
  let sortOrder = $state<'newest' | 'oldest'>('newest');
  let previewItem = $state<RoyalGalleryShareRecord | null>(null);

  // Virtual Lazy Chunking (Render theo lô 12 thiệp để giữ DOM siêu nhẹ)
  const BATCH_SIZE = 12;
  let visibleCount = $state<number>(BATCH_SIZE);
  let loadedImages = $state<Record<string, boolean>>({});
  let sentinelRef = $state<HTMLDivElement | null>(null);

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
      let cloudItems: RoyalGalleryShareRecord[] = [];

      // 1. Tải từ API Backend nếu người dùng đã đăng nhập (hỗ trợ phân trang limit 100)
      const token = auth.getAccessToken();
      if (token) {
        try {
          const res = await fetchGalleryShares(token, 100, 0);
          cloudItems = res.items || [];
        } catch (apiErr) {
          void apiErr;
        }
      }

      // 2. Tải từ LocalStorage (dành cho client offline hoặc fallback)
      let localItems: RoyalGalleryShareRecord[] = [];
      try {
        const raw = localStorage.getItem('vios_royal_share_gallery_items_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localItems = parsed.map((p: any) => ({
              id: p.id || String(Math.random()),
              ownerUserId: auth.user?.id || '00000000-0000-0000-0000-000000000000',
              cardType: p.cardType || p.type || 'ziwei',
              title: p.title || 'Thiệp Hoàng Triều',
              subtitle: p.subtitle ?? null,
              aspectRatio: p.aspectRatio || 'standard',
              customSealName: p.customSealName ?? null,
              storagePath: p.storagePath ?? null,
              imagePath: p.imagePath ?? null,
              imageUrl: p.imageUrl ?? null,
              payload: p.payload || {},
              createdAt: p.createdAt || new Date().toISOString(),
            }));
          }
        }
      } catch (storageErr) {
        void storageErr;
      }

      // 3. Hợp nhất dữ liệu (Cloud ưu tiên nếu có Signed URL)
      const mergedRecords: Record<string, RoyalGalleryShareRecord> = {};
      for (const item of cloudItems) {
        mergedRecords[item.id] = item;
      }
      for (const item of localItems) {
        if (!mergedRecords[item.id]) {
          mergedRecords[item.id] = item;
        }
      }

      items = Object.values(mergedRecords);
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

  // Lọc và Sắp xếp
  const filteredItems = $derived.by(() => {
    let list = items;
    if (selectedFilter !== 'all') {
      list = list.filter((i) => i.cardType === selectedFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.subtitle && i.subtitle.toLowerCase().includes(q)) ||
          (i.customSealName && i.customSealName.toLowerCase().includes(q)),
      );
    }
    return [...list].sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortOrder === 'newest' ? diff : -diff;
    });
  });

  // Danh sách hiển thị theo Virtual Batch Chunking
  const visibleItems = $derived(filteredItems.slice(0, visibleCount));
  const hasMoreItems = $derived(visibleCount < filteredItems.length);

  // Khi thay đổi bộ lọc, reset về batch đầu tiên
  $effect(() => {
    void selectedFilter;
    void searchQuery;
    void sortOrder;
    visibleCount = BATCH_SIZE;
  });

  // Tự động lazy load khi người dùng cuộn tới sentinel
  $effect(() => {
    if (!sentinelRef) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreItems) {
          visibleCount = Math.min(visibleCount + BATCH_SIZE, filteredItems.length);
        }
      },
      { rootMargin: '240px' },
    );
    observer.observe(sentinelRef);
    return () => observer.disconnect();
  });

  function loadMore() {
    visibleCount = Math.min(visibleCount + BATCH_SIZE, filteredItems.length);
  }

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

  function formatDate(isoString: string): string {
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('vi-VN')} • ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoString;
    }
  }
</script>

<svelte:head>
  <title>Thư Viện Hoàng Triều • ViOS Tử Vi Toàn Tập</title>
</svelte:head>

<AppScaffold
  eyebrow="KHÂM THIÊN GIÁM NGỰ BÚT"
  title="Thư Viện Hoàng Triều"
  subtitle="Kho lưu trữ toàn bộ thiệp xuất bản cung đình, thẻ quẻ xăm linh ứng, bài Tarot mạ vàng và quẻ dịch cát hung."
  tone="mystical"
>
  <div class="gallery-container">

    <!-- VIP PRO Cloud Sync Banner -->
    <div class="sync-banner">
      <div class="sync-banner-info">
        <span class="sync-icon">☁️</span>
        <div>
          <h2 class="sync-title">Đồng Bộ Đám Mây Đa Thiết Bị (VIP PRO)</h2>
          <p class="sync-desc">
            {#if auth.user}
              Tài khoản của bạn đã được kết nối với Máy Chủ Khâm Thiên Giám. Thiệp tạo trên ứng dụng di động sẽ tự động đồng bộ về đây.
            {:else}
              Đăng nhập tài khoản để đồng bộ toàn bộ thiệp hoàng triều giữa điện thoại và máy tính.
            {/if}
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
              ({items.filter((i) => i.cardType === opt.key).length})
            </span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Search & Performance Toolbar (Sprint 60) -->
    <div class="gallery-toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Tìm thiệp theo tên, quẻ số, chú thích..."
          class="search-input"
        />
        {#if searchQuery}
          <button class="clear-search-btn" onclick={() => (searchQuery = '')} title="Xóa tìm kiếm">✕</button>
        {/if}
      </div>

      <div class="toolbar-actions">
        <div class="sort-selector">
          <span class="sort-label">Thứ tự:</span>
          <button
            class="sort-toggle-btn"
            onclick={() => (sortOrder = sortOrder === 'newest' ? 'oldest' : 'newest')}
          >
            {sortOrder === 'newest' ? '⏳ Mới Nhất' : '⌛ Cũ Nhất'}
          </button>
        </div>

        <div class="items-counter">
          <span>Hiển thị <strong>{visibleItems.length}</strong> / {filteredItems.length} thiệp</span>
        </div>
      </div>
    </div>

    <!-- Gallery Body -->
    {#if loading}
      <div class="loading-state">
        <Spinner />
        <p>Đang tải thư viện hoàng triều...</p>
      </div>
    {:else if filteredItems.length === 0}
      <EmptyStateCard
        title={searchQuery ? "Không Tìm Thấy Thiệp Nào" : "Chưa Có Thiệp Hoàng Triều Nào"}
        description={searchQuery ? `Không có thiệp nào khớp với từ khóa "${searchQuery}". Vui lòng thử lại.` : "Khi bạn xuất thiệp chia sẻ Tử Vi, bốc Thẻ Xăm, rút bài Tarot hoặc gieo quẻ Kinh Dịch, các thiệp sẽ được lưu trữ tự động tại đây."}
      />
    {:else}
      <div class="gallery-grid">
        {#each visibleItems as item (item.id)}
          <div class="gallery-card">
            <!-- Header Tags -->
            <div class="card-header">
              <span class="category-badge {item.cardType}">
                {getCardTypeLabel(item.cardType)}
              </span>
              <span class="ratio-badge">
                {item.aspectRatio === 'story9_16' ? 'Story 9:16' : 'Chuẩn 3:4'}
              </span>
            </div>

            <!-- Card Thumbnail / Visual Box với Shimmer Skeleton Loading chống CLS -->
            <div class="card-visual">
              {#if item.imageUrl}
                <div class="card-thumb-container">
                  {#if !loadedImages[item.id]}
                    <div class="thumb-shimmer"></div>
                  {/if}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    class="card-preview-image"
                    class:is-loaded={loadedImages[item.id]}
                    loading="lazy"
                    onload={() => (loadedImages[item.id] = true)}
                  />
                </div>
              {:else}
                <div class="card-emblem">
                  {#if item.cardType === 'ziwei'}📜
                  {:else if item.cardType === 'sacredStick'}🎋
                  {:else if item.cardType === 'tarot'}🔮
                  {:else}🪙{/if}
                </div>
              {/if}
              <div class="card-title-box">
                <h4 class="card-title">{item.title}</h4>
                {#if item.subtitle}
                  <p class="card-subtitle">{item.subtitle}</p>
                {/if}
              </div>
            </div>

            <!-- Seal Badge if exists -->
            {#if item.customSealName}
              <div class="seal-badge">
                <span class="seal-mark">ẤN</span>
                <span>{item.customSealName}</span>
              </div>
            {/if}

            <!-- Card Footer -->
            <div class="card-footer">
              <span class="card-time">{formatDate(item.createdAt)}</span>
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

      <!-- Virtual Infinite Scroll Sentinel & Load More Fallback (Sprint 60) -->
      {#if hasMoreItems}
        <div bind:this={sentinelRef} class="sentinel-container">
          <button class="load-more-btn" onclick={loadMore}>
            ✨ Tải Thêm Thiệp Hoàng Triều ({filteredItems.length - visibleCount} thiệp nữa)
          </button>
        </div>
      {/if}
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
          <span class="modal-category">{getCardTypeLabel(previewItem.cardType)}</span>
          <button class="close-btn" onclick={() => (previewItem = null)}>✕</button>
        </div>

        <div class="modal-body">
          {#if previewItem.imageUrl}
            <div class="modal-image-container">
              <img
                src={previewItem.imageUrl}
                alt={previewItem.title}
                class="modal-real-img"
              />
            </div>
          {/if}

          <h3 class="modal-title">{previewItem.title}</h3>
          {#if previewItem.subtitle}
            <p class="modal-sub">{previewItem.subtitle}</p>
          {/if}

          <div class="modal-meta">
            <p><strong>Định dạng:</strong> {previewItem.aspectRatio === 'story9_16' ? 'Story Hoàng Triều (9:16)' : 'Chuẩn Văn Bản (3:4)'}</p>
            {#if previewItem.customSealName}
              <p><strong>Ấn danh xưng:</strong> {previewItem.customSealName}</p>
            {/if}
            <p><strong>Thời gian tạo:</strong> {formatDate(previewItem.createdAt)}</p>
          </div>

          <div class="modal-seal-display">
            <div class="royal-square-seal">
              <span>KHÂM THIÊN</span>
              <span>NGỰ BÚT</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          {#if previewItem.imageUrl}
            <a
              href={previewItem.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="download-btn"
            >
              📥 Tải Ảnh Gốc
            </a>
          {/if}
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
    max-width: 1080px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  /* Sync Banner */
  .sync-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, rgba(30, 20, 50, 0.85) 0%, rgba(20, 15, 35, 0.95) 100%);
    border: 1px solid rgba(212, 175, 55, 0.35);
    border-radius: 14px;
    padding: 1rem 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }

  .sync-banner-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .sync-icon {
    font-size: 1.8rem;
  }

  .sync-title {
    margin: 0 0 0.25rem 0;
    color: #ffd700;
    font-size: 1rem;
    font-weight: 700;
  }

  .sync-desc {
    margin: 0;
    color: rgba(255, 255, 255, 0.65);
    font-size: 0.85rem;
    max-width: 600px;
  }

  .refresh-btn {
    background: rgba(212, 175, 55, 0.15);
    color: #ffd700;
    border: 1px solid rgba(212, 175, 55, 0.4);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .refresh-btn:hover {
    background: rgba(212, 175, 55, 0.3);
    border-color: #ffd700;
  }

  /* Filter Bar */
  .filter-bar {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .filter-chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.9rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .filter-chip:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .filter-chip.active {
    background: rgba(212, 175, 55, 0.2);
    border-color: #ffd700;
    color: #ffd700;
    font-weight: 600;
  }

  .chip-count {
    opacity: 0.6;
    font-size: 0.75rem;
  }

  /* Gallery Toolbar (Sprint 60) */
  .gallery-toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.85rem;
    background: rgba(20, 13, 38, 0.6);
    border: 1px solid rgba(212, 175, 55, 0.18);
    border-radius: 10px;
    backdrop-filter: blur(8px);
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 220px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 0.35rem 0.6rem;
  }

  .search-icon {
    font-size: 0.85rem;
    opacity: 0.7;
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 0.85rem;
    outline: none;
  }

  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .clear-search-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    font-size: 0.75rem;
    padding: 0 0.2rem;
  }

  .clear-search-btn:hover {
    color: #fff;
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .sort-selector {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .sort-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .sort-toggle-btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(212, 175, 55, 0.25);
    color: #ffd700;
    border-radius: 4px;
    padding: 0.25rem 0.6rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sort-toggle-btn:hover {
    background: rgba(212, 175, 55, 0.2);
  }

  .items-counter {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .items-counter strong {
    color: #ffd700;
  }

  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 4rem 0;
    color: rgba(255, 255, 255, 0.6);
  }

  /* Gallery Grid */
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.25rem;
  }

  .gallery-card {
    background: #151124;
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .gallery-card:hover {
    transform: translateY(-2px);
    border-color: #ffd700;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .category-badge {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    background: rgba(212, 175, 55, 0.15);
    color: #ffd700;
  }

  .category-badge.ziwei {
    color: #ffd700;
    background: rgba(255, 215, 0, 0.15);
  }

  .category-badge.sacredStick {
    color: #4ade80;
    background: rgba(74, 222, 128, 0.15);
  }

  .category-badge.tarot {
    color: #c084fc;
    background: rgba(192, 132, 252, 0.15);
  }

  .category-badge.iching {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.15);
  }

  .ratio-badge {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.05);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
  }

  .card-visual {
    background: #0f0a1c;
    border: 1px dashed rgba(212, 175, 55, 0.2);
    border-radius: 8px;
    padding: 1rem 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.75rem;
    min-height: 140px;
    justify-content: center;
    overflow: hidden;
  }

  .card-thumb-container {
    position: relative;
    width: 100%;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    overflow: hidden;
  }

  .thumb-shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.04) 0%, rgba(255, 215, 0, 0.14) 50%, rgba(255, 215, 0, 0.04) 100%);
    background-size: 200% 100%;
    animation: shimmerAnim 1.8s infinite;
    border-radius: 6px;
  }

  @keyframes shimmerAnim {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .card-preview-image {
    max-width: 100%;
    max-height: 120px;
    object-fit: cover;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity 0.35s ease;
  }

  .card-preview-image.is-loaded {
    opacity: 1;
  }

  /* Sentinel Container & Load More Button */
  .sentinel-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem 0 1rem;
  }

  .load-more-btn {
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.5);
    color: #ffd700;
    font-weight: 600;
    padding: 0.65rem 1.6rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;
  }

  .load-more-btn:hover {
    background: #ffd700;
    color: #140d26;
    box-shadow: 0 4px 18px rgba(255, 215, 0, 0.35);
  }

  .card-emblem {
    font-size: 2.2rem;
  }

  .card-title-box {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .card-title {
    margin: 0;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 700;
  }

  .card-subtitle {
    margin: 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
  }

  .seal-badge {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(185, 28, 28, 0.2);
    border: 1px solid rgba(220, 38, 38, 0.4);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    color: #f87171;
  }

  .seal-mark {
    font-weight: bold;
    background: #dc2626;
    color: #fff;
    padding: 0.1rem 0.25rem;
    border-radius: 2px;
    font-size: 0.6rem;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 0.5rem;
  }

  .card-time {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.7rem;
  }

  .view-btn {
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #ffd700;
    border-radius: 4px;
    padding: 0.25rem 0.6rem;
    font-size: 0.75rem;
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
    max-height: 90vh;
    overflow-y: auto;
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

  .modal-image-container {
    width: 100%;
    display: flex;
    justify-content: center;
    background: #0d091a;
    border-radius: 8px;
    overflow: hidden;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .modal-real-img {
    max-width: 100%;
    max-height: 280px;
    object-fit: contain;
    border-radius: 6px;
  }

  .modal-title {
    margin: 0;
    color: #fff;
    font-size: 1.3rem;
  }

  .modal-sub {
    margin: 0.25rem 0 0;
    color: #ffd700;
    font-size: 0.9rem;
  }

  .modal-meta {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.75);
    margin: 0.75rem 0;
  }

  .modal-meta p {
    margin: 0;
  }

  .modal-meta strong {
    color: #ffd700;
  }

  .modal-seal-display {
    display: flex;
    justify-content: center;
    padding: 0.5rem 0;
  }

  .royal-square-seal {
    width: 76px;
    height: 76px;
    border: 3px solid #b91c1c;
    background: #7f1d1d;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #fef08a;
    font-size: 0.7rem;
    font-weight: 900;
    box-shadow: 0 0 16px rgba(185, 28, 28, 0.5);
    border-radius: 4px;
    letter-spacing: 1px;
    line-height: 1.3;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .download-btn {
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.4);
    color: #ffd700;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .action-btn {
    background: linear-gradient(135deg, #ffd700 0%, #d4af37 100%);
    border: none;
    color: #18112e;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
  }

  @media (max-width: 640px) {
    .sync-banner {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .refresh-btn {
      width: 100%;
      text-align: center;
    }
  }
</style>
