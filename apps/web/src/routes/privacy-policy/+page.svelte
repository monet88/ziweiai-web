<script lang="ts">
  import { ViOSLogo } from '$lib/components/ui';
</script>

<svelte:head>
  <title>Chính Sách Bảo Mật • Tử Vi Toàn Tập</title>
  <meta
    name="description"
    content="Chính sách bảo mật thông tin người dùng và quyền riêng tư của ứng dụng Tử Vi Toàn Tập (ViOS) trên Web, iOS và Android."
  />
</svelte:head>

<div class="legal-page min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
  <header class="legal-header border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2 text-decoration-none text-slate-100">
        <ViOSLogo />
        <span class="font-serif font-bold text-amber-200 text-lg hidden sm:inline">Tử Vi Toàn Tập</span>
      </a>
      <a
        href="/"
        class="text-xs md:text-sm px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
      >
        ← Trở Về Trang Chủ
      </a>
    </div>
  </header>

  <main class="flex-1 max-w-4xl mx-auto px-4 py-12 md:py-16 w-full">
    <div class="mb-10 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium mb-4">
        <span>📜</span>
        <span>Quy Định & Pháp Lý Hoàng Triều</span>
      </div>
      <h1 class="page-title text-3xl md:text-5xl font-serif font-bold text-amber-200 tracking-wide mb-3">
        Chính Sách Bảo Mật Quyền Riêng Tư
      </h1>
      <p class="page-subtitle text-sm md:text-base text-slate-400">
        Ứng dụng <strong class="text-amber-300">Tử Vi Toàn Tập (ViOS)</strong> • Cập nhật lần cuối: Tháng 09/2026
      </p>
    </div>

    <div class="legal-card bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-10 backdrop-blur-sm shadow-xl space-y-8 text-sm md:text-base leading-relaxed text-slate-300">
      <section class="space-y-3">
        <h2 class="text-xl md:text-2xl font-serif font-semibold text-amber-300 flex items-center gap-2">
          <span>1.</span> Giới Thiệu & Cam Kết Chung
        </h2>
        <p>
          Chào mừng quý bạn đến với ứng dụng <strong>Tử Vi Toàn Tập (ViOS)</strong>. Chúng tôi tôn trọng tuyệt đối quyền riêng tư và cam kết bảo vệ thông tin cá nhân của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu khi bạn sử dụng ứng dụng trên nền tảng Web, iOS (App Store) và Android (Google Play Store).
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl md:text-2xl font-serif font-semibold text-amber-300 flex items-center gap-2">
          <span>2.</span> Dữ Liệu Thu Thập & Mục Đích Sử Dụng
        </h2>
        <ul class="list-disc pl-5 space-y-2">
          <li>
            <strong>Thông tin ngày giờ sinh:</strong> Họ tên, ngày, tháng, năm và giờ sinh (Dương lịch hoặc Âm lịch), giới tính. Mục đích: Tính toán và an sao lá số Tử Vi, quẻ Kinh Dịch, Bát Tự và Hà Lạc theo thuật số truyền thống. Dữ liệu này chỉ phục vụ thuật toán chiêm bái của bạn.
          </li>
          <li>
            <strong>Tài khoản & Xác thực:</strong> Địa chỉ email (khi bạn chọn đăng ký bằng email hoặc tài khoản Google / Apple). Nếu sử dụng chế độ ẩn danh, hệ thống tự động cấp phiên làm việc ẩn danh mà không đòi hỏi bất kỳ thông tin nhận dạng cá nhân nào.
          </li>
          <li>
            <strong>Mã thông báo thông báo đẩy (FCM Token):</strong> Được lưu trữ để gửi thông điệp Khí Vận Nhật Khóa 07:00 sáng mỗi ngày hoặc các nhắc nhở chiêm bái quan trọng mà bạn đã cấp quyền.
          </li>
          <li>
            <strong>Hình ảnh diện mạo và chỉ tay:</strong> Chỉ thu thập khi bạn chủ động sử dụng tính năng xem tướng diện mạo / chỉ tay bằng AI. Hình ảnh chỉ được xử lý tức thời và không bị chia sẻ cho bất kỳ bên quảng cáo nào.
          </li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl md:text-2xl font-serif font-semibold text-amber-300 flex items-center gap-2">
          <span>3.</span> Quyền Thiết Bị Trên Di Động (Permissions)
        </h2>
        <ul class="list-disc pl-5 space-y-2">
          <li>
            <strong>Quyền Thông Báo (Push Notifications):</strong> Để gửi thông điệp Khí Vận Nhật Khóa hàng ngày và nhắc điểm danh nhận XU. Bạn có thể bật hoặc tắt quyền này bất cứ lúc nào trong cài đặt của thiết bị.
          </li>
          <li>
            <strong>Quyền Máy Ảnh & Thư Viện Ảnh (Camera & Photos):</strong> Dùng để chụp hoặc chọn ảnh diện mạo, chỉ tay phục vụ tính năng chiêm đoán nhân tướng hoặc lưu tài liệu lá số tử vi dạng hình ảnh.
          </li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl md:text-2xl font-serif font-semibold text-amber-300 flex items-center gap-2">
          <span>4.</span> Dịch Vụ Của Bên Thứ Ba
        </h2>
        <p>Ứng dụng có tích hợp một số dịch vụ hạ tầng chuẩn quốc tế đáng tin cậy:</p>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Supabase:</strong> Lưu trữ dữ liệu an toàn, mã hóa đầu cuối với các chính sách Row Level Security (RLS) nghiêm ngặt.</li>
          <li><strong>Google Firebase Cloud Messaging (FCM):</strong> Chuyển phát thông báo đẩy an toàn đến thiết bị Android và iOS.</li>
          <li><strong>Google AdMob:</strong> Hiển thị quảng cáo thưởng (Rewarded Ads) giúp người dùng nhận XU miễn phí.</li>
          <li><strong>RevenueCat:</strong> Xử lý thanh toán các gói đăng ký Hoàng Triều VIP thông qua In-App Purchase chính thống của Google Play và Apple App Store.</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl md:text-2xl font-serif font-semibold text-amber-300 flex items-center gap-2">
          <span>5.</span> Quyền Của Bạn & Xóa Dữ Liệu
        </h2>
        <p>
          Bạn có toàn quyền kiểm soát dữ liệu của mình:
        </p>
        <ul class="list-disc pl-5 space-y-2">
          <li>Xem, sửa hoặc xóa lịch sử các lá số và quẻ bói đã tạo trong mục Lịch Sử.</li>
          <li>Hủy bỏ quyền nhận thông báo đẩy trong phần Cài đặt thiết bị.</li>
          <li>
            <strong>Yêu cầu xóa toàn bộ tài khoản và dữ liệu:</strong> Bạn có thể gửi yêu cầu xóa tài khoản trực tiếp trong app hoặc qua email <code>support@tuvitoantap.app</code> / <code>galaxypro710@gmail.com</code>. Dữ liệu của bạn sẽ được xóa vĩnh viễn khỏi hệ thống trong vòng 24 giờ làm việc.
          </li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl md:text-2xl font-serif font-semibold text-amber-300 flex items-center gap-2">
          <span>6.</span> Thông Tin Liên Hệ
        </h2>
        <p>
          Mọi thắc mắc hoặc khiếu nại liên quan đến chính sách bảo mật, xin vui lòng liên hệ Ban Quản Trị:
        </p>
        <div class="contact-box p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm space-y-1">
          <p><strong>Dự án:</strong> Tử Vi Toàn Tập (ViOS)</p>
          <p><strong>Email Hỗ Trợ:</strong> <a href="mailto:galaxypro710@gmail.com" class="text-amber-400 hover:underline">galaxypro710@gmail.com</a></p>
          <p><strong>Trang Chủ & Bản Web:</strong> <a href="https://tuvitoantap.vercel.app" target="_blank" rel="noreferrer" class="text-amber-400 hover:underline">https://tuvitoantap.vercel.app</a></p>
        </div>
      </section>
    </div>
  </main>

  <footer class="legal-footer border-t border-slate-800 py-6 text-center text-xs text-slate-500">
    <p>© 2026 Tử Vi Toàn Tập (ViOS). Bản quyền thuộc về Hoàng Triều Chiêm Tinh.</p>
  </footer>
</div>

<style>
  :global([data-theme="light"]) .legal-page {
    background-color: #f7f4ed !important;
    color: #1e293b !important;
  }
  :global([data-theme="light"]) .legal-header {
    background-color: rgba(247, 244, 237, 0.85) !important;
    border-color: #e2d9c8 !important;
  }
  :global([data-theme="light"]) .page-title {
    color: #78350f !important;
  }
  :global([data-theme="light"]) .page-subtitle {
    color: #64748b !important;
  }
  :global([data-theme="light"]) .legal-card {
    background-color: rgba(255, 255, 255, 0.8) !important;
    border-color: #e2d9c8 !important;
    color: #334155 !important;
    box-shadow: 0 10px 25px -5px rgba(180, 130, 50, 0.08) !important;
  }
  :global([data-theme="light"]) .legal-card h2 {
    color: #92400e !important;
  }
  :global([data-theme="light"]) .contact-box {
    background-color: #fdfbf7 !important;
    border-color: #e2d9c8 !important;
    color: #1e293b !important;
  }
  :global([data-theme="light"]) .legal-footer {
    border-color: #e2d9c8 !important;
    color: #94a3b8 !important;
  }
</style>
