<script lang="ts">
  import type {
    AstrologicalJournalEntry,
    AstrologicalJournalListResponse,
    JournalMood,
  } from '@ziweiai/contracts';

  interface Props {
    token?: string;
    open: boolean;
    onClose: () => void;
  }

  let { token, open, onClose }: Props = $props();

  // Form state
  let selectedDate = $state(new Date().toISOString().slice(0, 10));
  let selectedMood = $state<JournalMood>('BINH_AN');
  let eventNotes = $state('');
  let actualRating = $state(4);
  let isSubmitting = $state(false);
  let submitSuccess = $state(false);

  // Result & list state
  let latestResult = $state<AstrologicalJournalEntry | null>(null);
  let journalList = $state<AstrologicalJournalListResponse | null>(null);

  const MOOD_OPTIONS: { key: JournalMood; label: string; icon: string; desc: string }[] = [
    { key: 'HAN_HOAN', label: 'Hân Hoan', icon: '🌟', desc: 'Phấn chấn, tự tin, đón nhận cát khí' },
    { key: 'BINH_AN', label: 'Bình An', icon: '🕊️', desc: 'Tĩnh tại, an hòa, thuận ứng tự nhiên' },
    { key: 'LO_AU', label: 'Lo Âu', icon: '🌧️', desc: 'Bất an, hoài nghi, nhiều băn khoăn' },
    { key: 'MET_MOI', label: 'Mệt Mỏi', icon: '☕', desc: 'Uể oải, cạn năng lượng, cần nghỉ ngơi' },
    { key: 'CANG_THANG', label: 'Căng Thẳng', icon: '⚡', desc: 'Bức bối, áp lực, dễ va chạm' },
  ];

  $effect(() => {
    if (open) {
      loadEntries();
    }
  });

  async function loadEntries() {
    if (!token) return;
    try {
      const res = await fetch('/api/journal/entries', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        journalList = (await res.json()) as AstrologicalJournalListResponse;
      }
    } catch {
      // Fallback im lặng nếu lỗi mạng
    }
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!token) {
      alert('Vui lòng đăng nhập để lưu nhật ký vận mệnh của bạn.');
      return;
    }

    isSubmitting = true;
    submitSuccess = false;

    try {
      const res = await fetch('/api/journal/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedDate,
          mood: selectedMood,
          eventNotes: eventNotes.trim() || 'Chiêm nghiệm ngày thường nhật.',
          actualRating,
        }),
      });

      if (res.ok) {
        const saved = (await res.json()) as AstrologicalJournalEntry;
        latestResult = saved;
        submitSuccess = true;
        loadEntries();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Không thể lưu nhật ký, vui lòng thử lại.');
      }
    } catch {
      alert('Lỗi kết nối mạng.');
    } finally {
      isSubmitting = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    role="dialog"
    aria-modal="true"
    aria-labelledby="journal-modal-title"
  >
    <div
      class="relative w-full max-w-2xl bg-neutral-900/95 border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-950/40 overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 bg-gradient-to-r from-amber-950/70 via-neutral-900 to-amber-950/70 border-b border-amber-500/30 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-neutral-950 text-xl font-bold shadow-lg shadow-amber-500/20"
          >
            📔
          </div>
          <div>
            <h2
              id="journal-modal-title"
              class="text-lg font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent font-serif"
            >
              Nhật Ký Vận Mệnh ViOS
            </h2>
            <p class="text-xs text-neutral-400">
              Chiêm nghiệm thực tế & Đo lường chỉ số cộng hưởng năng lượng
            </p>
          </div>
        </div>

        <button
          type="button"
          onclick={onClose}
          class="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          aria-label="Đóng nhật ký"
        >
          ✕
        </button>
      </div>

      <!-- Streak & Stats Banner (nếu có) -->
      {#if journalList}
        <div class="px-6 py-2.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-around text-xs">
          <div class="flex items-center gap-1.5 text-neutral-300">
            <span>🔥 Chuỗi chiêm nghiệm:</span>
            <span class="font-bold text-amber-400">{journalList.currentStreakDays} ngày</span>
          </div>
          <div class="h-3 w-px bg-neutral-800"></div>
          <div class="flex items-center gap-1.5 text-neutral-300">
            <span>⚡ Hòa hợp trung bình:</span>
            <span class="font-bold text-emerald-400">{journalList.averageResonanceScore}%</span>
          </div>
          <div class="h-3 w-px bg-neutral-800"></div>
          <div class="flex items-center gap-1.5 text-neutral-300">
            <span>📝 Tổng số bài:</span>
            <span class="font-bold text-purple-400">{journalList.totalEntriesCount}</span>
          </div>
        </div>
      {/if}

      <!-- Form & Results -->
      <div class="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
        {#if latestResult && submitSuccess}
          <!-- Thẻ kết quả phân tích Resonance Score -->
          <div class="p-4 rounded-xl bg-gradient-to-br from-amber-950/40 via-neutral-900 to-purple-950/40 border border-amber-500/40 animate-fade-in space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-2xl">✨</span>
                <span class="font-bold text-amber-300">Chỉ Số Cộng Hưởng Năng Lượng</span>
              </div>
              <div class="text-xl font-extrabold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30">
                {latestResult.resonanceScore}%
              </div>
            </div>

            <p class="text-xs text-neutral-200 leading-relaxed italic bg-neutral-950/60 p-3 rounded-lg border border-neutral-800">
              "{latestResult.resonanceInsight}"
            </p>

            <button
              type="button"
              onclick={() => { submitSuccess = false; }}
              class="w-full py-1.5 text-xs text-amber-400 hover:text-amber-300 underline font-medium"
            >
              + Viết thêm hoặc sửa ngày khác
            </button>
          </div>
        {/if}

        <form onsubmit={handleSubmit} class="space-y-4">
          <!-- Ngày chiêm nghiệm -->
          <div>
            <label for="journal-date" class="block text-xs font-semibold text-neutral-300 mb-1">
              📅 Ngày Chiêm Nghiệm
            </label>
            <input
              id="journal-date"
              type="date"
              bind:value={selectedDate}
              class="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <!-- Tâm trạng (Mood Selector) -->
          <div>
            <span class="block text-xs font-semibold text-neutral-300 mb-2">
              🎭 Tâm Thế & Trường Năng Lượng Thực Tế
            </span>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {#each MOOD_OPTIONS as opt (opt.key)}
                <button
                  type="button"
                  onclick={() => selectedMood = opt.key}
                  class="p-2.5 rounded-xl border text-left transition flex flex-col gap-1 {selectedMood === opt.key ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-950/50' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'}"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="text-base">{opt.icon}</span>
                    <span class="text-xs font-bold">{opt.label}</span>
                  </div>
                  <span class="text-[10px] text-neutral-400 line-clamp-1">{opt.desc}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- Ghi chú sự kiện trong ngày -->
          <div>
            <label for="journal-notes" class="block text-xs font-semibold text-neutral-300 mb-1">
              ✍️ Nhật Ký Sự Kiện (Công việc, tiền bạc, cảm xúc...)
            </label>
            <textarea
              id="journal-notes"
              bind:value={eventNotes}
              rows="3"
              placeholder="Hôm nay có biến cố hay cơ duyên gì nổi bật? Hãy ghi lại để nghiệm lý..."
              class="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs focus:border-amber-500 focus:outline-none resize-none"
            ></textarea>
          </div>

          <!-- Đánh giá mức độ cát hung (1 - 5 sao) -->
          <div>
            <span class="block text-xs font-semibold text-neutral-300 mb-1.5">
              ⭐ Tự Đánh Giá Mức Độ Hanh Thông (1 = Trắc trở, 5 = Đại cát)
            </span>
            <div class="flex items-center gap-2">
              {#each [1, 2, 3, 4, 5] as star (star)}
                <button
                  type="button"
                  onclick={() => actualRating = star}
                  class="text-2xl transition hover:scale-110 active:scale-95"
                  title="{star} sao"
                >
                  {#if star <= actualRating}
                    <span class="text-amber-400">★</span>
                  {:else}
                    <span class="text-neutral-700">☆</span>
                  {/if}
                </button>
              {/each}
              <span class="text-xs font-semibold text-amber-300 ml-2">
                {actualRating === 5 ? 'Đại Cát Hanh Thông' : actualRating === 4 ? 'Khá Thuận Lợi' : actualRating === 3 ? 'Bình Hòa' : actualRating === 2 ? 'Có Chút Khó Khăn' : 'Nhiều Thử Thách'}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-950/50 transition active:scale-98 disabled:opacity-50"
          >
            {#if isSubmitting}
              Đang phân tích chỉ số cộng hưởng...
            {:else}
              Lưu Nhật Ký & Đo Lường Khí Vận
            {/if}
          </button>
        </form>

        <!-- Lịch sử các ngày gần đây -->
        {#if journalList && journalList.entries.length > 0}
          <div class="pt-4 border-t border-neutral-800 space-y-2.5">
            <h3 class="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
              📜 Lịch Sử Chiêm Nghiệm Gần Đây
            </h3>
            <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
              {#each journalList.entries.slice(0, 5) as item (item.id)}
                <div class="p-3 rounded-lg bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-neutral-200">{item.date}</span>
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                        {item.mood}
                      </span>
                    </div>
                    <p class="text-neutral-400 text-[11px] mt-1 line-clamp-1">{item.eventNotes}</p>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-emerald-400">{item.resonanceScore}%</div>
                    <div class="text-[10px] text-neutral-500">Hòa hợp</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
