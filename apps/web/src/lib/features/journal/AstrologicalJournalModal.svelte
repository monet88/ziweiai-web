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
    class="journal-modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="journal-modal-title"
  >
    <div class="journal-modal-card">
      <!-- Header -->
      <div class="journal-modal-header">
        <div class="header-brand">
          <div class="journal-icon-box">
            📔
          </div>
          <div>
            <h2 id="journal-modal-title" class="journal-title">
              Nhật Ký Vận Mệnh ViOS
            </h2>
            <p class="journal-subtitle">
              Chiêm nghiệm thực tế & Đo lường chỉ số cộng hưởng năng lượng
            </p>
          </div>
        </div>

        <button
          type="button"
          onclick={onClose}
          class="btn-close-modal"
          aria-label="Đóng nhật ký"
        >
          ✕
        </button>
      </div>

      <!-- Streak & Stats Banner (nếu có) -->
      {#if journalList}
        <div class="journal-stats-banner">
          <div class="stat-item">
            <span>🔥 Chuỗi chiêm nghiệm:</span>
            <span class="stat-val-amber">{journalList.currentStreakDays} ngày</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span>⚡ Hòa hợp trung bình:</span>
            <span class="stat-val-emerald">{journalList.averageResonanceScore}%</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span>📝 Tổng số bài:</span>
            <span class="stat-val-purple">{journalList.totalEntriesCount}</span>
          </div>
        </div>
      {/if}

      <!-- Form & Results -->
      <div class="journal-modal-body">
        {#if latestResult && submitSuccess}
          <!-- Thẻ kết quả phân tích Resonance Score -->
          <div class="resonance-result-card">
            <div class="result-header">
              <div class="result-title-wrap">
                <span class="sparkle-icon">✨</span>
                <strong class="result-title">Chỉ Số Cộng Hưởng Năng Lượng</strong>
              </div>
              <div class="result-score-badge">
                {latestResult.resonanceScore}%
              </div>
            </div>

            <p class="result-insight">
              "{latestResult.resonanceInsight}"
            </p>

            <button
              type="button"
              onclick={() => { submitSuccess = false; }}
              class="btn-write-more"
            >
              + Viết thêm hoặc sửa ngày khác
            </button>
          </div>
        {/if}

        <form onsubmit={handleSubmit} class="journal-form">
          <!-- Ngày chiêm nghiệm -->
          <div class="form-group">
            <label for="journal-date" class="form-label">
              📅 Ngày Chiêm Nghiệm
            </label>
            <input
              id="journal-date"
              type="date"
              bind:value={selectedDate}
              class="journal-input"
              required
            />
          </div>

          <!-- Tâm trạng (Mood Selector) -->
          <div class="form-group">
            <span class="form-label">
              🎭 Tâm Thế & Trường Năng Lượng Thực Tế
            </span>
            <div class="mood-grid">
              {#each MOOD_OPTIONS as opt (opt.key)}
                <button
                  type="button"
                  onclick={() => selectedMood = opt.key}
                  class="mood-btn"
                  class:active={selectedMood === opt.key}
                >
                  <div class="mood-header">
                    <span class="mood-icon">{opt.icon}</span>
                    <strong class="mood-label">{opt.label}</strong>
                  </div>
                  <span class="mood-desc">{opt.desc}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- Ghi chú sự kiện trong ngày -->
          <div class="form-group">
            <label for="journal-notes" class="form-label">
              ✍️ Nhật Ký Sự Kiện (Công việc, tiền bạc, cảm xúc...)
            </label>
            <textarea
              id="journal-notes"
              bind:value={eventNotes}
              rows="3"
              placeholder="Hôm nay có biến cố hay cơ duyên gì nổi bật? Hãy ghi lại để nghiệm lý..."
              class="journal-textarea"
            ></textarea>
          </div>

          <!-- Đánh giá mức độ cát hung (1 - 5 sao) -->
          <div class="form-group">
            <span class="form-label">
              ⭐ Tự Đánh Giá Mức Độ Hanh Thông (1 = Trắc trở, 5 = Đại cát)
            </span>
            <div class="rating-bar">
              <div class="stars-wrap">
                {#each [1, 2, 3, 4, 5] as star (star)}
                  <button
                    type="button"
                    onclick={() => actualRating = star}
                    class="star-btn"
                    title="{star} sao"
                  >
                    {#if star <= actualRating}
                      <span class="star-active">★</span>
                    {:else}
                      <span class="star-inactive">☆</span>
                    {/if}
                  </button>
                {/each}
              </div>
              <span class="rating-text">
                {actualRating === 5 ? 'Đại Cát Hanh Thông' : actualRating === 4 ? 'Khá Thuận Lợi' : actualRating === 3 ? 'Bình Hòa' : actualRating === 2 ? 'Có Chút Khó Khăn' : 'Nhiều Thử Thách'}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            class="btn-submit-journal"
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
          <div class="journal-history-section">
            <h3 class="history-title">
              📜 Lịch Sử Chiêm Nghiệm Gần Đây
            </h3>
            <div class="history-list">
              {#each journalList.entries.slice(0, 5) as item (item.id)}
                <div class="history-item">
                  <div>
                    <div class="history-item-header">
                      <strong class="item-date">{item.date}</strong>
                      <span class="item-mood-badge">{item.mood}</span>
                    </div>
                    <p class="item-notes">{item.eventNotes}</p>
                  </div>
                  <div class="item-score-wrap">
                    <strong class="item-score">{item.resonanceScore}%</strong>
                    <span class="item-score-sub">Hòa hợp</span>
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

<style>
  .journal-modal-backdrop {
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

  .journal-modal-card {
    position: relative;
    width: 100%;
    max-width: 660px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    background: #0d0a07;
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 16px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(212, 175, 55, 0.15);
    overflow: hidden;
  }

  .journal-modal-header {
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

  .journal-icon-box {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #d4af37, #92400e);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  .journal-title {
    margin: 0;
    font-family: var(--font-serif, serif);
    font-size: 1.1rem;
    font-weight: 700;
    color: #ffd700;
  }

  .journal-subtitle {
    margin: 2px 0 0;
    font-size: 0.72rem;
    color: #9ca3af;
  }

  .btn-close-modal {
    background: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .btn-close-modal:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }

  .journal-stats-banner {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 10px 16px;
    background: rgba(0, 0, 0, 0.5);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 0.75rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #d1d5db;
  }

  .stat-val-amber { font-weight: 700; color: #fbbf24; }
  .stat-val-emerald { font-weight: 700; color: #34d399; }
  .stat-val-purple { font-weight: 700; color: #c084fc; }

  .stat-divider {
    width: 1px;
    height: 14px;
    background: rgba(255, 255, 255, 0.1);
  }

  .journal-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    font-size: 0.85rem;
  }

  .resonance-result-card {
    padding: 16px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(30, 20, 10, 0.7) 0%, rgba(10, 8, 15, 0.8) 100%);
    border: 1px solid rgba(212, 175, 55, 0.35);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .result-title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sparkle-icon { font-size: 1.25rem; }
  .result-title { color: #fde047; font-size: 0.85rem; }

  .result-score-badge {
    font-size: 1.15rem;
    font-weight: 800;
    color: #34d399;
    background: rgba(6, 78, 59, 0.4);
    border: 1px solid rgba(52, 211, 153, 0.3);
    padding: 2px 10px;
    border-radius: 8px;
  }

  .result-insight {
    margin: 0;
    font-size: 0.78rem;
    color: #e5e7eb;
    font-style: italic;
    line-height: 1.6;
    background: rgba(0, 0, 0, 0.4);
    padding: 10px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .btn-write-more {
    background: transparent;
    border: none;
    color: #fbbf24;
    font-size: 0.75rem;
    cursor: pointer;
    text-decoration: underline;
    text-align: center;
    padding: 4px;
  }

  .journal-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: #d1d5db;
  }

  .journal-input, .journal-textarea {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #f3f4f6;
    font-size: 0.8rem;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }

  .journal-input:focus, .journal-textarea:focus {
    outline: none;
    border-color: #ffd700;
  }

  .mood-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .mood-btn {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.02);
    color: #9ca3af;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
  }

  .mood-btn.active {
    background: rgba(212, 175, 55, 0.16);
    border-color: #ffd700;
    color: #ffd700;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
  }

  .mood-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .mood-icon { font-size: 1rem; }
  .mood-label { font-size: 0.78rem; font-weight: 700; }
  .mood-desc { font-size: 0.65rem; color: #9ca3af; }

  .rating-bar {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .stars-wrap {
    display: flex;
    gap: 4px;
  }

  .star-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    padding: 0;
    line-height: 1;
    transition: transform 0.15s;
  }

  .star-btn:hover { transform: scale(1.15); }
  .star-active { color: #fbbf24; text-shadow: 0 0 6px rgba(251, 191, 36, 0.5); }
  .star-inactive { color: #4b5563; }

  .rating-text {
    font-size: 0.75rem;
    font-weight: 700;
    color: #fde047;
  }

  .btn-submit-journal {
    padding: 12px 18px;
    border-radius: 10px;
    background: linear-gradient(135deg, #d4af37, #b45309);
    border: 1px solid #ffd700;
    color: #17120a;
    font-size: 0.85rem;
    font-weight: 800;
    cursor: pointer;
    transition: filter 0.2s;
    box-shadow: 0 4px 14px rgba(212, 175, 55, 0.25);
  }

  .btn-submit-journal:hover:not(:disabled) { filter: brightness(1.1); }
  .btn-submit-journal:disabled { opacity: 0.5; cursor: not-allowed; }

  .journal-history-section {
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .history-title {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #9ca3af;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 180px;
    overflow-y: auto;
  }

  .history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
  }

  .history-item-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .item-date { color: #f3f4f6; font-size: 0.78rem; }
  .item-mood-badge {
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    font-size: 0.65rem;
    color: #d1d5db;
  }

  .item-notes {
    margin: 3px 0 0;
    font-size: 0.72rem;
    color: #9ca3af;
  }

  .item-score-wrap {
    text-align: right;
  }

  .item-score {
    font-size: 0.85rem;
    color: #34d399;
  }

  .item-score-sub {
    display: block;
    font-size: 0.62rem;
    color: #6b7280;
  }

  @media (max-width: 500px) {
    .mood-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
