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
    Headphones,
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
  import { audioAdvisor } from '$lib/features/audio/audio-advisor.svelte';

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

  function handlePlaySynthesisAudio() {
    if (!synthesis) return;
    let textToRead = '';
    if (activeTab === 'overview') {
      textToRead = `Sấm Truyền Khâm Thiên Giám: ${synthesis.summary}. Điểm đồng thuận tam môn phái: ${synthesis.consensusScore} phần trăm. `;
      for (const d of synthesis.disciplines) {
        textToRead += `${d.discipline}: ${d.keyFindings.join('. ')}. `;
      }
    } else if (activeTab === 'heaven') {
      textToRead = `${synthesis.heavenAspect.title}: ${synthesis.heavenAspect.detail}. Các sao chủ tọa: ${synthesis.heavenAspect.starsSummary.join(', ')}.`;
    } else if (activeTab === 'earth') {
      textToRead = `${synthesis.earthAspect.title}: ${synthesis.earthAspect.detail}. Ngũ hành tứ trụ: ${synthesis.earthAspect.elementsSummary.join(', ')}.`;
    } else if (activeTab === 'human') {
      textToRead = `${synthesis.humanAspect.title}: ${synthesis.humanAspect.detail}. Tóm lược số đạo: ${synthesis.humanAspect.lifePathSummary}.`;
    } else {
      textToRead = `Chiến Lược Cải Vận Hoàng Gia: Thời cơ chiến lược: ${synthesis.actionableStrategy.strategicTiming}. Việc nên làm: ${synthesis.actionableStrategy.doList.join('. ')}. Việc nên tránh: ${synthesis.actionableStrategy.dontList.join('. ')}. Ngũ hành cát lợi: ${synthesis.actionableStrategy.auspiciousElements.join(', ')}.`;
    }
    audioAdvisor.play(textToRead, `Luận Giải Tam Hợp • ${chartTitle}`);
    toast.show('🎧 Đang phát giọng đọc Thính Luận Hoàng Triều...', 'success');
  }
</script>

<div
  class="synthesis-modal-backdrop"
  role="dialog"
  aria-modal="true"
  aria-labelledby="synthesis-modal-title"
  tabindex="-1"
  onkeydown={(e) => {
    if (e.key === 'Escape') onClose();
  }}
