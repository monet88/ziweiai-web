<script lang="ts">
  import { onMount } from 'svelte';
  import {
    X,
    Copy,
    Check,
    Share2,
    Trophy,
    Users,
    Coins,
    Gift,
    Loader2,
  } from 'lucide-svelte';
  import {
    referralPartnerHubResponseSchema,
    type ReferralPartnerHubResponse,
    type PartnerTier,
  } from '@ziweiai/contracts';
  import { fetchJson } from '$lib/api-client/fetch-json';
  import { toast } from '$lib/stores/toast';

  interface Props {
    token?: string;
    onClose: () => void;
  }

  let { token, onClose }: Props = $props();

  let hubData = $state<ReferralPartnerHubResponse | null>(null);
  let isLoading = $state(true);
  let errorMessage = $state<string | null>(null);
  let copied = $state(false);

  async function loadHubData(silent = false) {
    if (!silent) isLoading = true;
    try {
      hubData = await fetchJson('/rewards/partner-hub', referralPartnerHubResponseSchema, {
        method: 'GET',
        token,
      });
      errorMessage = null;
    } catch (err: any) {
      console.error('Failed to load partner hub data:', err);
      if (!silent) {
        errorMessage = err.message || 'Không thể nạp dữ liệu Trung Tâm Đối Tác.';
      }
    } finally {
      if (!silent) isLoading = false;
    }
  }

  onMount(() => {
    loadHubData();

    function handleRealtimeUpdate() {
      loadHubData(true);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('ziwei:referral_received', handleRealtimeUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('ziwei:referral_received', handleRealtimeUpdate);
      }
    };
  });

  function copyLink() {
    if (!hubData?.referralLink) return;
    navigator.clipboard.writeText(hubData.referralLink);
    copied = true;
    toast.show('✨ Đã sao chép liên kết giới thiệu độc quyền!', 'success');
    setTimeout(() => (copied = false), 2500);
  }

  async function handleShareInvite() {
    if (!hubData?.referralLink) return;
    const shareText = `Tử Vi Toàn Tập (ViOS) — Khảo sát thiên bàn tử vi, bát tự và nhận luận giải chi tiết từ Hội Đồng Chiêm Tinh Hoàng Cung. Đăng ký qua liên kết này nhận ngay +15 XU vào ví: ${hubData.referralLink}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Tử Vi Toàn Tập — Lập Lá Số & Khai Mở Khí Vận',
          text: shareText,
          url: hubData.referralLink,
        });
        toast.show('Đã mở giao diện chia sẻ mạng xã hội!', 'success');
        return;
      } catch {
        // User cancelled or share failed, fallback to copy
      }
    }

    navigator.clipboard.writeText(shareText);
    toast.show('✨ Đã sao chép nội dung lời mời phong thủy hoàng gia!', 'success');
  }

  function getTierInfo(tier: PartnerTier) {
    switch (tier) {
      case 'kim_cuong':
        return { name: 'Đại Sứ Kim Cương', icon: '💎', color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/40' };
      case 'vang':
        return { name: 'Sứ Giả Hoàng Kim', icon: '👑', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40' };
      case 'bac':
        return { name: 'Sứ Giả Bạch Ngân', icon: '🥈', color: 'text-slate-300', bg: 'bg-slate-400/20 border-slate-400/40' };
      case 'dong':
      default:
        return { name: 'Sứ Giả Đồng', icon: '🥉', color: 'text-amber-600', bg: 'bg-amber-700/20 border-amber-700/40' };
    }
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape') onClose();
  }}
/>

<div
  class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
  role="dialog"
  aria-modal="true"
  aria-labelledby="partner-hub-title"
  tabindex="-1"
>
  <div class="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-stone-950 border border-amber-500/40 shadow-2xl shadow-amber-950/50 text-stone-100 overflow-hidden">
    <!-- Header Hoàng Gia -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 font-bold shadow-md shadow-amber-500/20">
          <Trophy size={22} />
        </div>
        <div>
          <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Khâm Thiên Giám Ngự Chế • Đại Sứ Lan Tỏa
          </div>
          <h3 id="partner-hub-title" class="font-serif text-lg sm:text-xl font-bold text-amber-100">
            Trung Tâm Đối Tác & Bảng Xếp Hạng Sứ Giả
          </h3>
        </div>
      </div>
      <button
        onclick={onClose}
        class="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        aria-label="Đóng"
      >
        <X size={20} />
      </button>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {#if isLoading}
        <div class="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 size={36} class="text-amber-400 animate-spin" />
          <p class="text-sm text-stone-400">Đang đồng bộ dữ liệu Sứ Giả Hoàng Triều...</p>
        </div>
      {:else if errorMessage}
        <div class="p-6 text-center space-y-3">
          <p class="text-rose-400 text-sm">{errorMessage}</p>
          <button
            type="button"
            onclick={() => window.location.reload()}
            class="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold"
          >
            Tải lại trang
          </button>
        </div>
      {:else if hubData}
        {@const tierInfo = getTierInfo(hubData.tier)}

        <!-- Banner Cấp Bậc Sứ Giả -->
        <div class="p-5 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-950 to-amber-950/20 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-4 text-center md:text-left">
            <div class="text-4xl p-3 rounded-2xl bg-stone-900 border border-amber-500/20 shadow-inner">
              {tierInfo.icon}
            </div>
            <div>
              <div class="flex items-center justify-center md:justify-start gap-2">
                <h4 class="font-serif text-lg font-bold text-amber-200">
                  {tierInfo.name}
                </h4>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider {tierInfo.bg} {tierInfo.color}">
                  Cấp Hiện Tại
                </span>
              </div>
              <p class="text-xs text-stone-400 mt-1">
                {#if hubData.nextTierRemaining > 0}
                  Mời thêm <strong class="text-amber-300">{hubData.nextTierRemaining} bạn bè</strong> để nâng cấp danh hiệu kế tiếp.
                {:else}
                  Chúc mừng Đại Ka đã đạt cấp bậc vinh danh tối cao của triều đình!
                {/if}
              </p>
            </div>
          </div>

          <!-- Referral Link Copy Box -->
          <div class="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2">
            <div class="flex items-center px-3 py-2 rounded-xl bg-black/50 border border-stone-800 w-full sm:w-64 text-xs font-mono text-stone-300 truncate">
              {hubData.referralLink}
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onclick={copyLink}
                class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20"
              >
                {#if copied}
                  <Check size={14} /> Đã Chép
                {:else}
                  <Copy size={14} /> Sao Chép
                {/if}
              </button>
              <button
                type="button"
                onclick={handleShareInvite}
                class="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/20 transition-colors"
                title="Chia sẻ mạng xã hội"
                aria-label="Chia sẻ mạng xã hội"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>

        <!-- 3 Thẻ Chỉ Số Vàng -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div class="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
            <div class="flex items-center justify-between text-stone-400 text-xs">
              <span>Tổng Bạn Bè Đã Mời</span>
              <Users size={16} class="text-amber-400" />
            </div>
            <div class="text-2xl font-bold font-serif text-stone-100">
              {hubData.totalReferrals} <span class="text-xs font-sans text-stone-400 font-normal">người</span>
            </div>
            <p class="text-[11px] text-emerald-400">
              Nhận +10 XU cho mỗi lượt tham gia hợp lệ
            </p>
          </div>

          <div class="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
            <div class="flex items-center justify-between text-stone-400 text-xs">
              <span>Tổng XU Đã Nhận</span>
              <Coins size={16} class="text-amber-400" />
            </div>
            <div class="text-2xl font-bold font-serif text-amber-300">
              {hubData.totalXuEarned} <span class="text-xs font-sans text-stone-400 font-normal">XU</span>
            </div>
            <p class="text-[11px] text-stone-400">
              Cộng trực tiếp vào số dư ví của Đại Ka
            </p>
          </div>

          <div class="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
            <div class="flex items-center justify-between text-stone-400 text-xs">
              <span>Đãi Ngộ Người Được Mời</span>
              <Gift size={16} class="text-purple-400" />
            </div>
            <div class="text-2xl font-bold font-serif text-purple-300">
              +15 <span class="text-xs font-sans text-stone-400 font-normal">XU</span>
            </div>
            <p class="text-[11px] text-stone-400">
              Quà tặng khởi đầu chào đón tân đạo hữu
            </p>
          </div>
        </div>

        <!-- Bảng Xếp Hạng Sứ Giả Lan Tỏa Toàn Quốc (Leaderboard) -->
        <div class="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Trophy size={18} class="text-amber-400" />
              <h4 class="font-serif text-base font-bold text-amber-200">
                Bảng Vinh Danh Sứ Giả Lan Tỏa Toàn Quốc
              </h4>
            </div>
            <span class="text-[11px] text-stone-400">Cập nhật mỗi 24 giờ</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-stone-800 text-stone-400 uppercase text-[10px] tracking-wider">
                  <th class="py-2.5 px-3">Hạng</th>
                  <th class="py-2.5 px-3">Sứ Giả</th>
                  <th class="py-2.5 px-3 text-center">Lượt Giới Thiệu</th>
                  <th class="py-2.5 px-3 text-right">Hoa Hồng Nhận</th>
                  <th class="py-2.5 px-3 text-right">Danh Hiệu</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-800/60">
                {#each hubData.leaderboard as item (item.rank)}
                  <tr class="hover:bg-stone-800/30 transition-colors">
                    <td class="py-2.5 px-3">
                      {#if item.rank === 1}
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-bold text-xs">🥇</span>
                      {:else if item.rank === 2}
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-stone-950 font-bold text-xs">🥈</span>
                      {:else if item.rank === 3}
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-stone-100 font-bold text-xs">🥉</span>
                      {:else}
                        <span class="inline-flex items-center justify-center w-6 h-6 text-stone-400 font-mono text-xs">#{item.rank}</span>
                      {/if}
                    </td>
                    <td class="py-2.5 px-3 font-mono font-medium text-stone-300">
                      {item.maskedName}
                    </td>
                    <td class="py-2.5 px-3 text-center font-bold text-amber-300">
                      {item.referralCount}
                    </td>
                    <td class="py-2.5 px-3 text-right font-medium text-stone-200">
                      +{item.rewardXuEarned} XU
                    </td>
                    <td class="py-2.5 px-3 text-right">
                      <span class="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-800 text-amber-200 border border-stone-700">
                        {item.badge}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Lịch Sử Bạn Bè Đã Mời Gần Đây -->
        <div class="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
          <h4 class="font-serif text-sm font-bold text-stone-200 flex items-center gap-2">
            <Users size={16} class="text-amber-400" /> Bạn Bè Đã Mời Gần Đây
          </h4>

          {#if hubData.recentReferrals.length === 0}
            <p class="text-xs text-stone-500 py-4 text-center">
              Chưa có bạn bè nào đăng ký qua liên kết của bạn. Hãy sao chép liên kết phía trên và chia sẻ ngay!
            </p>
          {:else}
            <div class="space-y-2">
              {#each hubData.recentReferrals.slice(0, 5) as ref (ref.id)}
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 text-xs">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span class="font-mono text-stone-300">{ref.refereeEmailMasked || 'Người dùng ẩn danh'}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-stone-500 text-[11px]">{new Date(ref.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span class="font-bold text-emerald-400">+{ref.rewardXu} XU</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Footer Actions -->
    <div class="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
      <p class="text-[11px] text-stone-400">
        Khâm Thiên Giám Ngự Bút • Hoa hồng và cấp bậc áp dụng theo chính sách đối tác ViOS
      </p>
      <button
        onclick={onClose}
        class="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition-colors"
      >
        Đóng
      </button>
    </div>
  </div>
</div>
