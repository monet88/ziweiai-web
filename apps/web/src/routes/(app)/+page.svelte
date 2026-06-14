<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { fetchHealth, fetchHistory } from '$lib/api-client';

  const auth = getAuthStore();
  const queryClient = useQueryClient();

  const health = createQuery(() => ({
    queryKey: ['health'],
    queryFn: fetchHealth,
  }));

  // Token đọc tươi từ store ngay tại queryFn (không snapshot lúc mount). queryKey gắn
  // token để cache tách theo user; logout sẽ clear toàn bộ.
  const history = createQuery(() => ({
    queryKey: ['history', auth.getAccessToken()],
    queryFn: () => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new Error('Thiếu token đăng nhập.');
      }
      return fetchHistory(token);
    },
    enabled: auth.isAuthenticated,
  }));

  let isSigningOut = $state(false);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }
    isSigningOut = true;
    try {
      await auth.signOut();
      // Bất biến token tươi (invariants.md §3): clear cache để không rò dữ liệu
      // user cũ sang user mới trên cùng browser.
      queryClient.clear();
      await goto(resolve('/sign-in'), { replaceState: true });
    } finally {
      isSigningOut = false;
    }
  }
</script>

<main>
  <header>
    <h1>ziweiai-web</h1>
    <button type="button" onclick={handleSignOut} disabled={isSigningOut}>
      {isSigningOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
    </button>
  </header>

  <p class="user">Đăng nhập: {auth.user?.email ?? '—'}</p>

  <section>
    <h2>Máy chủ</h2>
    {#if health.isPending}
      <p data-testid="health-status">Đang kiểm tra máy chủ…</p>
    {:else if health.isError}
      <p data-testid="health-status" class="error">
        Không kết nối được máy chủ: {health.error.message}
      </p>
    {:else if health.isSuccess}
      <p data-testid="health-status" class="ok">
        Máy chủ {health.data.service} hoạt động ({health.data.status}) — phiên bản
        {health.data.version}
      </p>
    {/if}
  </section>

  <section>
    <h2>Lịch sử lá số</h2>
    {#if history.isPending}
      <p data-testid="history-status">Đang tải lịch sử…</p>
    {:else if history.isError}
      <p data-testid="history-status" class="error">
        Không tải được lịch sử: {history.error.message}
      </p>
    {:else if history.isSuccess}
      <p data-testid="history-status" class="ok">
        Đã tải {history.data.items.length} bản ghi (token gắn đúng).
      </p>
    {/if}
  </section>
</main>

<style>
  main {
    max-width: 40rem;
    margin: 4rem auto;
    padding: 0 1.5rem;
    font-family: system-ui, sans-serif;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 600;
  }

  h2 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .user {
    color: #6b7280;
    font-size: 0.875rem;
  }

  button {
    padding: 0.4rem 0.9rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background: #fff;
    cursor: pointer;
    font-size: 0.875rem;
  }

  button:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .ok {
    color: #166534;
  }

  .error {
    color: #b91c1c;
  }
</style>
