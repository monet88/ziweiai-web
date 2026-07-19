<script lang="ts">
  import { getAuthStore } from '$lib/auth/auth-context';
  import { deleteAccount } from '$lib/api-client';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { AlertCircle, Trash2, ArrowLeft } from 'lucide-svelte';

  const auth = getAuthStore();
  let isDeleting = $state(false);
  let showConfirmModal = $state(false);

  async function handleDeleteAccount() {
    const token = auth.getAccessToken();
    if (!token) return;
    try {
      isDeleting = true;
      await deleteAccount(token);
      alert('Tài khoản đã được xoá thành công.');
      await auth.signOut();
      goto(resolve('/sign-in'));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi không xác định khi xoá tài khoản.');
    } finally {
      isDeleting = false;
      showConfirmModal = false;
    }
  }
</script>

<svelte:head>
  <title>Cài đặt - Tử Vi Toàn Tập</title>
</svelte:head>

<div class="max-w-2xl mx-auto p-4 md:p-8">
  <div class="mb-8 flex items-center gap-4">
    <a href={resolve('/')} class="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900" title="Quay lại">
      <ArrowLeft class="w-5 h-5" />
    </a>
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Cài đặt tài khoản</h1>
      <p class="text-slate-500 text-sm mt-1">Quản lý thông tin và dữ liệu của bạn</p>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="p-6">
      <h2 class="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
        <AlertCircle class="w-5 h-5 text-red-500" />
        Khu vực nguy hiểm
      </h2>
      <p class="text-slate-600 mb-6 text-sm">
        Hành động này sẽ xoá vĩnh viễn tài khoản của bạn, bao gồm toàn bộ lá số đã lập, lịch sử hội thoại và các luận giải.
        Dữ liệu không thể khôi phục sau khi xoá.
      </p>

      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg font-medium transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isDeleting}
        onclick={() => showConfirmModal = true}
      >
        <Trash2 class="w-4 h-4" />
        Xoá tài khoản vĩnh viễn
      </button>
    </div>
  </div>
</div>

{#if showConfirmModal}
  <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div class="p-6">
        <h3 class="text-xl font-semibold text-slate-900 mb-2">Xác nhận xoá tài khoản?</h3>
        <p class="text-slate-600 text-sm mb-6">
          Bạn đang thực hiện thao tác xoá tài khoản vĩnh viễn. Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?
        </p>
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isDeleting}
            onclick={() => showConfirmModal = false}
          >
            Huỷ bỏ
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isDeleting}
            onclick={handleDeleteAccount}
          >
            {#if isDeleting}
              <div class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              Đang xoá...
            {:else}
              Xác nhận xoá
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
