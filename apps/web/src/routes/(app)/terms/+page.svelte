<script lang="ts">
  import { ViOSLogo } from '$lib/components/ui';
  import { resolve } from '$app/paths';
</script>

<svelte:head>
  <title>Điều Khoản Dịch Vụ • Tử Vi Toàn Tập</title>
  <meta
    name="description"
    content="Điều khoản dịch vụ và quy định chiêm bái thuật số của ứng dụng Tử Vi Toàn Tập (ViOS) trên nền tảng Web và Thiết bị di động."
  />
</svelte:head>

<div class="legal-page min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
  <header class="legal-header border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href={resolve('/')} class="flex items-center gap-2 text-decoration-none text-slate-100">
        <ViOSLogo />
        <span class="font-serif font-bold text-amber-200 text-lg hidden sm:inline">Tử Vi Toàn Tập</span>
      </a>
      <a
        href={resolve('/')}
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
        Điều Khoản Dịch Vụ & Chiêm Bốc
      </h1>
      <p class="page-subtitle text-sm md:text-base text-slate-400">
        Ứng dụng <strong class="text-amber-300">Tử Vi Toàn Tập (ViOS)</strong> • Phiên bản cập nhật: Tháng 09/2026
      </p>
    </div>

    <div class="legal-card bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-10 backdrop-blur-sm shadow-xl space-y-8 text-sm md:text-base leading-relaxed text-slate-300">
      <section class="space-y-3">
        <h2 class="text-xl md:text-2xl font-serif font-semibold text-amber-300 flex items-center gap-2">
          <span>1.</span> Chấp Thuận Điều Khoản
        </h2>
        <p>
          Bằng việc truy cập, tải về hoặc sử dụng bất kỳ phần nào của ứng dụng <strong>Tử Vi Toàn Tập (ViOS)</strong> trên Web, iOS hoặc Android, quý bạn xác nhận đã đọc kỹ, thấu hiểu và đồng ý hoàn toàn với các Điều khoản Dịch vụ này. Nếu không đồng ý với bất kỳ điều khoản nào, quý bạn vui lòng ngừng sử dụng dịch vụ.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl md:text-2xl font-serif font-semibold text-amber-300 flex items-center gap-2">
          <span>2.</span> Bản Chất Dịch Vụ & Tinh Thần Khâm Thiên Giám
        </h2>
        <p>
          Tử Vi Toàn Tập là nền tảng số hóa di sản thuật số phương Đông (Tử Vi Đẩu Số, Kinh Dịch Lục Hào, Bát Tự Hà Lạc, Kỳ Môn Độn Giáp, Mai Hoa Dịch Số, Nhân Tướng Học, Bài Tây Lenormand & Tarot) kết hợp trí tuệ nhân tạo (AI) chuyên sâu:
        </p>
        <ul class="list-disc pl-5 space-y-2">
          <li>Mọi kết quả luận giải, an sao, quẻ chiêm bốc và phân tích vận hạn được tạo ra nhằm mục đích <strong>chiêm nghiệm văn hóa, giải trí, bồi dưỡng tâm tính và tham khảo định hướng</strong>.</li>
          <li>Hệ thống <strong>không đưa ra lời khuyên y tế, chuẩn đoán pháp lý, cam kết tài chính hay thay thế các quyết định hệ trọng trong đời thực</strong>. Người dùng tự chịu trách nhiệm hoàn toàn cho các quyết định cá nhân trong cuộc sống.</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl md:text-2xl font-serif font-semibold text-amber-300 flex items-center gap-2">
          <span>3.</span> Tài Khoản, Bảo Mật & Quyền Hạn
        </h2>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Phiên Ẩn Danh:</strong> Quý bạn có thể trải nghiệm ngay mà không cần cung cấp danh tính. Dữ liệu phiên ẩn danh gắn liền với thiết bị và trình duyệt hiện tại.</li>
          <li><strong>Tài Khoản Xác Thực:</strong> Khi đăng ký bằng Email, Google hoặc Apple ID, dữ liệu lá số và số dư ví XU của quý bạn sẽ được bảo lưu vĩnh viễn trên hạ tầng đám mây an toàn.</li>
          <li><strong>Bảo Mật:</strong> Quý bạn có trách nhiệm bảo mật thiết bị và tài khoản đăng nhập của mình. Quý bạn có quyền yêu cầu xóa tài khoản và toàn bộ dữ liệu bất kỳ lúc nào tại mục Cài Đặt.</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl md:text-2xl font-serif font-semibold text-amber-300 flex items-center gap-2">
          <span>4.</span> Đơn Vị Tín Dụng XU & Gói Dịch Vụ Hoàng Triều VIP
        </h2>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Đơn Vị XU:</strong> Hệ thống sử dụng đơn vị XU để chi trả cho các lượt gọi AI chuyên sâu (gieo quẻ Lục Hào, luận giải cung sao chi tiết, xem tướng ảnh). Người dùng có thể nhận XU miễn phí qua điểm danh mỗi ngày (Daily Check-in), xem video thưởng, hoặc thỉnh các gói nạp XU.</li>
          <li><strong>Chính Sách Hoàn Tiền:</strong> Các gói XU và gói đăng ký Hoàng Triều VIP được xử lý tự động qua cổng thanh toán bảo mật (SePay ngân hàng nội địa, Google Play Billing hoặc Apple App Store In-App Purchases). Do tính chất hàng hóa kỹ thuật số tiêu dùng tức thì, giao dịch mua XU không được hoàn lại trừ trường hợp phát sinh lỗi kỹ thuật hệ thống đã được xác nhận.</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl md:text-2xl font-serif font-semibold text-amber-300 flex items-center gap-2">
          <span>5.</span> Bản Quyền & Sở Hữu Trí Tuệ
        </h2>
        <p>
          Toàn bộ thiết kế giao diện Hoàng Triều, biểu tượng ViOS, đồ họa lá số, thuật toán an sao độc quyền và cấu trúc tri thức Khâm Thiên Giám thuộc quyền sở hữu trí tuệ của dự án Tử Vi Toàn Tập. Nghiêm cấm mọi hành vi sao chép, dịch ngược mã nguồn (reverse engineer) hoặc khai thác thương mại khi chưa có sự chấp thuận bằng văn bản.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl md:text-2xl font-serif font-semibold text-amber-300 flex items-center gap-2">
          <span>6.</span> Cập Nhật Điều Khoản & Liên Hệ Hỗ Trợ
        </h2>
        <p>
          Ban Quản Trị có quyền điều chỉnh nội dung điều khoản để phù hợp với sự phát triển của dịch vụ và quy định pháp luật hiện hành. Những thay đổi sẽ có hiệu lực ngay khi được công bố trên ứng dụng.
        </p>
        <div class="contact-box p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm space-y-1">
          <p><strong>Cơ Quan Điều Hành:</strong> Hoàng Triều Chiêm Tinh ViOS</p>
          <p><strong>Thư Điện Tử Hỗ Trợ:</strong> <a href="mailto:galaxypro710@gmail.com" class="text-amber-400 hover:underline">galaxypro710@gmail.com</a></p>
          <p><strong>Trang Chủ Trực Tuyến:</strong> <a href="https://tuvitoantap.vercel.app" target="_blank" rel="noreferrer" class="text-amber-400 hover:underline">https://tuvitoantap.vercel.app</a></p>
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
