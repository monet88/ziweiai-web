<script lang="ts">
  import { ViOSLogo } from '$lib/components/ui';
  import { resolve } from '$app/paths';
  import { ArrowLeft, ScrollText } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Điều Khoản Dịch Vụ • Tử Vi Toàn Tập</title>
  <meta
    name="description"
    content="Điều khoản dịch vụ và quy định chiêm bái thuật số của ứng dụng Tử Vi Toàn Tập (ViOS) trên nền tảng Web và Thiết bị di động."
  />
</svelte:head>

<div class="legal-page">
  <!-- Dynamic Celestial Stardust Background -->
  <div class="legal-stardust-bg" aria-hidden="true">
    <div class="aurora-glow glow-gold"></div>
    <div class="aurora-glow glow-purple"></div>
  </div>

  <header class="legal-header">
    <div class="header-inner">
      <a href={resolve('/')} class="brand-link">
        <ViOSLogo size="sm" showTagline={false} />
        <span class="brand-title">Tử Vi Toàn Tập</span>
      </a>
      <a href={resolve('/')} class="btn-back-home">
        <ArrowLeft size={14} />
        <span>Trở Về Trang Chủ</span>
      </a>
    </div>
  </header>

  <main class="legal-main">
    <div class="legal-hero">
      <div class="eyebrow-pill">
        <ScrollText size={14} />
        <span>Quy Định & Pháp Lý Hoàng Triều</span>
      </div>
      <h1 class="page-title">
        Điều Khoản Dịch Vụ & Chiêm Bốc
      </h1>
      <p class="page-subtitle">
        Ứng dụng <strong>Tử Vi Toàn Tập (ViOS)</strong> • Phiên bản cập nhật: Tháng 09/2026
      </p>
    </div>

    <article class="legal-card">
      <section class="legal-section">
        <h2 class="section-title">
          <span class="num-badge">1</span> Chấp Thuận Điều Khoản
        </h2>
        <p>
          Bằng việc truy cập, tải về hoặc sử dụng bất kỳ phần nào của ứng dụng <strong>Tử Vi Toàn Tập (ViOS)</strong> trên Web, iOS hoặc Android, quý bạn xác nhận đã đọc kỹ, thấu hiểu và đồng ý hoàn toàn với các Điều khoản Dịch vụ này. Nếu không đồng ý với bất kỳ điều khoản nào, quý bạn vui lòng ngừng sử dụng dịch vụ.
        </p>
      </section>

      <section class="legal-section">
        <h2 class="section-title">
          <span class="num-badge">2</span> Bản Chất Dịch Vụ & Tinh Thần Khâm Thiên Giám
        </h2>
        <p>
          Tử Vi Toàn Tập là nền tảng số hóa di sản thuật số phương Đông (Tử Vi Đẩu Số, Kinh Dịch Lục Hào, Bát Tự Hà Lạc, Kỳ Môn Độn Giáp, Mai Hoa Dịch Số, Nhân Tướng Học, Bài Tây Lenormand & Tarot) kết hợp trí tuệ nhân tạo (AI) chuyên sâu:
        </p>
        <ul class="legal-list">
          <li>Mọi kết quả luận giải, an sao, quẻ chiêm bốc và phân tích vận hạn được tạo ra nhằm mục đích <strong>chiêm nghiệm văn hóa, giải trí, bồi dưỡng tâm tính và tham khảo định hướng</strong>.</li>
          <li>Hệ thống <strong>không đưa ra lời khuyên y tế, chuẩn đoán pháp lý, cam kết tài chính hay thay thế các quyết định hệ trọng trong đời thực</strong>. Người dùng tự chịu trách nhiệm hoàn toàn cho các quyết định cá nhân trong cuộc sống.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2 class="section-title">
          <span class="num-badge">3</span> Tài Khoản, Bảo Mật & Quyền Hạn
        </h2>
        <ul class="legal-list">
          <li><strong>Phiên Ẩn Danh:</strong> Quý bạn có thể trải nghiệm ngay mà không cần cung cấp danh tính. Dữ liệu phiên ẩn danh gắn liền với thiết bị và trình duyệt hiện tại.</li>
          <li><strong>Tài Khoản Xác Thực:</strong> Khi đăng ký bằng Email, Google hoặc Apple ID, dữ liệu lá số và số dư ví XU của quý bạn sẽ được bảo lưu vĩnh viễn trên hạ tầng đám mây an toàn.</li>
          <li><strong>Bảo Mật:</strong> Quý bạn có trách nhiệm bảo mật thiết bị và tài khoản đăng nhập của mình. Quý bạn có quyền yêu cầu xóa tài khoản và toàn bộ dữ liệu bất kỳ lúc nào tại mục Cài Đặt.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2 class="section-title">
          <span class="num-badge">4</span> Đơn Vị Tín Dụng XU & Gói Dịch Vụ Hoàng Triều VIP
        </h2>
        <ul class="legal-list">
          <li><strong>Đơn Vị XU:</strong> Hệ thống sử dụng đơn vị XU để chi trả cho các lượt gọi AI chuyên sâu (gieo quẻ Lục Hào, luận giải cung sao chi tiết, xem tướng ảnh). Người dùng có thể nhận XU miễn phí qua điểm danh mỗi ngày (Daily Check-in), xem video thưởng, hoặc thỉnh các gói nạp XU.</li>
          <li><strong>Chính Sách Hoàn Tiền:</strong> Các gói XU và gói đăng ký Hoàng Triều VIP được xử lý tự động qua cổng thanh toán bảo mật (SePay ngân hàng nội địa, Google Play Billing hoặc Apple App Store In-App Purchases). Do tính chất hàng hóa kỹ thuật số tiêu dùng tức thì, giao dịch mua XU không được hoàn lại trừ trường hợp phát sinh lỗi kỹ thuật hệ thống đã được xác nhận.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2 class="section-title">
          <span class="num-badge">5</span> Bản Quyền & Sở Hữu Trí Tuệ
        </h2>
        <p>
          Toàn bộ thiết kế giao diện Hoàng Triều, biểu tượng ViOS, đồ họa lá số, thuật toán an sao độc quyền và cấu trúc tri thức Khâm Thiên Giám thuộc quyền sở hữu trí tuệ của dự án Tử Vi Toàn Tập. Nghiêm cấm mọi hành vi sao chép, dịch ngược mã nguồn (reverse engineer) hoặc khai thác thương mại khi chưa có sự chấp thuận bằng văn bản.
        </p>
      </section>

      <section class="legal-section">
        <h2 class="section-title">
          <span class="num-badge">6</span> Cập Nhật Điều Khoản & Liên Hệ Hỗ Trợ
        </h2>
        <p>
          Ban Quản Trị có quyền điều chỉnh nội dung điều khoản để phù hợp với sự phát triển của dịch vụ và quy định pháp luật hiện hành. Những thay đổi sẽ có hiệu lực ngay khi được công bố trên ứng dụng.
        </p>
        <div class="contact-card">
          <p><strong>Cơ Quan Điều Hành:</strong> Hoàng Triều Chiêm Tinh ViOS</p>
          <p><strong>Thư Điện Tử Hỗ Trợ:</strong> <a href="mailto:galaxypro710@gmail.com">galaxypro710@gmail.com</a></p>
          <p><strong>Trang Chủ Trực Tuyến:</strong> <a href="https://tuvitoantap.vercel.app" target="_blank" rel="noreferrer">https://tuvitoantap.vercel.app</a></p>
        </div>
      </section>
    </article>
  </main>

  <footer class="legal-footer">
    <p>&copy; {new Date().getFullYear()} Tử Vi Toàn Tập (ViOS). Bản quyền thuộc về Hoàng Triều Chiêm Tinh.</p>
  </footer>
