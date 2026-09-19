<script lang="ts">
  import { ViOSLogo } from '$lib/components/ui';
  import { resolve } from '$app/paths';
  import { ArrowLeft, ShieldCheck } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Chính Sách Bảo Mật • Tử Vi Toàn Tập</title>
  <meta
    name="description"
    content="Chính sách bảo mật thông tin người dùng và quyền riêng tư của ứng dụng Tử Vi Toàn Tập (ViOS) trên Web, iOS và Android."
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
        <ShieldCheck size={14} />
        <span>Bảo Vệ Quyền Riêng Tư & Dữ Liệu</span>
      </div>
      <h1 class="page-title">
        Chính Sách Bảo Mật Quyền Riêng Tư
      </h1>
      <p class="page-subtitle">
        Ứng dụng <strong>Tử Vi Toàn Tập (ViOS)</strong> • Cập nhật lần cuối: Tháng 09/2026
      </p>
    </div>

    <article class="legal-card">
      <section class="legal-section">
        <h2 class="section-title">
          <span class="num-badge">1</span> Giới Thiệu & Cam Kết Chung
        </h2>
        <p>
          Chào mừng quý bạn đến với ứng dụng <strong>Tử Vi Toàn Tập (ViOS)</strong>. Chúng tôi tôn trọng tuyệt đối quyền riêng tư và cam kết bảo vệ thông tin cá nhân của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu khi bạn sử dụng ứng dụng trên nền tảng Web, iOS (App Store) và Android (Google Play Store).
        </p>
      </section>

      <section class="legal-section">
        <h2 class="section-title">
          <span class="num-badge">2</span> Dữ Liệu Thu Thập & Mục Đích Sử Dụng
        </h2>
        <ul class="legal-list">
          <li>
            <strong>Thông tin ngày giờ sinh:</strong> Họ tên, ngày, tháng, năm và giờ sinh (Dương lịch hoặc Âm lịch), giới tính. Mục đích: Tính toán và an sao lá số Tử Vi, quẻ Kinh Dịch, Bát Tự và Hà Lạc theo thuật số truyền thống. Dữ liệu này chỉ phục vụ thuật toán chiêm bái của bạn.
          </li>
          <li>
            <strong>Tài khoản & Xác thực:</strong> Địa chỉ email (khi bạn chọn đăng ký bằng email hoặc tài khoản Google / Apple). Nếu sử dụng chế độ ẩn danh, hệ thống tự động cấp phiên làm việc ẩn danh mà không đòi hỏi bất kỳ thông tin nhận dạng cá nhân nào.
          </li>
          <li>
            <strong>Mã thông báo đẩy (FCM Token):</strong> Được lưu trữ để gửi thông điệp Khí Vận Nhật Khóa 07:00 sáng mỗi ngày hoặc các nhắc nhở chiêm bái quan trọng mà bạn đã cấp quyền.
          </li>
          <li>
            <strong>Hình ảnh diện mạo và chỉ tay:</strong> Chỉ thu thập khi bạn chủ động sử dụng tính năng xem tướng diện mạo / chỉ tay bằng AI. Hình ảnh chỉ được xử lý tức thời và không bị chia sẻ cho bất kỳ bên quảng cáo nào.
          </li>
        </ul>
      </section>

      <section class="legal-section">
        <h2 class="section-title">
          <span class="num-badge">3</span> Quyền Thiết Bị Trên Di Động (Permissions)
        </h2>
        <ul class="legal-list">
          <li>
            <strong>Quyền Thông Báo (Push Notifications):</strong> Để gửi thông điệp Khí Vận Nhật Khóa hàng ngày và nhắc điểm danh nhận XU. Bạn có thể bật hoặc tắt quyền này bất cứ lúc nào trong cài đặt của thiết bị.
          </li>
          <li>
            <strong>Quyền Máy Ảnh & Thư Viện Ảnh (Camera & Photos):</strong> Dùng để chụp hoặc chọn ảnh diện mạo, chỉ tay phục vụ tính năng chiêm đoán nhân tướng hoặc lưu tài liệu lá số tử vi dạng hình ảnh.
          </li>
        </ul>
      </section>

      <section class="legal-section">
        <h2 class="section-title">
          <span class="num-badge">4</span> Dịch Vụ Của Bên Thứ Ba
        </h2>
        <p>Ứng dụng có tích hợp một số dịch vụ hạ tầng chuẩn quốc tế đáng tin cậy:</p>
        <ul class="legal-list">
          <li><strong>Supabase:</strong> Lưu trữ dữ liệu an toàn, mã hóa đầu cuối với các chính sách Row Level Security (RLS) nghiêm ngặt.</li>
          <li><strong>Google Firebase Cloud Messaging (FCM):</strong> Chuyển phát thông báo đẩy an toàn đến thiết bị Android và iOS.</li>
          <li><strong>Google AdMob:</strong> Hiển thị quảng cáo thưởng (Rewarded Ads) giúp người dùng nhận XU miễn phí.</li>
          <li><strong>RevenueCat:</strong> Xử lý thanh toán các gói đăng ký Hoàng Triều VIP thông qua In-App Purchase chính thống của Google Play và Apple App Store.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2 class="section-title">
          <span class="num-badge">5</span> Quyền Của Bạn & Xóa Dữ Liệu
        </h2>
        <p>
          Bạn có toàn quyền kiểm soát dữ liệu của mình:
        </p>
        <ul class="legal-list">
          <li>Xem, sửa hoặc xóa lịch sử các lá số và quẻ bói đã tạo trong mục Lịch Sử.</li>
          <li>Hủy bỏ quyền nhận thông báo đẩy trong phần Cài đặt thiết bị.</li>
          <li>
            <strong>Yêu cầu xóa toàn bộ tài khoản và dữ liệu:</strong> Bạn có thể gửi yêu cầu xóa tài khoản trực tiếp trong app hoặc qua email <code class="code-email">contact@tuvitoantap.online</code>. Dữ liệu của bạn sẽ được xóa vĩnh viễn khỏi hệ thống trong vòng 24 giờ làm việc.
          </li>
        </ul>
      </section>

      <section class="legal-section">
        <h2 class="section-title">
          <span class="num-badge">6</span> Thông Tin Liên Hệ
        </h2>
        <p>
          Mọi thắc mắc hoặc khiếu nại liên quan đến chính sách bảo mật, xin vui lòng liên hệ Ban Quản Trị:
        </p>
        <div class="contact-card">
          <p><strong>Dự án:</strong> Tử Vi Toàn Tập (ViOS)</p>
          <p><strong>Email Hỗ Trợ:</strong> <a href="mailto:contact@tuvitoantap.online">contact@tuvitoantap.online</a></p>
          <p><strong>Trang Chủ & Bản Web:</strong> <a href="https://tuvitoantap.online" target="_blank" rel="noreferrer">https://tuvitoantap.online</a></p>
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

  .code-email {
    padding: 2px 6px;
    border-radius: var(--radius-xs);
    background: var(--celestial-badge-bg);
    color: var(--celestial-gold-deep);
    font-size: 13px;
    font-weight: 600;
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
