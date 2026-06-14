<script lang="ts">
  // Dashboard — màn chính sau đăng nhập (US-005). Bố cục 2 cột qua AppScaffold:
  // main = BirthForm (tạo lá số), sidebar = DashboardSidebar (lịch sử gần đây limit 8).
  // <1024px sidebar xếp xuống dưới (AppScaffold media query); <768px form gom 1 cột (CSS).
  //
  // Model dashboard khởi tạo một lần ở đây (factory runes) rồi truyền xuống BirthForm.
  // Đăng xuất: clear cache query để không rò dữ liệu user cũ (bất biến token tươi §3).
  import { useQueryClient } from '@tanstack/svelte-query';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold, PrimaryButton } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { createDashboardModel } from '$lib/features/dashboard/dashboard-model.svelte';
  import BirthForm from '$lib/features/dashboard/BirthForm.svelte';
  import DashboardSidebar from '$lib/features/dashboard/DashboardSidebar.svelte';

  const auth = getAuthStore();
  const queryClient = useQueryClient();

  const model = createDashboardModel({ auth });

  let isSigningOut = $state(false);

  async function handleSignOut(): Promise<void> {
    if (isSigningOut) {
      return;
    }
    isSigningOut = true;
    try {
      await auth.signOut();
      queryClient.clear();
      await goto(resolve('/sign-in'), { replaceState: true });
    } finally {
      isSigningOut = false;
    }
  }

  // Cuộn tới form khi sidebar rỗng nhấn "Lập lá số".
  function focusForm(): void {
    document.getElementById('birth-day')?.focus();
  }
</script>

<AppScaffold
  eyebrow={viCopy.dashboard.heroEyebrow}
  title={viCopy.dashboard.heroTitle}
  subtitle={viCopy.dashboard.heroSubtitle}
>
  {#snippet action()}
    <div class="session">
      <span class="session-email">{auth.user?.email ?? viCopy.dashboard.unknownUser}</span>
      <PrimaryButton
        label={viCopy.dashboard.signOut}
        variant="surface"
        loading={isSigningOut}
        onclick={handleSignOut}
      />
    </div>
  {/snippet}

  {#snippet sidebar()}
    <DashboardSidebar onCreateFirst={focusForm} />
  {/snippet}

  <BirthForm {model} />
</AppScaffold>

<style>
  .session {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-xs);
  }

  .session-email {
    color: var(--color-text-muted);
    font-size: 13px;
  }
</style>
