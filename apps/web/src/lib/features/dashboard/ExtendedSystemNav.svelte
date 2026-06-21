<script lang="ts">
  // ExtendedSystemNav (US-017d): lối vào các hệ mở rộng gate-by-flag trên dashboard. Đọc
  // GET /features (public) rồi chỉ hiện link khi cờ tương ứng bật — fail-closed: cờ tắt / lỗi
  // tải đều ẩn link, tránh mời gọi vào hệ chưa bật. Hiện tại phục vụ Mạnh Phái; thêm hệ khác
  // chỉ cần nối thêm vào danh sách EXTENDED_LINKS.
  import { createQuery } from '@tanstack/svelte-query';
  import { resolve } from '$app/paths';
  import { fetchFeatures } from '$lib/api-client';
  import { viCopy } from '$lib/i18n/vi';
  import type { FeaturesResponse } from '@ziweiai/contracts';

  // Route literal + cờ tương ứng + nhãn. Giữ route as const để qua kiểm tra kiểu route SvelteKit.
  const EXTENDED_LINKS = [
    { route: '/mangpai', flag: 'mangpai', label: viCopy.mangpai.navOpen },
    { route: '/face', flag: 'face', label: viCopy.face.navOpen },
    { route: '/palm', flag: 'palm', label: viCopy.palm.navOpen },
  ] as const satisfies ReadonlyArray<{ route: string; flag: keyof FeaturesResponse; label: string }>;

  // staleTime dài: trạng thái cờ ít đổi trong một phiên. enabled mặc định (không cần token —
  // /features là public). Lỗi/đang tải → coi như chưa bật (fail-closed).
  const features = createQuery(() => ({
    queryKey: ['features'],
    queryFn: fetchFeatures,
    staleTime: 5 * 60_000,
  }));

  const visibleLinks = $derived(
    features.data ? EXTENDED_LINKS.filter((link) => features.data![link.flag]) : [],
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
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .nav-link {
    display: block;
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
    border-color: var(--color-border-gold);
  }

  .nav-link:focus-visible {
    outline: 2px solid var(--color-accent-gold-soft);
    outline-offset: 1px;
  }
</style>
