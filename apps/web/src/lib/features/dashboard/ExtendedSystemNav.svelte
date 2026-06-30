<script lang="ts">
  // ExtendedSystemNav (US-042): lối vào tất cả hệ thuật số mở rộng trên dashboard. Đọc
  // GET /features (public) nhưng theo hướng fail-OPEN: mặc định hiện đủ link, chỉ ẩn một link
  // khi cờ tương ứng trả về ĐÚNG `false` (tắt có chủ đích). Đang tải / lỗi tải / chưa có dữ
  // liệu đều coi như mở — người dùng luôn thấy mọi tính năng. Thêm hệ khác chỉ cần nối vào
  // danh sách EXTENDED_LINKS.
  import { createQuery } from '@tanstack/svelte-query';
  import { resolve } from '$app/paths';
  import { fetchFeatures } from '$lib/api-client';
  import { viCopy } from '$lib/i18n/vi';
  import type { FeaturesResponse } from '@ziweiai/contracts';

  // Route literal + cờ tương ứng + nhãn. Giữ route as const để qua kiểm tra kiểu route SvelteKit.
  const EXTENDED_LINKS = [
    { route: '/tarot', flag: 'tarot', label: viCopy.tarot.navOpen },
    { route: '/mbti', flag: 'mbti', label: viCopy.mbti.navOpen },
    { route: '/hepan', flag: 'hepan', label: viCopy.hepan.navOpen },
    { route: '/mangpai', flag: 'mangpai', label: viCopy.mangpai.navOpen },
    { route: '/face', flag: 'face', label: viCopy.face.navOpen },
    { route: '/palm', flag: 'palm', label: viCopy.palm.navOpen },
    { route: '/lenormand', flag: 'lenormand', label: viCopy.lenormand.navOpen },
    { route: '/dream', flag: 'dream', label: viCopy.dream.navOpen },
    { route: '/stick', flag: 'sticks', label: viCopy.stick.navOpen },
    { route: '/almanac', flag: 'almanac', label: viCopy.almanac.navOpen },
  ] as const satisfies ReadonlyArray<{ route: string; flag: keyof FeaturesResponse; label: string }>;

  // staleTime dài: trạng thái cờ ít đổi trong một phiên. enabled mặc định (không cần token —
  // /features là public). Lỗi/đang tải → coi như mở (fail-open, xem visibleLinks).
  const features = createQuery(() => ({
    queryKey: ['features'],
    queryFn: fetchFeatures,
    staleTime: 5 * 60_000,
  }));

  // Fail-open: ẩn một link CHỈ khi cờ tương ứng đã tải về và bằng đúng `false`. Khi chưa có dữ
  // liệu (đang tải / lỗi) thì giữ nguyên toàn bộ link để không bao giờ ẩn mặc định.
  const visibleLinks = $derived(
    EXTENDED_LINKS.filter((link) => features.data?.[link.flag] !== false),
  );
</script>

{#if visibleLinks.length > 0}
  <div class="nav-links">
    {#each visibleLinks as link (link.route)}
      <a class="nav-link" href={resolve(link.route)}>{link.label}</a>
    {/each}
  </div>
{/if}

<style>
  .nav-links {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(120px, 100%), 1fr));
    grid-auto-rows: 1fr;
    gap: var(--space-xs);
  }

  .nav-link {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    height: 100%;
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 14px;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }

  .nav-link:hover {
    border-color: var(--color-accent-primary);
  }

  .nav-link:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }
</style>
