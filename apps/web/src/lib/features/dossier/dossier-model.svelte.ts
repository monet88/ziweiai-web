import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { getDossierStatus, unlockDossier } from '$lib/api-client/dossier';
import { authModalStore } from '$lib/stores/auth-modal.svelte';
import { paywallStore } from '$lib/stores/paywall.svelte';
import { toast } from '$lib/stores/toast';

export interface DossierModelOptions {
  auth: AuthStore;
  getChartId: () => string;
  onUnlocked?: () => void;
}

export function createDossierModel(options: DossierModelOptions) {
  let isUnlocked = $state(false);
  let isChecking = $state(false);
  let isUnlocking = $state(false);
  let isModalOpen = $state(false);

  async function checkStatus(): Promise<boolean> {
    const chartId = options.getChartId();
    const token = options.auth.getAccessToken();
    if (!token || options.auth.isAnonymous) {
      isUnlocked = false;
      return false;
    }

    try {
      isChecking = true;
      const res = await getDossierStatus(token, chartId);
      isUnlocked = res.isUnlocked;
      return res.isUnlocked;
    } catch {
      isUnlocked = false;
      return false;
    } finally {
      isChecking = false;
    }
  }

  async function openOrUnlock(walletBalance: number) {
    if (options.auth.isAnonymous || !options.auth.user) {
      authModalStore.open('Vui lòng đăng ký hoặc đăng nhập tài khoản để xuất bản Hồ Sơ Mệnh Lý Hoàng Gia.');
      return;
    }

    if (isUnlocked) {
      isModalOpen = true;
      return;
    }

    const already = await checkStatus();
    if (already) {
      isUnlocked = true;
      isModalOpen = true;
      return;
    }

    if (walletBalance < 50) {
      paywallStore.open(
        `Xuất Bản Hồ Sơ Mệnh Lý Hoàng Gia (19 Trang Chuẩn In A4 Vector) yêu cầu 50 XU. Số dư hiện tại của bạn là ${walletBalance} XU. Vui lòng nạp thêm XU để tiếp tục.`
      );
      return;
    }

    const token = options.auth.getAccessToken();
    if (!token) {
      authModalStore.open('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      isUnlocking = true;
      const res = await unlockDossier(token, options.getChartId());
      if (res.success) {
        isUnlocked = true;
        isModalOpen = true;
        if (res.alreadyUnlocked) {
          toast.show('✨ Hồ sơ hoàng gia đã được mở khóa từ trước.', 'info');
        } else {
          toast.show('👑 Xuất bản Hồ Sơ Mệnh Lý Hoàng Gia thành công! (-50 XU)', 'success');
        }
        options.onUnlocked?.();
      }
    } catch (err: any) {
      if (err?.kind !== 'payment-required') {
        toast.show(err?.message || 'Không thể mở khóa hồ sơ, vui lòng thử lại sau.', 'danger');
      }
    } finally {
      isUnlocking = false;
    }
  }

  return {
    get isUnlocked() {
      return isUnlocked;
    },
    get isChecking() {
      return isChecking;
    },
    get isUnlocking() {
      return isUnlocking;
    },
    get isModalOpen() {
      return isModalOpen;
    },
    set isModalOpen(val: boolean) {
      isModalOpen = val;
    },
    checkStatus,
    openOrUnlock,
    closeModal() {
      isModalOpen = false;
    },
  };
}
