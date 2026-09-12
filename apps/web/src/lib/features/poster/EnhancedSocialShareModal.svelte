<script lang="ts">
  import {
    X,
    Share2,
    Download,
    Copy,
    Check,
    QrCode,
    Sparkles,
    Smartphone,
    Square,
    Layers,
  } from 'lucide-svelte';
  import {
    exportPosterToPng,
    triggerDirectDownload,
    sharePosterImage,
    slugifyVietnamese,
    type PosterAspectRatio,
  } from './royal-poster-exporter';
  import {
    buildShareUrl,
    openFacebookShare,
    openZaloShare,
    openTelegramShare,
    copyToClipboard,
  } from './poster-social-actions';
  import { toast } from '$lib/stores/toast';
  import { getAuthStore } from '$lib/auth/auth-context';

  interface Props {
    title?: string;
    subtitle?: string;
    path: string; // ví dụ "/charts/xxxx" hoặc "/share/xxxx"
    quote?: string;
    onClose: () => void;
  }

  let {
    title = 'Lá Số Tử Vi Hoàng Gia',
    subtitle = 'Khâm Thiên Giám Ngự Bút • Tử Vi Toàn Tập',
    path,
    quote = 'Mời bạn khám phá bản đồ vận mệnh Tử Vi Hoàng Gia cùng ViOS!',
    onClose,
  }: Props = $props();

  const auth = getAuthStore();
  let selectedRatio = $state<PosterAspectRatio>('story');
  let isExporting = $state(false);
  let isCopied = $state(false);
  let posterRef = $state<HTMLDivElement | null>(null);

  const referralCode = $derived(auth.user?.id || '');
  const shareUrl = $derived(buildShareUrl(path, referralCode));

  async function handleCopy() {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      isCopied = true;
      toast.show('Đã sao chép liên kết chia sẻ kèm mã giới thiệu!', 'success');
      setTimeout(() => {
        isCopied = false;
      }, 2500);
    } else {
      toast.show('Không thể sao chép liên kết.', 'danger');
    }
  }

  function handleShareFacebook() {
    openFacebookShare(shareUrl, quote);
  }

  function handleShareZalo() {
    openZaloShare(shareUrl);
  }

  function handleShareTelegram() {
    openTelegramShare(shareUrl, quote);
  }

  async function handleDownloadImage() {
    if (!posterRef || isExporting) return;
    isExporting = true;
    try {
      toast.show('Đang tạo ảnh chất lượng cao, xin vui lòng đợi...', 'info');
      const blob = await exportPosterToPng(posterRef, {
        scale: 2,
        backgroundColor: '#0c0a09',
        aspectRatio: selectedRatio,
      });
      const fileName = `Chia-Se-Tu-Vi-${slugifyVietnamese(title)}-${selectedRatio}.png`;
      triggerDirectDownload(blob, fileName);
      toast.show('Tải ảnh chia sẻ thành công!', 'success');
    } catch (e: any) {
      toast.show('Lỗi khi xuất ảnh: ' + (e.message || 'Không xác định'), 'danger');
    } finally {
      isExporting = false;
    }
  }

  async function handleNativeShare() {
    if (!posterRef || isExporting) return;
    isExporting = true;
    try {
      const blob = await exportPosterToPng(posterRef, {
        scale: 2,
        backgroundColor: '#0c0a09',
        aspectRatio: selectedRatio,
      });
      const fileName = `Tu-Vi-${selectedRatio}.png`;
      const shared = await sharePosterImage(blob, fileName, title, quote);
      if (shared) {
        toast.show('Đã mở chia sẻ thành công!', 'success');
      } else {
        // Fallback mở Web Share URL nếu thiết bị không hỗ trợ share file
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title,
            text: quote,
            url: shareUrl,
          });
        } else {
          await handleCopy();
        }
      }
    } catch {
      // User cancelled
    } finally {
      isExporting = false;
    }
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
  role="dialog"
  aria-modal="true"
  aria-labelledby="social-share-title"
  tabindex="-1"
  onkeydown={(e) => {
    if (e.key === 'Escape') onClose();
  }}
