<script lang="ts">
  import { resolve } from '$app/paths';
  import { AppScaffold } from '$lib/components/ui';
  import {
    Building2,
    Crown,
    Zap,
    CheckCircle2,
    FileText,
    ArrowRight,
    Compass,
    Sparkles,
    Shield,
    Users
  } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Gói Doanh Nghiệp & Bất Động Sản • ViOS</title>
  <meta
    name="description"
    content="Giải pháp phong thủy và quà tặng mệnh lý hoàng gia cao cấp dành cho chuyên viên bất động sản, nhà thầu xây dựng và chủ doanh nghiệp."
  />
</svelte:head>

<AppScaffold
  eyebrow="GIẢI PHÁP B2B & ĐỐI TÁC DOANH NGHIỆP"
  title="Phong Thủy & Quà Tặng Mệnh Lý Hoàng Gia"
  subtitle="Giải pháp thuật số đỉnh cao dành cho Chuyên Viên Bất Động Sản, Xây Dựng & Chủ Doanh Nghiệp nhằm thấu hiểu đối tác và chốt giao dịch thành công."
  wide={true}
>
  <div class="enterprise-page-container">

    <div class="features-grid">
      <div class="feature-card">
        <div class="icon-wrap icon-realty">
          <Compass size={24} />
        </div>
        <h3>Tư Vấn Phong Thủy & Động Thổ</h3>
        <p>
          Tra cứu hướng sinh khí, tính ngày giờ khởi công, nhập trạch, mở móng, cất nóc dự án theo thuật số Kỳ Môn - Lục Nhâm - Bát Tự, giúp gia tăng niềm tin tuyệt đối từ khách mua nhà.
        </p>
        <ul class="check-list">
          <li><CheckCircle2 size={15} class="text-emerald-500" /> Chọn ngày giờ hoàng đạo động thổ, mở bán</li>
          <li><CheckCircle2 size={15} class="text-emerald-500" /> Phân tích cung tài lộc & hướng vượng khí</li>
        </ul>
      </div>

      <div class="feature-card highlight">
        <div class="top-badge">QUÀ TẶNG THƯỢNG LƯU</div>
        <div class="icon-wrap icon-gift">
          <FileText size={24} />
        </div>
        <h3>Hồ Sơ Mệnh Lý Hoàng Gia 19 Trang</h3>
        <p>
          1-Click xuất ấn bản phân tích lá số mệnh chủ sang trọng, đóng bìa cứng trang trọng bàn giao cùng sổ hồng và chìa khóa nhà — tạo điểm chạm đẳng cấp vượt xa đối thủ cạnh tranh.
        </p>
        <ul class="check-list">
          <li><CheckCircle2 size={15} class="text-emerald-500" /> Xuất file PDF sắc nét in màu A4 tiêu chuẩn</li>
          <li><CheckCircle2 size={15} class="text-emerald-500" /> Dự báo 10 năm đại vận & lưu niên từng năm</li>
        </ul>
      </div>

      <div class="feature-card">
        <div class="icon-wrap icon-wholesale">
          <Crown size={24} />
        </div>
        <h3>Gói Mua Sỉ 1.000 XU (Tiết Kiệm 50%)</h3>
        <p>
          Chỉ 790.000đ sở hữu 1.000 XU không giới hạn thời hạn sử dụng. Tự do xuất 20 cuốn Hồ Sơ Hoàng Gia chuyên sâu hoặc 330 phiên tư vấn mệnh lý AI cao cấp.
        </p>
        <ul class="check-list">
          <li><CheckCircle2 size={15} class="text-emerald-500" /> Tiết kiệm 50% so với giá nạp bán lẻ</li>
          <li><CheckCircle2 size={15} class="text-emerald-500" /> Kích hoạt tự động tức thì qua SePay VietQR</li>
        </ul>
      </div>
    </div>

    <!-- Pricing Box -->
    <div class="pricing-box">
      <div class="pricing-box-content">
        <div class="pricing-details">
          <span class="pricing-tag">GÓI MUA SỈ DOANH NGHIỆP</span>
          <h2>1.000 XU — 790.000 VNĐ</h2>
          <p>
            Chỉ 790đ / 1 XU • Tiết kiệm 50% so với nạp lẻ • Bảo lưu hạn mức vĩnh viễn không hết hạn
          </p>
        </div>
        <div class="pricing-action">
          <a href={resolve('/wallet') + '?package=1000'} class="cta-button">
            <Zap size={18} />
            <span>Kích Hoạt Gói 1.000 XU</span>
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </div>
  </div>
</AppScaffold>

<style>
  .enterprise-page-container {
    max-width: 1140px;
    margin: 0 auto;
    padding: 40px 20px 80px;
  }



  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 48px;
  }

  .feature-card {
    position: relative;
    background: var(--color-bg-surface, #ffffff);
    border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.08));
    border-radius: 20px;
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  :global(.dark) .feature-card {
    background: rgba(30, 27, 75, 0.4);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  }

  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(99, 102, 241, 0.12);
  }

  .feature-card.highlight {
    border-color: rgba(168, 85, 247, 0.4);
  }

  .top-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(90deg, #9333ea, #6366f1);
    color: #ffffff;
    font-size: 10.5px;
    font-weight: 800;
    padding: 3px 12px;
    border-radius: 999px;
    box-shadow: 0 4px 12px rgba(147, 51, 234, 0.35);
    white-space: nowrap;
  }

  .icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }

  .icon-realty {
    background: rgba(99, 102, 241, 0.12);
    color: #6366f1;
  }

  .icon-gift {
    background: rgba(168, 85, 247, 0.12);
    color: #a855f7;
  }

  .icon-wholesale {
    background: rgba(234, 179, 8, 0.12);
    color: #ca8a04;
  }

  .feature-card h3 {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text-main, #1e293b);
    margin: 0 0 12px;
  }

  :global(.dark) .feature-card h3 {
    color: #ffffff;
  }

  .feature-card p {
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--color-text-muted, #64748b);
    margin: 0 0 20px;
    flex-grow: 1;
  }

  .check-list {
    list-style: none;
    padding: 16px 0 0;
    margin: 0;
    border-top: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.08));
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .check-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    color: var(--color-text-muted, #475569);
  }

  :global(.dark) .check-list li {
    color: #cbd5e1;
  }

  .pricing-box {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: 20px;
    padding: 32px 36px;
  }

  :global(.dark) .pricing-box {
    background: linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.7) 100%);
    border-color: rgba(129, 140, 248, 0.3);
  }

  .pricing-box-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  .pricing-tag {
    font-size: 11px;
    font-weight: 700;
    color: #6366f1;
    letter-spacing: 0.05em;
  }

  .pricing-details h2 {
    font-size: 26px;
    font-weight: 800;
    color: var(--color-text-main, #1e293b);
    margin: 4px 0 6px;
  }

  :global(.dark) .pricing-details h2 {
    color: #ffffff;
  }

  .pricing-details p {
    font-size: 13.5px;
    color: var(--color-text-muted, #64748b);
    margin: 0;
  }

  .cta-button {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 28px;
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    color: #ffffff;
    font-size: 15px;
    font-weight: 700;
    border-radius: 12px;
    text-decoration: none;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(168, 85, 247, 0.45);
  }

  @media (max-width: 900px) {
    .features-grid {
      grid-template-columns: 1fr;
    }

    .pricing-box-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .cta-button {
      width: 100%;
      justify-content: center;
    }
  }
</style>
