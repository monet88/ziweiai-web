<script lang="ts">
  import {
    ChevronLeft,
    ChevronRight,
    FileText,
    Sparkles,
    Shield
  } from 'lucide-svelte';

  interface DossierPageSample {
    pageNumber: number;
    title: string;
    subtitle: string;
    description: string;
    highlightPill: string;
    tags: string[];
    accentColor: string;
  }

  const SAMPLES: DossierPageSample[] = [
    {
      pageNumber: 1,
      title: 'Bìa Hồ Sơ Hoàng Gia Khắc Kim',
      subtitle: 'Ấn bản thượng lưu A4 bàn giao cùng chìa khóa nhà',
      description: 'Thiết kế trang bìa dát vàng tôn vinh danh tính chủ nhân, phong hiệu mệnh lý và dấu triện Khâm Thiên Giám Hoàng Triều.',
      highlightPill: 'TRANG BÌA SANG TRỌNG',
      tags: ['Đóng bìa da cao cấp', 'Dát kim hoàng gia', 'Dấu triện Khâm Thiên'],
      accentColor: '#eab308',
    },
    {
      pageNumber: 3,
      title: 'Thiên Bàn Bản Mệnh 12 Cung Vị',
      subtitle: 'Bản đồ sao Tử Vi & Bát Tự toàn cảnh đời người',
      description: 'Đồ hình tinh tế hiển thị trọn vẹn 14 Chính Tinh, Tứ Hóa và các phụ tinh đắc hãm; phân định rõ Cung Mệnh, Tài Bạch, Quan Lộc và Điền Trạch.',
      highlightPill: 'TỔNG QUAN LÁ SỐ',
      tags: ['12 Cung bản mệnh', 'Chính tinh đắc cách', 'Tam phương tứ chính'],
      accentColor: '#6366f1',
    },
    {
      pageNumber: 7,
      title: 'Phân Tích Cung Điền Trạch & Bất Động Sản',
      subtitle: 'Khám phá thế đất, duyên điền sản và thời cơ gia tăng tài sản',
      description: 'Chuyên đề đặc biệt dành cho giao dịch bất động sản: chỉ rõ tuổi hợp hướng đất, thế đất tụ tài, các năm đại cát để mua bán và tích lũy điền sản.',
      highlightPill: 'ĐIỀN TRẠCH VƯỢNG KHÍ',
      tags: ['Thế đất sinh tài', 'Thời vận mua nhà', 'Hướng nhà hợp mệnh'],
      accentColor: '#10b981',
    },
    {
      pageNumber: 12,
      title: 'Đại Vận 10 Năm & Lưu Niên Từng Năm',
      subtitle: 'Kế hoạch hành động và dự báo chu kỳ thịnh suy',
      description: 'Lộ trình chi tiết từng năm trong đại vận hiện tại, giúp nhà đầu tư và chủ doanh nghiệp biết điểm dừng phòng thủ và thời khắc bứt phá.',
      highlightPill: 'DỰ BÁO TƯƠNG LAI',
      tags: ['Lưu niên 2026–2035', 'Cơ hội & rủi ro', 'Hóa giải hung tinh'],
      accentColor: '#a855f7',
    },
    {
      pageNumber: 19,
      title: 'Lời Khuyên Cố Vấn & Biện Pháp Phong Thủy',
      subtitle: 'Định hướng thuận thiên ứng nhân cho gia chủ',
      description: 'Tổng kết khuyến nghị thiết thực: bố trí không gian sinh thái, màu sắc vượng mệnh, và lời chúc phúc trường thịnh từ đội ngũ ViOS.',
      highlightPill: 'HÀNH ĐỘNG THUẬN HÒA',
      tags: ['Bố trí phong thủy', 'Màu sắc cát tường', 'Tổng kết cố vấn'],
      accentColor: '#ec4899',
    },
  ];

  let currentIndex = $state(0);

  function prev() {
    currentIndex = (currentIndex - 1 + SAMPLES.length) % SAMPLES.length;
  }

  function next() {
    currentIndex = (currentIndex + 1) % SAMPLES.length;
  }

  let activeSample = $derived(SAMPLES[currentIndex]);
</script>