>
  <!-- Card Modal -->
  <div class="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-stone-950 border border-amber-500/30 shadow-2xl shadow-amber-950/40 text-stone-100 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-stone-800/80 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 id="social-share-title" class="font-serif text-lg font-bold text-amber-200 tracking-wide">
            Chia Sẻ Hoàng Triều • Lan Tỏa Vận Số
          </h3>
          <p class="text-xs text-stone-400">Tự động gắn mã giới thiệu nhận hoa hồng XU</p>
        </div>
      </div>
      <button
        onclick={onClose}
        class="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        aria-label="Đóng modal"
      >
        <X size={20} />
      </button>
    </div>

    <!-- Body cuộn -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <!-- Selector chọn tỉ lệ -->
      <div class="space-y-2">
        <div class="text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={14} class="text-amber-400" /> Chọn Định Dạng Kích Thước:
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all {selectedRatio === 'story' ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10' : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800'}"
            onclick={() => (selectedRatio = 'story')}
          >
            <Smartphone size={15} /> Story (9:16)
          </button>
          <button
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all {selectedRatio === 'square' ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10' : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800'}"
            onclick={() => (selectedRatio = 'square')}
          >
            <Square size={15} /> Vuông (1:1)
          </button>
          <button
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all {selectedRatio === 'portrait' ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10' : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800'}"
            onclick={() => (selectedRatio = 'portrait')}
          >
            <Layers size={15} /> Cổ Điển (3:4)
          </button>
        </div>
      </div>

      <!-- Preview Poster Container -->
      <div class="flex justify-center bg-stone-900/50 p-4 rounded-xl border border-stone-800/60 overflow-hidden">
        <div
          bind:this={posterRef}
          class="relative bg-gradient-to-b from-stone-900 via-stone-950 to-[#0c0a09] border border-amber-500/40 rounded-xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between items-center text-center transition-all overflow-hidden"
          style="
            width: {selectedRatio === 'story' ? '280px' : selectedRatio === 'square' ? '300px' : '300px'};
            height: {selectedRatio === 'story' ? '497px' : selectedRatio === 'square' ? '300px' : '400px'};
          "
        >
          <!-- Họa tiết góc hoàng cung -->
          <div class="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-500/60 rounded-tl-sm pointer-events-none"></div>
          <div class="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-500/60 rounded-tr-sm pointer-events-none"></div>
          <div class="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-500/60 rounded-bl-sm pointer-events-none"></div>
          <div class="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-500/60 rounded-br-sm pointer-events-none"></div>

          <!-- Poster Header -->
          <div class="space-y-1">
            <span class="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
              Khâm Thiên Giám Ngự Chế
            </span>
            <h4 class="font-serif text-sm sm:text-base font-bold text-amber-100 leading-tight">
              {title}
            </h4>
            <p class="text-[10px] text-stone-400">{subtitle}</p>
          </div>

          <!-- Poster Body Center (Ấn triện hoặc câu đối) -->
          <div class="my-auto py-2 px-3 border border-amber-500/20 bg-amber-950/20 rounded-lg max-w-[90%]">
            <p class="font-serif text-xs text-amber-200/90 italic leading-relaxed line-clamp-3">
              "{quote}"
            </p>
          </div>

          <!-- Poster Footer & QR -->
          <div class="w-full pt-2 border-t border-amber-500/20 flex items-center justify-between">
            <div class="text-left space-y-0.5">
              <p class="text-[9px] font-semibold text-amber-300/90 tracking-wide">ViOS • Tử Vi Toàn Tập</p>
              <p class="text-[8px] text-stone-400">Quét mã xem bản luận giải chi tiết</p>
            </div>
            <!-- Mock QR Hoàng gia -->
            <div class="w-10 h-10 bg-stone-900 border border-amber-400/50 rounded flex items-center justify-center text-amber-400 shadow-inner">
              <QrCode size={24} />
            </div>
          </div>
        </div>
      </div>

      <!-- Khối Chia Sẻ Nhanh Mạng Xã Hội -->
      <div class="space-y-3">
        <div class="text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
          <Share2 size={14} class="text-amber-400" /> Chia Sẻ Trực Tiếp 1-Chạm:
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onclick={handleShareFacebook}
            aria-label="Chia sẻ lên Facebook"
            class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/40 text-[#1877F2] font-semibold text-xs transition-colors"
          >
            <span class="font-bold">f</span> Facebook
          </button>
          <button
            onclick={handleShareZalo}
            aria-label="Chia sẻ lên Zalo"
            class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0068FF]/15 hover:bg-[#0068FF]/25 border border-[#0068FF]/40 text-[#0068FF] font-semibold text-xs transition-colors"
          >
            <span class="font-bold">Z</span> Zalo
          </button>
          <button
            onclick={handleShareTelegram}
            aria-label="Chia sẻ lên Telegram"
            class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/40 text-[#229ED9] font-semibold text-xs transition-colors"
          >
            <span class="font-bold">✈</span> Telegram
          </button>
          <button
            onclick={handleNativeShare}
            aria-label="Mở tùy chọn chia sẻ khác hoặc Web Share"
            class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 font-semibold text-xs transition-colors"
          >
            <Share2 size={14} /> Khác
          </button>
        </div>
      </div>

      <!-- Input copy đường link có referral -->
      <div class="space-y-1.5">
        <label for="share-link-input" class="text-xs text-stone-400">Liên kết kèm mã giới thiệu của bạn:</label>
        <div class="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-xl p-1.5 pl-3">
          <input
            id="share-link-input"
            readonly
            value={shareUrl}
            class="flex-1 bg-transparent text-xs text-stone-300 font-mono outline-none truncate"
          />
          <button
            onclick={handleCopy}
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors"
          >
            {#if isCopied}
              <Check size={14} /> Đã chép
            {:else}
              <Copy size={14} /> Sao chép
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="p-4 border-t border-stone-800/80 bg-stone-950 flex flex-wrap items-center justify-between gap-3">
      <p class="text-[11px] text-amber-300/80 flex items-center gap-1">
        <Sparkles size={12} /> Nhận ngay +5 XU khi người quen tạo tài khoản qua link của bạn
      </p>
      <div class="flex items-center gap-2 ml-auto">
        <button
          onclick={handleDownloadImage}
          disabled={isExporting}
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
        >
          <Download size={14} />
          {isExporting ? 'Đang xuất ảnh...' : 'Tải Ảnh Poster'}
        </button>
      </div>
    </div>
  </div>
</div>