</div>

<style>
  .legal-page {
    position: relative;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--legal-page-bg, #faf8f5);
    color: var(--legal-text-color, #374151);
    overflow-x: hidden;
  }

  .legal-stardust-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .aurora-glow {
    position: absolute;
    width: 50vw;
    height: 50vw;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.15;
    transform: translateZ(0);
  }

  .glow-gold {
    top: -15vw;
    left: -10vw;
    background: radial-gradient(circle, var(--celestial-gold), transparent 70%);
  }

  .glow-purple {
    top: 10vw;
    right: -10vw;
    background: radial-gradient(circle, var(--celestial-purple-accent), transparent 70%);
  }

  .legal-header {
    position: sticky;
    top: 0;
    z-index: 50;
    background: var(--legal-card-bg);
    border-bottom: 1px solid var(--legal-card-border);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  }

  .header-inner {
    width: min(100%, 880px);
    margin: 0 auto;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .brand-link {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .brand-title {
    font-family: var(--font-serif);
    font-size: 17px;
    font-weight: 750;
    color: var(--legal-title-color);
  }

  .btn-back-home {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    background: var(--celestial-badge-bg);
    border: 1px solid var(--celestial-badge-border);
    color: var(--celestial-gold-text);
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .btn-back-home:hover {
    background: var(--celestial-border-gold);
    color: var(--celestial-gold-deep);
    transform: translateX(-2px);
  }

  .legal-main {
    position: relative;
    z-index: 1;
    flex: 1;
    width: min(100%, 880px);
    margin: 0 auto;
    padding: 40px 20px 80px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .legal-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }

  .eyebrow-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 14px;
    border-radius: var(--radius-pill);
    background: var(--celestial-badge-bg);
    border: 1px solid var(--celestial-badge-border);
    color: var(--celestial-badge-text);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .page-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(28px, 4vw, 42px);
    font-weight: 850;
    line-height: 1.2;
    color: var(--legal-title-color);
  }

  .page-subtitle {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  .page-subtitle strong {
    color: var(--legal-title-color);
  }

  .legal-card {
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding: clamp(24px, 4vw, 44px);
    border-radius: 24px;
    background: var(--legal-card-bg);
    border: 1px solid var(--legal-card-border);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    font-size: 15px;
    line-height: 1.75;
  }

  .legal-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 800;
    color: var(--legal-h2-color);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .num-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--celestial-badge-bg);
    border: 1px solid var(--celestial-badge-border);
    color: var(--celestial-badge-text);
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 850;
    flex-shrink: 0;
  }

  .legal-section p {
    margin: 0;
  }

  .legal-list {
    margin: 0;
    padding-left: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .legal-list li {
    padding-left: 4px;
  }

  .legal-list li strong,
  .legal-section p strong {
    color: var(--color-text-primary);
  }

  .contact-card {
    margin-top: 8px;
    padding: 16px 20px;
    border-radius: 16px;
    background: var(--legal-contact-bg);
    border: 1px solid var(--legal-card-border);
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
  }

  .contact-card p {
    margin: 0;
  }

  .contact-card a {
    color: var(--celestial-gold);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .legal-footer {
    position: relative;
    z-index: 1;
    padding: 24px 20px;
    border-top: 1px solid var(--legal-card-border);
    text-align: center;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .legal-footer p {
    margin: 0;
  }

  @media (max-width: 640px) {
    .header-inner {
      padding: 10px 14px;
    }

    .brand-title {
      display: none;
    }

    .legal-main {
      padding: 24px 14px 60px;
      gap: 24px;
    }

    .legal-card {
      padding: 20px 16px;
      border-radius: 18px;
      gap: 24px;
      font-size: 14px;
    }

    .section-title {
      font-size: 18px;
    }

    .legal-list {
      padding-left: 18px;
    }
  }
</style>