<div class="dossier-preview-section">
  <div class="preview-header">
    <span class="preview-eyebrow">XEM TRƯỚC ẤN BẢN ĐỘC BẢN</span>
    <h2 class="preview-title">Chiêm Ngưỡng Hồ Sơ Mệnh Lý Hoàng Gia 19 Trang</h2>
    <p class="preview-subtitle">
      Từng trang tài liệu được thiết kế đạt tiêu chuẩn in ấn mỹ thuật A4, đóng bìa cứng sang trọng — điểm chạm thượng lưu khiến khách hàng nhớ mãi.
    </p>
  </div>

  <div class="carousel-container">
    <!-- Nút Lùi -->
    <button
      type="button"
      class="nav-btn prev-btn"
      onclick={prev}
      aria-label="Xem trang mẫu trước"
    >
      <ChevronLeft size={24} />
    </button>

    <!-- Khung Trang Giả Lập A4 Mỹ Thuật -->
    <div class="sheet-frame celestial-card-glass">
      <div class="sheet-top-bar">
        <span class="sheet-badge" style="--accent: {activeSample.accentColor}">
          <Sparkles size={13} /> {activeSample.highlightPill}
        </span>
        <span class="page-indicator">Trang {activeSample.pageNumber} / 19</span>
      </div>

      <!-- Nội dung minh họa trang A4 -->
      <div class="sheet-mockup" style="--accent-glow: {activeSample.accentColor}">
        <div class="mockup-watermark">KHÂM THIÊN GIÁM</div>
        <div class="mockup-border">
          <div class="mockup-header-line">
            <span class="brand-sub">TỬ VI TOÀN TẬP • VIOS IMPERIAL DOSSIER</span>
            <span class="stamp-icon"><Shield size={16} /></span>
          </div>

          <h3 class="mockup-title">{activeSample.title}</h3>
          <p class="mockup-sub">{activeSample.subtitle}</p>

          <div class="mockup-divider"></div>

          <p class="mockup-desc">{activeSample.description}</p>

          <!-- Chi tiết thẻ tags -->
          <div class="mockup-tags">
            {#each activeSample.tags as tag (tag)}
              <span class="tag-chip">
                <FileText size={12} /> {tag}
              </span>
            {/each}
          </div>

          <div class="mockup-footer-note">
            <span>Tiêu chuẩn in: Offset A4 • Giấy Mỹ Thuật 250gsm</span>
            <span class="gold-seal">★ ẤN CHỨNG HOÀNG GIA ★</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Nút Tiến -->
    <button
      type="button"
      class="nav-btn next-btn"
      onclick={next}
      aria-label="Xem trang mẫu tiếp theo"
    >
      <ChevronRight size={24} />
    </button>
  </div>

  <!-- Chỉ báo trang Carousel Dots -->
  <div class="carousel-dots" role="tablist" aria-label="Chọn trang mẫu hồ sơ">
    {#each SAMPLES as s, idx (s.pageNumber)}
      <button
        type="button"
        role="tab"
        class="dot-btn"
        class:active={currentIndex === idx}
        onclick={() => { currentIndex = idx; }}
        aria-selected={currentIndex === idx}
        aria-label="Xem {s.title}"
      >
        <span class="dot-label">Trang {s.pageNumber}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .dossier-preview-section {
    margin-bottom: 56px;
  }

  .preview-header {
    text-align: center;
    max-width: 680px;
    margin: 0 auto 36px;
  }

  .preview-eyebrow {
    display: inline-block;
    background: rgba(234, 179, 8, 0.15);
    color: #ca8a04;
    font-size: 11px;
    font-weight: 800;
    padding: 4px 14px;
    border-radius: 999px;
    letter-spacing: 0.08em;
    margin-bottom: 12px;
  }

  :global(.dark) .preview-eyebrow {
    background: rgba(234, 179, 8, 0.2);
    color: #facc15;
  }

  .preview-title {
    font-size: 26px;
    font-weight: 800;
    color: var(--color-text-primary, #1e1b4b);
    margin: 0 0 10px;
    letter-spacing: -0.02em;
  }

  :global(.dark) .preview-title {
    color: #ffffff;
  }

  .preview-subtitle {
    font-size: 14px;
    color: var(--color-text-secondary, #64748b);
    line-height: 1.6;
    margin: 0;
  }

  .carousel-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    max-width: 820px;
    margin: 0 auto;
  }

  .nav-btn {
    background: var(--color-bg-surface, #ffffff);
    border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.1));
    color: var(--color-text-primary, #1e1b4b);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    transition: transform 0.2s, background 0.2s;
    flex-shrink: 0;
  }

  :global(.dark) .nav-btn {
    background: rgba(30, 27, 75, 0.6);
    border-color: rgba(255, 255, 255, 0.15);
    color: #ffffff;
  }

  .nav-btn:hover {
    transform: scale(1.08);
    background: #6366f1;
    color: #ffffff;
  }

  .sheet-frame {
    flex: 1;
    max-width: 640px;
    background: var(--color-bg-surface, #ffffff);
    border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.08));
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.08);
  }

  :global(.dark) .sheet-frame {
    background: rgba(20, 18, 55, 0.7);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  }

  .sheet-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .sheet-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 800;
    color: var(--accent);
    background: rgba(99, 102, 241, 0.1);
    padding: 4px 12px;
    border-radius: 999px;
  }

  .page-indicator {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-muted, #94a3b8);
  }

  .sheet-mockup {
    position: relative;
    aspect-ratio: 1 / 1.15;
    background: linear-gradient(135deg, #fefce8 0%, #fffdf0 100%);
    border: 2px solid #eab308;
    border-radius: 14px;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: inset 0 0 20px rgba(234, 179, 8, 0.1);
  }

  :global(.dark) .sheet-mockup {
    background: linear-gradient(135deg, #18153d 0%, #0f0d2c 100%);
    border-color: rgba(234, 179, 8, 0.5);
    box-shadow: 0 0 30px rgba(234, 179, 8, 0.08);
  }

  .mockup-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-25deg);
    font-size: 40px;
    font-weight: 900;
    color: rgba(234, 179, 8, 0.06);
    pointer-events: none;
    white-space: nowrap;
    letter-spacing: 0.1em;
  }

  .mockup-border {
    position: relative;
    border: 1px dashed rgba(234, 179, 8, 0.4);
    height: 100%;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
  }

  .mockup-header-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    font-weight: 700;
    color: #854d0e;
    letter-spacing: 0.05em;
    margin-bottom: 16px;
  }

  :global(.dark) .mockup-header-line {
    color: #fef08a;
  }

  .mockup-title {
    font-size: 19px;
    font-weight: 800;
    color: #1e1b4b;
    margin: 0 0 6px;
    line-height: 1.3;
  }

  :global(.dark) .mockup-title {
    color: #ffffff;
  }

  .mockup-sub {
    font-size: 12.5px;
    color: #64748b;
    margin: 0;
    font-style: italic;
  }

  :global(.dark) .mockup-sub {
    color: #cbd5e1;
  }

  .mockup-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #eab308, transparent);
    margin: 16px 0;
  }

  .mockup-desc {
    font-size: 13.5px;
    color: #334155;
    line-height: 1.6;
    margin: 0 0 16px;
    flex: 1;
  }

  :global(.dark) .mockup-desc {
    color: #e2e8f0;
  }

  .mockup-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    background: rgba(234, 179, 8, 0.15);
    color: #854d0e;
    padding: 3px 8px;
    border-radius: 6px;
  }

  :global(.dark) .tag-chip {
    background: rgba(234, 179, 8, 0.2);
    color: #fef08a;
  }

  .mockup-footer-note {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9.5px;
    color: #94a3b8;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    padding-top: 10px;
  }

  :global(.dark) .mockup-footer-note {
    border-color: rgba(255, 255, 255, 0.08);
  }

  .gold-seal {
    font-weight: 800;
    color: #ca8a04;
  }

  :global(.dark) .gold-seal {
    color: #facc15;
  }

  .carousel-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 20px;
  }

  .dot-btn {
    background: var(--color-border-subtle, rgba(0, 0, 0, 0.1));
    border: none;
    padding: 6px 14px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--color-text-muted, #94a3b8);
    transition: all 0.2s;
  }

  :global(.dark) .dot-btn {
    background: rgba(255, 255, 255, 0.08);
  }

  .dot-btn.active {
    background: #6366f1;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }

  @media (max-width: 640px) {
    .nav-btn {
      display: none;
    }
    .sheet-mockup {
      aspect-ratio: auto;
      min-height: 380px;
    }
  }
</style>
