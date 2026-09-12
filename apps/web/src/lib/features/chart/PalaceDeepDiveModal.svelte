<script lang="ts">
  import type { PalaceView } from './palace-view-builder';
  import { analyzePalace360 } from './palace-deep-dive-analyzer';
  import { audioAdvisor } from '../audio/audio-advisor.svelte';

  interface Props {
    palace: PalaceView | null;
    allPalaces: PalaceView[];
    open: boolean;
    onClose: () => void;
  }

  let { palace, allPalaces, open, onClose }: Props = $props();

  let activeTab = $state<'overview' | 'aspects' | 'remedy'>('overview');

  const analysis = $derived(
    palace && allPalaces.length > 0 ? analyzePalace360(palace, allPalaces) : null,
  );

  function handlePlayAudio() {
    if (!analysis) return;
    audioAdvisor.playText(
      analysis.audioNarrativeScript,
      `Thính Luận: Cung ${analysis.palaceNameVi}`,
    );
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open && palace && analysis}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    role="dialog"
    aria-modal="true"
    aria-labelledby="palace-deepdive-title"
  >
    <div
      class="relative w-full max-w-2xl bg-neutral-900/95 border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-950/40 overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Header Hoàng Gia -->
      <div
        class="px-6 py-4 bg-gradient-to-r from-amber-950/60 via-neutral-900 to-amber-950/60 border-b border-amber-500/30 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-neutral-950 font-bold text-lg shadow-lg shadow-amber-500/20"
          >
            🏛️
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2
                id="palace-deepdive-title"
                class="text-xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent font-serif"
              >
                Cung {analysis.palaceNameVi}
              </h2>
              <span
                class="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30"
              >
                {analysis.heavenlyStem}
              </span>
              {#if analysis.isBodyPalace}
                <span
                  class="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30"
                >
                  Thân Cung
                </span>
              {/if}
            </div>
            <p class="text-xs text-neutral-400 mt-0.5">
              Khám phá năng lượng vi tế 360° & Tam Phương Tứ Chính
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Nút Nghe Thính Luận Audio -->
          <button
            type="button"
            onclick={handlePlayAudio}
            class="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-semibold rounded-lg text-xs shadow transition active:scale-95"
            title="Nghe Thính Luận Cung Vị bằng AI Voice & Chuông Solfeggio 432Hz"
          >
            <span>🎧</span>
            <span>Thính Luận</span>
          </button>

          <!-- Nút Đóng -->
          <button
            type="button"
            onclick={onClose}
            class="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
            aria-label="Đóng modal"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Thước đo Vượng Khí & Điều Hướng Tab -->
      <div class="px-6 pt-4 pb-2 bg-neutral-950/60 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <!-- Điểm Vượng Khí -->
        <div class="flex items-center gap-3">
          <span class="text-xs text-neutral-400">Vượng Khí Bản Cung:</span>
          <div class="flex items-center gap-2">
            <div class="w-32 h-2.5 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
              <div
                class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                style="width: {analysis.vigorScore}%"
              ></div>
            </div>
            <span class="text-xs font-bold text-amber-400">{analysis.vigorScore}/100</span>
          </div>
        </div>

        <!-- Tab chuyển đổi -->
        <div class="flex rounded-lg bg-neutral-900 p-1 border border-neutral-800 text-xs">
          <button
            type="button"
            class="px-3 py-1 rounded-md transition {activeTab === 'overview' ? 'bg-amber-500/20 text-amber-300 font-semibold shadow' : 'text-neutral-400 hover:text-neutral-200'}"
            onclick={() => activeTab = 'overview'}
          >
            Chính Cung
          </button>
          <button
            type="button"
            class="px-3 py-1 rounded-md transition {activeTab === 'aspects' ? 'bg-amber-500/20 text-amber-300 font-semibold shadow' : 'text-neutral-400 hover:text-neutral-200'}"
            onclick={() => activeTab = 'aspects'}
          >
            Tam Phương Tứ Chính
          </button>
          <button
            type="button"
            class="px-3 py-1 rounded-md transition {activeTab === 'remedy' ? 'bg-amber-500/20 text-amber-300 font-semibold shadow' : 'text-neutral-400 hover:text-neutral-200'}"
            onclick={() => activeTab = 'remedy'}
          >
            Phong Thủy Cải Vận
          </button>
        </div>
      </div>

      <!-- Nội dung Tab cuộn độc lập -->
      <div class="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
        {#if activeTab === 'overview'}
          <!-- TAB 1: CHÍNH CUNG -->
          <div class="space-y-4">
            <!-- Chính tinh -->
            <div class="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <h3 class="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-2.5 flex items-center gap-1.5">
                <span>⭐</span> Chính Diệu Tọa Thủ
              </h3>
              {#if palace.majorStars.length > 0}
                <div class="flex flex-wrap gap-2">
                  {#each palace.majorStars as star (star.key)}
                    <div class="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center gap-2">
                      <span class="font-bold text-neutral-100">{star.name}</span>
                      {#if star.brightness}
                        <span class="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-medium">
                          {star.brightness}
                        </span>
                      {/if}
                      {#if star.mutagen}
                        <span class="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                          {star.mutagen}
                        </span>
                      {/if}
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-xs text-neutral-400 italic">
                  Cung Vô Chính Diệu (mượn lực từ chính tinh cung Thiên Di xung chiếu).
                </p>
              {/if}
            </div>

            <!-- Tứ Hóa tọa thủ -->
            {#if analysis.mutagensInPalace.length > 0}
              <div class="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30">
                <h3 class="text-xs uppercase tracking-wider text-purple-300 font-semibold mb-2 flex items-center gap-1.5">
                  <span>✨</span> Hóa Khí Hoàng Triều
                </h3>
                <div class="flex flex-wrap gap-2">
                  {#each analysis.mutagensInPalace as mut (mut)}
                    <span class="px-2.5 py-1 rounded bg-purple-900/40 text-purple-200 border border-purple-500/30 text-xs font-semibold">
                      {mut}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Phụ tinh & Tạp diệu -->
            <div class="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <h3 class="text-xs uppercase tracking-wider text-neutral-300 font-semibold mb-2">
                🌟 Quần Tinh Trợ Mệnh & Sát Tinh
              </h3>
              <div class="flex flex-wrap gap-1.5">
                {#each palace.minorStars.concat(palace.adjectiveStars) as star, sIdx (star.key + sIdx)}
                  <span class="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                    {star.name}
                  </span>
                {/each}
              </div>
            </div>
          </div>

        {:else if activeTab === 'aspects'}
          <!-- TAB 2: TAM PHƯƠNG TỨ CHÍNH -->
          <div class="space-y-4">
            <!-- Xung chiếu -->
            <div class="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-xs uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1.5">
                  <span>⚡</span> Cung Đối Xung (180°): Cung {analysis.aspects.opposite.nameVi}
                </h3>
                <span class="text-xs text-neutral-400">{analysis.aspects.opposite.earthlyBranch}</span>
              </div>
              <p class="text-xs text-neutral-300 mb-2">
                Chính tinh chiếu: {analysis.aspects.opposite.mainStars.join(', ') || 'Vô chính diệu'}
              </p>
              <p class="text-xs text-neutral-400 italic">
                Cung đối xung chủ về ngoại cảnh tác động, môi trường đối nhân xử thế và cơ hội khi bước ra xã hội.
              </p>
            </div>

            <!-- Tam hợp -->
            <div class="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <h3 class="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-3 flex items-center gap-1.5">
                <span>📐</span> Hai Cung Tam Hợp (Thế Kiềng Ba Chân)
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div class="font-bold text-amber-300 text-xs mb-1">
                    Cung {analysis.aspects.trine1.nameVi} ({analysis.aspects.trine1.earthlyBranch})
                  </div>
                  <div class="text-xs text-neutral-300">
                    {analysis.aspects.trine1.mainStars.join(', ') || 'Vô chính diệu'}
                  </div>
                </div>
                <div class="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div class="font-bold text-amber-300 text-xs mb-1">
                    Cung {analysis.aspects.trine2.nameVi} ({analysis.aspects.trine2.earthlyBranch})
                  </div>
                  <div class="text-xs text-neutral-300">
                    {analysis.aspects.trine2.mainStars.join(', ') || 'Vô chính diệu'}
                  </div>
                </div>
              </div>
            </div>

            <!-- Cung Giáp -->
            <div class="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <h3 class="text-xs uppercase tracking-wider text-neutral-300 font-semibold mb-2">
                🛡️ Hai Cung Giáp Sườn (Giáp Cung)
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {#each analysis.aspects.flanking as flank (flank.nameKey)}
                  <div class="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                    <span class="font-bold text-neutral-200">Cung {flank.nameVi}</span>: {flank.keyStars.join(', ') || 'Bình hòa'}
                  </div>
                {/each}
              </div>
            </div>
          </div>

        {:else if activeTab === 'remedy'}
          <!-- TAB 3: PHONG THỦY CẢI VẬN -->
          <div class="space-y-4">
            <div class="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
              <h3 class="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-2">
                📜 Định Hướng Khí Vận
              </h3>
              <p class="text-xs text-neutral-200 leading-relaxed">
                {analysis.remedy.energySummary}
              </p>
            </div>

            <!-- Lời khuyên hành động -->
            <div class="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <h3 class="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-2.5 flex items-center gap-1.5">
                <span>🎯</span> Lời Khuyên Hành Động Thực Tiễn
              </h3>
              <ul class="space-y-2 text-xs text-neutral-300">
                {#each analysis.remedy.actionAdvice as advice, aIdx (aIdx)}
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-400 mt-0.5">✔</span>
                    <span>{advice}</span>
                  </li>
                {/each}
              </ul>
            </div>

            <!-- Phong thủy & Ngũ hành -->
            <div class="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <h3 class="text-xs uppercase tracking-wider text-sky-400 font-semibold mb-2.5 flex items-center gap-1.5">
                <span>🧭</span> Phong Thủy & Không Gian Tương Hợp
              </h3>
              <ul class="space-y-2 text-xs text-neutral-300 mb-3">
                {#each analysis.remedy.fengShuiTips as tip, tIdx (tIdx)}
                  <li class="flex items-start gap-2">
                    <span class="text-sky-400 mt-0.5">✦</span>
                    <span>{tip}</span>
                  </li>
                {/each}
              </ul>

              <div class="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80 text-xs">
                <div>
                  <span class="text-neutral-400">Màu sắc cát khí:</span>
                  <div class="font-semibold text-amber-300 mt-0.5">
                    {analysis.remedy.luckyElements.colors.join(', ')}
                  </div>
                </div>
                <div>
                  <span class="text-neutral-400">Phương vị đắc thế:</span>
                  <div class="font-semibold text-amber-300 mt-0.5">
                    {analysis.remedy.luckyElements.directions.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
        <span class="text-xs text-neutral-500">ViOS Astrological Engine 360°</span>
        <button
          type="button"
          onclick={onClose}
          class="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition"
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
{/if}