>
  <div class="synthesis-modal-card">
    <!-- Header Hoàng Gia -->
    <div class="synthesis-modal-header">
      <div class="header-brand">
        <div class="header-icon-box">
          <Sparkles size={22} />
        </div>
        <div>
          <div class="header-royal-tag">
            Khâm Thiên Giám Ngự Chế • Đỉnh Cao ViOS • tuvitoantap.online
          </div>
          <h3 id="synthesis-modal-title" class="header-title">
            Đại Bản Luận Giải Tổng Hợp Tam Hợp • {chartTitle}
          </h3>
        </div>
      </div>
      <button
        onclick={onClose}
        class="btn-close-modal"
        aria-label="Đóng"
      >
        <X size={20} />
      </button>
    </div>

    <!-- Content Area -->
    <div class="synthesis-modal-body">
      {#if isLoading}
        <div class="loading-box">
          <Loader2 size={36} class="spinner-gold animate-spin" />
          <p class="loading-text">Đang tra cứu dữ liệu Khâm Thiên Giám...</p>
        </div>
      {:else if !synthesis}
        <!-- Màn hình Giới thiệu & Khởi tạo (Paywall Gate) -->
        <div class="gate-intro-box">
          <div class="gate-hero-card">
            <div class="gate-badge">
              <Sparkles size={14} /> Tích Hợp Đa Môn Phái Đầu Tiên Tại Việt Nam
            </div>
            <h2 class="gate-title">
              Khai Mở Toàn Cảnh Vận Mệnh Cùng Hội Đồng Chiêm Tinh
            </h2>
            <p class="gate-desc">
              Không chỉ dừng lại ở một góc nhìn đơn lẻ. Bản luận giải tổng hợp hội tụ sức mạnh của:
              <strong class="text-amber">Tử Vi Đẩu Số</strong> (Định vị chân mệnh thiên bàn),
              <strong class="text-emerald">Bát Tự Hà Lạc</strong> (Cân bằng ngũ hành tứ trụ) và
              <strong class="text-blue">Thần Số Học Pythagoras</strong> (Sóng rung số đạo & nhân tâm).
            </p>

            <!-- 3 Khối so sánh -->
            <div class="disciplines-grid">
              <div class="discipline-card card-heaven">
                <div class="discipline-label label-heaven">
                  <Sun size={16} /> Thiên Đạo (Tử Vi)
                </div>
                <p class="discipline-desc">
                  Làm sáng tỏ căn cơ nghiệp quả, thời cơ đại vận và trục Tài - Quan - Cung Mệnh.
                </p>
              </div>
              <div class="discipline-card card-earth">
                <div class="discipline-label label-earth">
                  <Compass size={16} /> Địa Đạo (Bát Tự)
                </div>
                <p class="discipline-desc">
                  Phân tích vượng suy ngũ hành, can chi và tìm ra Dụng Thần cứu trợ sinh khắc.
                </p>
              </div>
              <div class="discipline-card card-human">
                <div class="discipline-label label-human">
                  <ShieldCheck size={16} /> Nhân Đạo (Thần Số)
                </div>
                <p class="discipline-desc">
                  Khai mở số chủ đạo, 4 đỉnh cao kim tự tháp và năng lượng hành động thực tế.
                </p>
              </div>
            </div>
          </div>

          <!-- Lựa chọn lĩnh vực trọng tâm -->
          <div class="focus-section">
            <div class="focus-title">
              Lĩnh Vực Bạn Muốn Đào Sâu Trọng Tâm:
            </div>
            <div class="focus-btn-wrap">
              <button
                type="button"
                onclick={() => toggleFocus('career')}
                class="focus-btn"
                class:active={selectedFocus.includes('career')}
              >
                Công Danh & Sự Nghiệp
              </button>
              <button
                type="button"
                onclick={() => toggleFocus('wealth')}
                class="focus-btn"
                class:active={selectedFocus.includes('wealth')}
              >
                Tài Bạch & Làm Ăn
              </button>
              <button
                type="button"
                onclick={() => toggleFocus('relationship')}
                class="focus-btn"
                class:active={selectedFocus.includes('relationship')}
              >
                Tình Duyên & Gia Đạo
              </button>
              <button
                type="button"
                onclick={() => toggleFocus('health')}
                class="focus-btn"
                class:active={selectedFocus.includes('health')}
              >
                Sức Khỏe & Bình An
              </button>
            </div>
          </div>

          <!-- CTA Box -->
          <div class="gate-cta-card">
            <div class="cta-left">
              <div class="cta-balance">
                <span>Số dư hiện tại của bạn:</span>
                <span class="balance-badge">
                  <Coins size={15} /> {userXu} XU
                </span>
              </div>
              <p class="cta-price-desc">
                Phí khai mở: <strong class="text-amber">15 XU</strong> (Lưu vĩnh viễn, xem lại miễn phí trọn đời).
              </p>
            </div>

            <button
              onclick={handleStartSynthesis}
              disabled={isGenerating}
              class="btn-start-synthesis"
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
        <div class="synthesis-result-layout">
          <!-- Radar Điểm Đồng Thuận -->
          <SynthesisScoreRadar score={synthesis.consensusScore} />

          <!-- Thanh điều hướng Tab -->
          <div class="synthesis-tabs-nav">
            <button
              class="tab-nav-btn"
              class:active={activeTab === 'overview'}
              onclick={() => (activeTab = 'overview')}
            >
              Tổng Quan & Sấm Truyền
            </button>
            <button
              class="tab-nav-btn"
              class:active={activeTab === 'heaven'}
              onclick={() => (activeTab = 'heaven')}
            >
              Thiên Đạo (Tử Vi)
            </button>
            <button
              class="tab-nav-btn"
              class:active={activeTab === 'earth'}
              onclick={() => (activeTab = 'earth')}
            >
              Địa Đạo (Bát Tự)
            </button>
            <button
              class="tab-nav-btn"
              class:active={activeTab === 'human'}
              onclick={() => (activeTab = 'human')}
            >
              Nhân Đạo (Thần Số)
            </button>
            <button
              class="tab-nav-btn"
              class:active={activeTab === 'strategy'}
              onclick={() => (activeTab = 'strategy')}
            >
              Chiến Lược Hành Động
            </button>
          </div>

          <!-- Tab Content -->
          <div class="tab-content-area">
            {#if activeTab === 'overview'}
              <div class="overview-box">
                <h4 class="overview-heading">
                  <Sparkles size={18} class="accent-icon" /> Sấm Truyền Khâm Thiên Giám
                </h4>
                <p class="overview-summary-quote">
                  "{synthesis.summary}"
                </p>

                <div class="disciplines-result-grid">
                  {#each synthesis.disciplines as d (d.discipline)}
                    <div class="discipline-result-card">
                      <span class="disc-title">{d.title}</span>
                      <p class="disc-finding">{d.keyFindings[0] || 'Vận số ổn định'}</p>
                      <p class="disc-opportunity">{d.opportunity}</p>
                    </div>
                  {/each}
                </div>
              </div>
            {:else if activeTab === 'heaven'}
              <div class="aspect-card aspect-heaven">
                <div class="aspect-heading text-amber">
                  <Sun size={18} /> {synthesis.heavenAspect.title}
                </div>
                <p class="aspect-detail">
                  {synthesis.heavenAspect.detail}
                </p>
                <div class="stars-tag-wrap">
                  {#each synthesis.heavenAspect.starsSummary as star (star)}
                    <span class="star-pill">
                      {star}
                    </span>
                  {/each}
                </div>
              </div>
            {:else if activeTab === 'earth'}
              <div class="aspect-card aspect-earth">
                <div class="aspect-heading text-emerald">
                  <Compass size={18} /> {synthesis.earthAspect.title}
                </div>
                <p class="aspect-detail">
                  {synthesis.earthAspect.detail}
                </p>
                <div class="stars-tag-wrap">
                  {#each synthesis.earthAspect.elementsSummary as el (el)}
                    <span class="element-pill">
                      {el}
                    </span>
                  {/each}
                </div>
              </div>
            {:else if activeTab === 'human'}
              <div class="aspect-card aspect-human">
                <div class="aspect-heading text-blue">
                  <ShieldCheck size={18} /> {synthesis.humanAspect.title}
                </div>
                <p class="aspect-detail">
                  {synthesis.humanAspect.detail}
                </p>
                <div class="lifepath-box">
                  {synthesis.humanAspect.lifePathSummary}
                </div>
              </div>
            {:else if activeTab === 'strategy'}
              <div class="strategy-card">
                <div class="strategy-timing-box">
                  <h4 class="strategy-timing-title">
                    Thời Điểm Vàng & Khí Lực Tương Trợ
                  </h4>
                  <p class="strategy-timing-text">
                    {synthesis.actionableStrategy.strategicTiming}
                  </p>
                </div>

                <div class="do-dont-grid">
                  <!-- Do List -->
                  <div class="do-box">
                    <h5 class="do-title">
                      <CheckCircle2 size={14} /> Nên Làm (Khai Vận)
                    </h5>
                    <ul class="action-list">
                      {#each synthesis.actionableStrategy.doList as item (item)}
                        <li>
                          <span class="dot-green">•</span>
                          <span>{item}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>

                  <!-- Dont List -->
                  <div class="dont-box">
                    <h5 class="dont-title">
                      <AlertCircle size={14} /> Nên Tránh (Hạn Chế Rủi Ro)
                    </h5>
                    <ul class="action-list">
                      {#each synthesis.actionableStrategy.dontList as item (item)}
                        <li>
                          <span class="dot-red">•</span>
                          <span>{item}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                </div>

                <!-- Auspicious Elements -->
                <div class="auspicious-wrap">
                  {#each synthesis.actionableStrategy.auspiciousElements as el (el)}
                    <span class="auspicious-pill">
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
    <div class="synthesis-modal-footer">
      <p class="footer-copyright">
        Khâm Thiên Giám Ngự Bút • tuvitoantap.online • Bản quyền thuật số thuộc về ViOS
      </p>
      {#if synthesis}
        <div class="footer-btn-group">
          <button
            onclick={handlePlaySynthesisAudio}
            class="btn-audio"
            title="Lắng nghe giọng đọc truyền cảm kết hợp âm thanh thiền định"
          >
            <Headphones size={14} class="accent-icon" /> Thính Luận Hoàng Triều
          </button>

          <button
            onclick={() => {
              onClose();
              if (onOpenShareModal) onOpenShareModal();
            }}
            class="btn-share-synthesis"
          >
            <Share2 size={14} /> Chia Sẻ Đại Bản Luận Giải
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .synthesis-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(4, 3, 2, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #f3f4f6;
  }

  .synthesis-modal-card {
    position: relative;
    width: 100%;
    max-width: 860px;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    background: #0d0a07;
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 16px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(212, 175, 55, 0.15);
    overflow: hidden;
  }

  .synthesis-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.25);
    background: linear-gradient(90deg, #1f180e 0%, #0d0a07 100%);
  }

  .header-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-icon-box {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffd700;
  }

  .header-royal-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: rgba(212, 175, 55, 0.15);
    color: #fde047;
    border: 1px solid rgba(212, 175, 55, 0.3);
    margin-bottom: 4px;
  }

  .header-title {
    margin: 0;
    font-family: var(--font-serif, serif);
    font-size: 1.15rem;
    font-weight: 700;
    color: #fef3c7;
  }

  .btn-close-modal {
    background: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .btn-close-modal:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }

  .synthesis-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .loading-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    gap: 12px;
  }

  .loading-text {
    font-size: 0.85rem;
    color: #9ca3af;
  }

  :global(.spinner-gold) {
    color: #ffd700;
  }

  .gate-intro-box {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .gate-hero-card {
    padding: 24px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(28, 20, 10, 0.8) 0%, rgba(12, 10, 8, 0.9) 100%);
    border: 1px solid rgba(212, 175, 55, 0.3);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  .gate-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 999px;
    background: rgba(212, 175, 55, 0.18);
    color: #ffd700;
    font-size: 0.72rem;
    font-weight: 700;
    border: 1px solid rgba(212, 175, 55, 0.4);
  }

  .gate-title {
    margin: 0;
    font-family: var(--font-serif, serif);
    font-size: 1.3rem;
    font-weight: 700;
    color: #fde047;
  }

  .gate-desc {
    margin: 0;
    font-size: 0.85rem;
    color: #d1d5db;
    max-width: 650px;
    line-height: 1.6;
  }

  .text-amber { color: #f59e0b; }
  .text-emerald { color: #10b981; }
  .text-blue { color: #60a5fa; }

  .disciplines-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    width: 100%;
    margin-top: 6px;
    text-align: left;
  }

  .discipline-card {
    padding: 14px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .discipline-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .label-heaven { color: #fbbf24; }
  .label-earth { color: #34d399; }
  .label-human { color: #60a5fa; }

  .discipline-desc {
    margin: 0;
    font-size: 0.72rem;
    color: #9ca3af;
    line-height: 1.5;
  }

  .focus-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .focus-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #d1d5db;
  }

  .focus-btn-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .focus-btn {
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: #9ca3af;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .focus-btn.active {
    background: rgba(212, 175, 55, 0.18);
    border-color: #ffd700;
    color: #ffd700;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
  }

  .gate-cta-card {
    padding: 16px 20px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(212, 175, 55, 0.3);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .cta-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .cta-balance {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: #d1d5db;
  }

  .balance-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 800;
    color: #ffd700;
  }

  .cta-price-desc {
    margin: 0;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .btn-start-synthesis {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 10px;
    background: linear-gradient(135deg, #d4af37, #b45309);
    border: 1px solid #ffd700;
    color: #17120a;
    font-family: var(--font-serif, serif);
    font-size: 0.9rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(212, 175, 55, 0.3);
    transition: filter 0.2s;
  }

  .btn-start-synthesis:hover:not(:disabled) { filter: brightness(1.1); }
  .btn-start-synthesis:disabled { opacity: 0.5; cursor: not-allowed; }

  .synthesis-result-layout {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .synthesis-tabs-nav {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    overflow-x: auto;
    padding-bottom: 6px;
  }

  .tab-nav-btn {
    padding: 8px 14px;
    border-radius: 8px;
    background: transparent;
    border: 1px solid transparent;
    color: #9ca3af;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .tab-nav-btn.active {
    background: rgba(212, 175, 55, 0.18);
    border-color: rgba(212, 175, 55, 0.4);
    color: #ffd700;
  }

  .tab-content-area {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .overview-box {
    padding: 20px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(212, 175, 55, 0.25);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .overview-heading {
    margin: 0;
    font-family: var(--font-serif, serif);
    font-size: 1.1rem;
    font-weight: 700;
    color: #ffd700;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .overview-summary-quote {
    margin: 0;
    font-size: 0.85rem;
    color: #f3f4f6;
    font-style: italic;
    line-height: 1.6;
    border-left: 3px solid #d4af37;
    padding-left: 14px;
  }

  .disciplines-result-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 4px;
  }

  .discipline-result-card {
    padding: 12px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .disc-title { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; color: #ffd700; }
  .disc-finding { margin: 0; font-size: 0.78rem; font-weight: 600; color: #e5e7eb; }
  .disc-opportunity { margin: 0; font-size: 0.7rem; color: #9ca3af; }

  .aspect-card {
    padding: 20px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .aspect-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .aspect-detail {
    margin: 0;
    font-size: 0.85rem;
    color: #e5e7eb;
    line-height: 1.6;
  }

  .stars-tag-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .star-pill {
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #fde047;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .element-pill {
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #6ee7b7;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .lifepath-box {
    padding: 12px;
    border-radius: 8px;
    background: rgba(30, 58, 138, 0.2);
    border: 1px solid rgba(96, 165, 250, 0.3);
    color: #bfdbfe;
    font-size: 0.78rem;
    font-weight: 500;
  }

  .strategy-card {
    padding: 20px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(212, 175, 55, 0.25);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .strategy-timing-box {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .strategy-timing-title {
    margin: 0;
    font-family: var(--font-serif, serif);
    font-size: 1rem;
    font-weight: 700;
    color: #fde047;
  }

  .strategy-timing-text {
    margin: 0;
    font-size: 0.78rem;
    color: #d1d5db;
    background: rgba(0, 0, 0, 0.4);
    padding: 10px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .do-dont-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  .do-box {
    padding: 14px;
    border-radius: 10px;
    background: rgba(6, 78, 59, 0.2);
    border: 1px solid rgba(52, 211, 153, 0.3);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .do-title {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #34d399;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dont-box {
    padding: 14px;
    border-radius: 10px;
    background: rgba(136, 19, 55, 0.2);
    border: 1px solid rgba(244, 63, 94, 0.3);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dont-title {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #fb7185;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .action-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.75rem;
    color: #d1d5db;
  }

  .action-list li {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }

  .dot-green { color: #34d399; font-weight: bold; }
  .dot-red { color: #fb7185; font-weight: bold; }

  .auspicious-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .auspicious-pill {
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.06);
    color: #e5e7eb;
    font-size: 0.75rem;
  }

  .synthesis-modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-top: 1px solid rgba(212, 175, 55, 0.2);
    background: #090705;
    flex-wrap: wrap;
    gap: 10px;
  }

  .footer-copyright {
    margin: 0;
    font-size: 0.7rem;
    color: #9ca3af;
  }

  .footer-btn-group {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .btn-audio {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 8px;
    background: rgba(88, 28, 135, 0.4);
    border: 1px solid rgba(168, 85, 247, 0.3);
    color: #e9d5ff;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-audio:hover { background: rgba(88, 28, 135, 0.6); }

  .btn-share-synthesis {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    background: linear-gradient(135deg, #d4af37, #b45309);
    border: 1px solid #ffd700;
    color: #17120a;
    font-size: 0.78rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
    transition: filter 0.2s;
  }

  .btn-share-synthesis:hover { filter: brightness(1.1); }

  @media (max-width: 640px) {
    .disciplines-grid, .disciplines-result-grid, .do-dont-grid {
      grid-template-columns: 1fr;
    }
    .header-title { font-size: 1rem; }
  }
</style>
