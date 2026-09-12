<script lang="ts">
  import { onMount } from 'svelte';
  import {
    X,
    Sparkles,
    Sun,
    Compass,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Share2,
    Coins,
    Loader2,
  } from 'lucide-svelte';
  import type {
    AstrologicalSynthesisResponse,
    SynthesisFocusArea,
  } from '@ziweiai/contracts';
  import {
    fetchExistingSynthesis,
    requestGenerateSynthesis,
  } from './synthesis-api';
  import SynthesisScoreRadar from './SynthesisScoreRadar.svelte';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { createWalletModel } from '$lib/features/payment/wallet-model.svelte';
  import { paywallStore } from '$lib/stores/paywall.svelte';
  import { toast } from '$lib/stores/toast';

  interface Props {
    chartId: string;
    chartTitle?: string;
    onClose: () => void;
    onOpenShareModal?: () => void;
  }

  let { chartId, chartTitle = 'Lá Số Chủ Mệnh', onClose, onOpenShareModal }: Props = $props();

  const auth = getAuthStore();
  const wallet = createWalletModel(auth);
  let synthesis = $state<AstrologicalSynthesisResponse | null>(null);
  let isLoading = $state(true);
  let isGenerating = $state(false);
  let activeTab = $state<'overview' | 'heaven' | 'earth' | 'human' | 'strategy'>('overview');

  let selectedFocus = $state<SynthesisFocusArea[]>([
    'general',
    'career',
    'wealth',
    'relationship',
    'health',
  ]);

  const userXu = $derived(wallet.balance ?? 0);
  const REQUIRED_XU = 15;

  onMount(async () => {
    try {
      synthesis = await fetchExistingSynthesis(chartId);
    } catch {
      // Chưa có kết quả
    } finally {
      isLoading = false;
    }
  });

  function toggleFocus(area: SynthesisFocusArea) {
    if (selectedFocus.includes(area)) {
      if (selectedFocus.length > 1) {
        selectedFocus = selectedFocus.filter((item) => item !== area);
      }
    } else {
      selectedFocus = [...selectedFocus, area];
    }
  }

  async function handleStartSynthesis() {
    if (userXu < REQUIRED_XU) {
      paywallStore.open({
        featureName: 'Đại Bản Luận Giải Tam Hợp Hoàng Triều',
        requiredXu: REQUIRED_XU,
        suggestedPackageXu: 20,
      });
      return;
    }

    isGenerating = true;
    try {
      toast.show('Hội Đồng Chiêm Tinh đang hội tụ và hợp nhất dữ liệu tam môn phái...', 'info');
      const result = await requestGenerateSynthesis({
        chartId,
        includeBazi: true,
        includeNumerology: true,
        focusAreas: selectedFocus,
      });
      synthesis = result;
      // Cập nhật số dư XU hiển thị
      void wallet.refresh();
      toast.show('Đại Bản Luận Giải Tổng Hợp đã hoàn tất!', 'success');
    } catch (err: any) {
      if (err.status === 402 || err.code === 'INSUFFICIENT_XU') {
        paywallStore.open({
          featureName: 'Đại Bản Luận Giải Tam Hợp Hoàng Triều',
          requiredXu: REQUIRED_XU,
          suggestedPackageXu: 20,
        });
      } else {
        toast.show(err.message || 'Lỗi khi khởi tạo luận giải tổng hợp', 'danger');
      }
    } finally {
      isGenerating = false;
    }
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
  role="dialog"
  aria-modal="true"
  aria-labelledby="synthesis-modal-title"
  tabindex="-1"
  onkeydown={(e) => {
    if (e.key === 'Escape') onClose();
  }}
>
  <div class="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-stone-950 border border-amber-500/40 shadow-2xl shadow-amber-950/50 text-stone-100 overflow-hidden">
    <!-- Header Hoàng Gia -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Sparkles size={22} />
        </div>
        <div>
          <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Khâm Thiên Giám Ngự Chế • Đỉnh Cao ViOS
          </div>
          <h3 id="synthesis-modal-title" class="font-serif text-lg sm:text-xl font-bold text-amber-100">
            Đại Bản Luận Giải Tổng Hợp Tam Hợp • {chartTitle}
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
          <p class="text-sm text-stone-400">Đang tra cứu dữ liệu Khâm Thiên Giám...</p>
        </div>
      {:else if !synthesis}
        <!-- Màn hình Giới thiệu & Khởi tạo (Paywall Gate) -->
        <div class="space-y-6">
          <div class="p-6 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-950 to-amber-950/20 border border-amber-500/30 text-center space-y-4">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
              <Sparkles size={14} /> Tích Hợp Đa Môn Phái Đầu Tiên Tại Việt Nam
            </div>
            <h2 class="font-serif text-xl sm:text-2xl font-bold text-amber-200">
              Khai Mở Toàn Cảnh Vận Mệnh Cùng Hội Đồng Chiêm Tinh
            </h2>
            <p class="text-sm text-stone-300 max-w-2xl mx-auto leading-relaxed">
              Không chỉ dừng lại ở một góc nhìn đơn lẻ. Bản luận giải tổng hợp hội tụ sức mạnh của:
              <strong class="text-amber-300"> Tử Vi Đẩu Số</strong> (Định vị chân mệnh thiên bàn),
              <strong class="text-emerald-300"> Bát Tự Hà Lạc</strong> (Cân bằng ngũ hành tứ trụ) và
              <strong class="text-blue-300"> Thần Số Học Pythagoras</strong> (Sóng rung số đạo & nhân tâm).
            </p>

            <!-- 3 Khối so sánh -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-left">
              <div class="p-4 rounded-xl bg-stone-900/80 border border-amber-500/20 space-y-2">
                <div class="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Sun size={16} /> Thiên Đạo (Tử Vi)
                </div>
                <p class="text-xs text-stone-400">
                  Làm sáng tỏ căn cơ nghiệp quả, thời cơ đại vận và trục Tài - Quan - Cung Mệnh.
                </p>
              </div>
              <div class="p-4 rounded-xl bg-stone-900/80 border border-emerald-500/20 space-y-2">
                <div class="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Compass size={16} /> Địa Đạo (Bát Tự)
                </div>
                <p class="text-xs text-stone-400">
                  Phân tích vượng suy ngũ hành, can chi và tìm ra Dụng Thần cứu trợ sinh khắc.
                </p>
              </div>
              <div class="p-4 rounded-xl bg-stone-900/80 border border-blue-500/20 space-y-2">
                <div class="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck size={16} /> Nhân Đạo (Thần Số)
                </div>
                <p class="text-xs text-stone-400">
                  Khai mở số chủ đạo, 4 đỉnh cao kim tự tháp và năng lượng hành động thực tế.
                </p>
              </div>
            </div>
          </div>

          <!-- Lựa chọn lĩnh vực trọng tâm -->
          <div class="space-y-3">
            <div class="text-xs font-semibold text-stone-300 uppercase tracking-wider">
              Lĩnh Vực Bạn Muốn Đào Sâu Trọng Tâm:
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                onclick={() => toggleFocus('career')}
                class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all {selectedFocus.includes('career') ? 'bg-amber-500/20 border-amber-500 text-amber-200' : 'bg-stone-900 border-stone-800 text-stone-400'}"
              >
                Công Danh & Sự Nghiệp
              </button>
              <button
                type="button"
                onclick={() => toggleFocus('wealth')}
                class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all {selectedFocus.includes('wealth') ? 'bg-amber-500/20 border-amber-500 text-amber-200' : 'bg-stone-900 border-stone-800 text-stone-400'}"
              >
                Tài Bạch & Làm Ăn
              </button>
              <button
                type="button"
                onclick={() => toggleFocus('relationship')}
                class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all {selectedFocus.includes('relationship') ? 'bg-amber-500/20 border-amber-500 text-amber-200' : 'bg-stone-900 border-stone-800 text-stone-400'}"
              >
                Tình Duyên & Gia Đạo
              </button>
              <button
                type="button"
                onclick={() => toggleFocus('health')}
                class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all {selectedFocus.includes('health') ? 'bg-amber-500/20 border-amber-500 text-amber-200' : 'bg-stone-900 border-stone-800 text-stone-400'}"
              >
                Sức Khỏe & Bình An
              </button>
            </div>
          </div>

          <!-- CTA Box -->
          <div class="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="space-y-1 text-center sm:text-left">
              <div class="flex items-center justify-center sm:justify-start gap-2 text-sm text-stone-300">
                <span>Số dư hiện tại của bạn:</span>
                <span class="font-bold text-amber-400 flex items-center gap-1">
                  <Coins size={15} /> {userXu} XU
                </span>
              </div>
              <p class="text-xs text-stone-400">
                Phí khai mở: <strong class="text-amber-300">15 XU</strong> (Lưu vĩnh viễn, xem lại miễn phí trọn đời).
              </p>
            </div>

            <button
              onclick={handleStartSynthesis}
              disabled={isGenerating}
              class="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-serif font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {#if isGenerating}
                <Loader2 size={16} class="animate-spin" /> Đang Luận Giải...
              {:else}
                <Sparkles size={16} /> Khởi Tạo Luận Giải (15 XU)
              {/if}
            </button>
          </div>
        </div>
      {:else}
        <!-- Màn hình Hiển thị Kết Quả Luận Giải -->
        <div class="space-y-6">
          <!-- Radar Điểm Đồng Thuận -->
          <SynthesisScoreRadar score={synthesis.consensusScore} />

          <!-- Thanh điều hướng Tab -->
          <div class="flex border-b border-stone-800 gap-2 overflow-x-auto pb-1">
            <button
              class="px-3.5 py-2 text-xs font-semibold rounded-lg transition-all {activeTab === 'overview' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' : 'text-stone-400 hover:text-stone-200'}"
              onclick={() => (activeTab = 'overview')}
            >
              Tổng Quan & Sấm Truyền
            </button>
            <button
              class="px-3.5 py-2 text-xs font-semibold rounded-lg transition-all {activeTab === 'heaven' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' : 'text-stone-400 hover:text-stone-200'}"
              onclick={() => (activeTab = 'heaven')}
            >
              Thiên Đạo (Tử Vi)
            </button>
            <button
              class="px-3.5 py-2 text-xs font-semibold rounded-lg transition-all {activeTab === 'earth' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' : 'text-stone-400 hover:text-stone-200'}"
              onclick={() => (activeTab = 'earth')}
            >
              Địa Đạo (Bát Tự)
            </button>
            <button
              class="px-3.5 py-2 text-xs font-semibold rounded-lg transition-all {activeTab === 'human' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' : 'text-stone-400 hover:text-stone-200'}"
              onclick={() => (activeTab = 'human')}
            >
              Nhân Đạo (Thần Số)
            </button>
            <button
              class="px-3.5 py-2 text-xs font-semibold rounded-lg transition-all {activeTab === 'strategy' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' : 'text-stone-400 hover:text-stone-200'}"
              onclick={() => (activeTab = 'strategy')}
            >
              Chiến Lược Hành Động
            </button>
          </div>

          <!-- Tab Content -->
          <div class="space-y-4">
            {#if activeTab === 'overview'}
              <div class="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 class="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
                  <Sparkles size={18} class="text-amber-400" /> Sấm Truyền Khâm Thiên Giám
                </h4>
                <p class="text-sm text-stone-200 leading-relaxed italic border-l-2 border-amber-500/60 pl-4 py-1">
                  "{synthesis.summary}"
                </p>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {#each synthesis.disciplines as d (d.discipline)}
                    <div class="p-3.5 rounded-xl bg-stone-950 border border-stone-800/80 space-y-1.5">
                      <span class="text-[10px] uppercase tracking-wider font-bold text-amber-400">{d.title}</span>
                      <p class="text-xs text-stone-300 font-medium">{d.keyFindings[0] || 'Vận số ổn định'}</p>
                      <p class="text-[11px] text-stone-400">{d.opportunity}</p>
                    </div>
                  {/each}
                </div>
              </div>
            {:else if activeTab === 'heaven'}
              <div class="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <div class="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
                  <Sun size={18} /> {synthesis.heavenAspect.title}
                </div>
                <p class="text-sm text-stone-300 leading-relaxed">
                  {synthesis.heavenAspect.detail}
                </p>
                <div class="flex flex-wrap gap-2 pt-2">
                  {#each synthesis.heavenAspect.starsSummary as star (star)}
                    <span class="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-semibold">
                      {star}
                    </span>
                  {/each}
                </div>
              </div>
            {:else if activeTab === 'earth'}
              <div class="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <div class="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
                  <Compass size={18} /> {synthesis.earthAspect.title}
                </div>
                <p class="text-sm text-stone-300 leading-relaxed">
                  {synthesis.earthAspect.detail}
                </p>
                <div class="flex flex-wrap gap-2 pt-2">
                  {#each synthesis.earthAspect.elementsSummary as el (el)}
                    <span class="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-semibold">
                      {el}
                    </span>
                  {/each}
                </div>
              </div>
            {:else if activeTab === 'human'}
              <div class="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <div class="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-wider">
                  <ShieldCheck size={18} /> {synthesis.humanAspect.title}
                </div>
                <p class="text-sm text-stone-300 leading-relaxed">
                  {synthesis.humanAspect.detail}
                </p>
                <div class="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 text-blue-200 text-xs font-medium">
                  {synthesis.humanAspect.lifePathSummary}
                </div>
              </div>
            {:else if activeTab === 'strategy'}
              <div class="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-5">
                <div class="space-y-2">
                  <h4 class="font-serif text-base font-bold text-amber-200">
                    Thời Điểm Vàng & Khí Lực Tương Trợ
                  </h4>
                  <p class="text-xs text-stone-300 bg-stone-950 p-3 rounded-xl border border-stone-800">
                    {synthesis.actionableStrategy.strategicTiming}
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Do List -->
                  <div class="p-4 rounded-xl bg-emerald-950/15 border border-emerald-500/30 space-y-2">
                    <h5 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Nên Làm (Khai Vận)
                    </h5>
                    <ul class="space-y-1.5 text-xs text-stone-300">
                      {#each synthesis.actionableStrategy.doList as item (item)}
                        <li class="flex items-start gap-1.5">
                          <span class="text-emerald-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>

                  <!-- Dont List -->
                  <div class="p-4 rounded-xl bg-rose-950/15 border border-rose-500/30 space-y-2">
                    <h5 class="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle size={14} /> Nên Tránh (Hạn Chế Rủi Ro)
                    </h5>
                    <ul class="space-y-1.5 text-xs text-stone-300">
                      {#each synthesis.actionableStrategy.dontList as item (item)}
                        <li class="flex items-start gap-1.5">
                          <span class="text-rose-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                </div>

                <!-- Auspicious Elements -->
                <div class="flex flex-wrap gap-2 pt-1">
                  {#each synthesis.actionableStrategy.auspiciousElements as el (el)}
                    <span class="px-2.5 py-1 rounded-md bg-stone-800 text-stone-300 text-xs">
                      {el}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer Actions -->
    <div class="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
      <p class="text-[11px] text-stone-400">
        Khâm Thiên Giám Ngự Bút • Bản quyền thuật số thuộc về ViOS
      </p>
      {#if synthesis}
        <button
          onclick={() => {
            onClose();
            if (onOpenShareModal) onOpenShareModal();
          }}
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors shadow-md shadow-amber-500/10"
        >
          <Share2 size={14} /> Chia Sẻ Đại Bản Luận Giải
        </button>
      {/if}
    </div>
  </div>
</div>
