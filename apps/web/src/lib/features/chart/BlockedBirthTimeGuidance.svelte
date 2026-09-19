<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Clock, Sparkles, BookOpen, ArrowRight } from 'lucide-svelte';
  import BirthTimeEstimatorModal from '$lib/features/dashboard/BirthTimeEstimatorModal.svelte';

  interface Props {
    chartSystem: string | null | undefined;
    chartId?: string;
  }

  let { chartSystem }: Props = $props();

  let isEstimatorOpen = $state(false);

  const isZiwei = $derived(chartSystem === 'zi-wei-dou-shu');
  const isBazi = $derived(chartSystem === 'ba-zi' || chartSystem === 'mangpai');

  function handleSelectEstimatedTime(hour: string, minute: string) {
    // Chuyển về trang chủ lập lại lá số kèm query params giờ ước lượng
    goto(resolve(`/?estimatedHour=${hour}&estimatedMinute=${minute}`));
  }
</script>

<div class="guidance-card surface-glass">
  <div class="guidance-header">
    <div class="guidance-badge">
      <Clock size={16} />
      <span>QUY TẮC MỆNH LÝ HỌC KHÂM THIÊN GIÁM</span>
    </div>
    <h3 class="guidance-title">
      {#if isZiwei}
        Chưa Thể An Sao Dựng Bàn 12 Cung (Do Thiếu Giờ Sinh)
      {:else if isBazi}
        Chưa Thể Thiết Lập Trọn Vẹn Tứ Trụ Bát Tự (Do Thiếu Giờ Sinh)
      {:else}
        Chưa Thể Dựng Đồ Hình Chi Tiết Do Thiếu Thông Tin Giờ Sinh
      {/if}
    </h3>
    <p class="guidance-explanation">
      {#if isZiwei}
        Trong <strong>Tử Vi Đẩu Số</strong>, giờ sinh là biến số quan trọng nhất để an vị trí <strong>Cung Mệnh</strong> và <strong>Cung Thân</strong>. Từ Mệnh Thân mới tính ra Cục số, từ đó an sao Tử Vi, Thiên Phủ và toàn bộ 14 chính tinh cùng hàng trăm phụ tinh cát hung. Thiếu giờ sinh, không trường phái Tử Vi chính tông nào có thể dựng được thiên bàn.
      {:else if isBazi}
        Trong <strong>Bát Tự (Tứ Trụ)</strong>, cần đủ 4 cột trụ: <em>Trụ Năm, Trụ Tháng, Trụ Ngày và Trụ Giờ</em> (tổng cộng 8 chữ). Khi không rõ giờ sinh, hệ thống chỉ có Tam Trụ (6 chữ), khuyết mất Trụ Giờ (đại diện cho Cung Con Cái và hậu vận sau tuổi 50).
      {:else}
        Hệ thuật số này yêu cầu mốc thời gian chính xác để định vị các cung sao và năng lượng ngũ hành.
      {/if}
    </p>
    <div class="guidance-integrity-note">
      <span class="note-bullet">✦</span>
      <span>Hệ thống <strong>tuyệt đối không phán đoán suy diễn mò mẫm</strong> khi thiếu dữ liệu then chốt, nhằm bảo toàn tính chuẩn xác và sự linh ứng tôn nghiêm cho lá số của bạn.</span>
    </div>
  </div>

  <div class="guidance-solutions">
    <h4 class="solutions-title">
      <Sparkles size={16} class="gold-icon" />
      <span>Giải Pháp Dành Cho Bạn Khi Không Nhớ Giờ Sinh:</span>
    </h4>

    <div class="solutions-grid">
      <!-- Giải pháp 1: Ước lượng giờ sinh -->
      <div class="solution-item featured">
        <div class="solution-header">
          <div class="solution-number">1</div>
          <div>
            <h5 class="solution-name">Ước Lượng Theo Sinh Hoạt Dân Gian</h5>
            <p class="solution-desc">Hỏi lại cha mẹ khoảng thời gian (sáng sớm, trưa, tối...) để chọn canh giờ gần đúng nhất.</p>
          </div>
        </div>
        <button
          type="button"
          class="btn-solution-action primary"
          onclick={() => (isEstimatorOpen = true)}
        >
          <Clock size={15} />
          <span>Tra Cứu & Chọn 12 Canh Giờ</span>
        </button>
      </div>

      <!-- Giải pháp 2: Thần Số Học Pitago -->
      <div class="solution-item">
        <div class="solution-header">
          <div class="solution-number">2</div>
          <div>
            <h5 class="solution-name">Xem Thần Số Học Pitago</h5>
            <p class="solution-desc"><strong>Không cần giờ sinh</strong>! Chỉ cần Ngày Tháng Năm sinh & Họ Tên để giải mã Con Số Chủ Đạo và Kim Tự Tháp 4 đỉnh cao.</p>
          </div>
        </div>
        <a href={resolve('/numerology')} class="btn-solution-action outline">
          <BookOpen size={15} />
          <span>Khám Phá Thần Số Học</span>
          <ArrowRight size={14} />
        </a>
      </div>

      <!-- Giải pháp 3: Gieo Quẻ Kinh Dịch & Tarot -->
      <div class="solution-item">
        <div class="solution-header">
          <div class="solution-number">3</div>
          <div>
            <h5 class="solution-name">Gieo Quẻ Dịch Hoặc Bói Bài Tarot</h5>
            <p class="solution-desc">Hỏi việc công danh, tài lộc, tình duyên theo thời khắc hiện tại hoặc bốc bài trực giác, <strong>hoàn toàn không phụ thuộc giờ sinh</strong>.</p>
          </div>
        </div>
        <div class="action-btn-group">
          <a href={resolve('/meihua')} class="btn-sub-action">Mai Hoa Dịch Số</a>
          <a href={resolve('/tarot')} class="btn-sub-action">Trải Bài Tarot</a>
        </div>
      </div>
    </div>
  </div>
</div>

<BirthTimeEstimatorModal
  isOpen={isEstimatorOpen}
  onClose={() => (isEstimatorOpen = false)}
  onSelect={handleSelectEstimatedTime}
/>

<style>
  .guidance-card {
    background: var(--color-bg-surface, #1e1b18);
    border: 1px solid rgba(212, 168, 83, 0.3);
    border-radius: var(--radius-xl, 16px);
    padding: 24px;
    margin-bottom: var(--space-lg, 24px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  }

  .guidance-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--color-accent-gold, #d4a853);
    background: rgba(212, 168, 83, 0.12);
    border: 1px solid rgba(212, 168, 83, 0.25);
    padding: 4px 10px;
    border-radius: 20px;
    margin-bottom: 12px;
  }

  .guidance-title {
    margin: 0 0 10px;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text-primary, #f5f0eb);
    line-height: 1.35;
  }

  .guidance-explanation {
    margin: 0 0 14px;
    font-size: 0.92rem;
    color: var(--color-text-secondary, #b8aea0);
    line-height: 1.6;
  }

  .guidance-explanation strong {
    color: var(--color-text-primary, #f5f0eb);
  }

  .guidance-integrity-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 8px;
    background: rgba(212, 168, 83, 0.06);
    border-left: 3px solid var(--color-accent-gold, #d4a853);
    font-size: 0.85rem;
    color: var(--color-accent-gold, #d4a853);
    line-height: 1.5;
    margin-bottom: 24px;
  }

  .note-bullet {
    font-weight: bold;
    flex-shrink: 0;
  }

  .guidance-solutions {
    border-top: 1px solid var(--color-border-hairline, rgba(255, 255, 255, 0.08));
    padding-top: 20px;
  }

  .solutions-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary, #f5f0eb);
  }

  :global(.gold-icon) {
    color: var(--color-accent-gold, #d4a853);
  }

  .solutions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }

  .solution-item {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--color-border-hairline, rgba(255, 255, 255, 0.08));
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.2s ease;
  }

  .solution-item.featured {
    background: rgba(212, 168, 83, 0.04);
    border-color: rgba(212, 168, 83, 0.3);
  }

  .solution-item:hover {
    border-color: rgba(212, 168, 83, 0.5);
    background: rgba(212, 168, 83, 0.07);
  }

  .solution-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
  }

  .solution-number {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(212, 168, 83, 0.2);
    color: var(--color-accent-gold, #d4a853);
    font-weight: 700;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .solution-name {
    margin: 0 0 4px;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text-primary, #f5f0eb);
  }

  .solution-desc {
    margin: 0;
    font-size: 0.82rem;
    color: var(--color-text-tertiary, #9e9587);
    line-height: 1.45;
  }

  .btn-solution-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .btn-solution-action.primary {
    background: linear-gradient(135deg, #d4a853 0%, #b88628 100%);
    color: #11100e;
    border: none;
  }

  .btn-solution-action.primary:hover {
    filter: brightness(1.1);
    box-shadow: 0 4px 12px rgba(212, 168, 83, 0.3);
  }

  .btn-solution-action.outline {
    background: transparent;
    border: 1px solid rgba(212, 168, 83, 0.4);
    color: var(--color-accent-gold, #d4a853);
  }

  .btn-solution-action.outline:hover {
    background: rgba(212, 168, 83, 0.15);
    border-color: var(--color-accent-gold, #d4a853);
  }

  .action-btn-group {
    display: flex;
    gap: 8px;
  }

  .btn-sub-action {
    flex: 1;
    text-align: center;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--color-border-hairline, rgba(255, 255, 255, 0.1));
    color: var(--color-text-secondary, #dcd4c8);
    text-decoration: none;
    transition: all 0.2s;
  }

  .btn-sub-action:hover {
    background: rgba(212, 168, 83, 0.15);
    border-color: rgba(212, 168, 83, 0.4);
    color: var(--color-accent-gold, #d4a853);
  }
</style>
