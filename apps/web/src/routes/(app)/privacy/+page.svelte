<script lang="ts">
  import { ArrowLeft } from 'lucide-svelte';
  import { resolve } from '$app/paths';
</script>

<svelte:head>
  <title>Chính sách Bảo mật - Tử Vi Toàn Tập</title>
</svelte:head>

<div class="max-w-3xl mx-auto p-4 md:p-8">
  <div class="mb-8">
    <a href={resolve('/')} class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4">
      <ArrowLeft class="w-4 h-4" />
      Quay lại
    </a>
    <h1 class="text-3xl font-bold text-slate-900">Chính sách Bảo mật</h1>
    <p class="text-slate-500 mt-2">Cập nhật lần cuối: Tháng 7 năm 2026</p>
  </div>

  <div class="prose prose-slate max-w-none">
    <h2>1. Thu thập Thông tin</h2>
    <p>Chúng tôi thu thập các thông tin cơ bản khi bạn sử dụng dịch vụ, bao gồm:</p>
    <ul>
      <li><strong>Thông tin tài khoản:</strong> Địa chỉ email khi bạn đăng ký.</li>
      <li><strong>Thông tin nhân trắc học:</strong> Họ tên, giới tính, ngày tháng năm sinh và giờ sinh (được lưu trữ để tạo và hiển thị lá số).</li>
      <li><strong>Dữ liệu sử dụng:</strong> Lịch sử truy vấn, nội dung hội thoại với AI nhằm cung cấp trải nghiệm liên tục.</li>
    </ul>

    <h2>2. Sử dụng Thông tin</h2>
    <p>Dữ liệu của bạn được sử dụng nhằm các mục đích sau:</p>
    <ul>
      <li>Cung cấp, duy trì và cá nhân hóa dịch vụ (như tính toán lá số và vận hạn).</li>
      <li>Sinh các văn bản phân tích và luận giải bằng các mô hình ngôn ngữ lớn (LLM). Dữ liệu gửi đi cho AI Provider (OpenAI, Google) đã được cấu hình không dùng để huấn luyện mô hình của họ.</li>
      <li>Phát hiện, ngăn chặn gian lận và các vấn đề bảo mật.</li>
    </ul>

    <h2>3. Lưu trữ và Bảo vệ Dữ liệu</h2>
    <p>Dữ liệu của bạn được lưu trữ an toàn trên hạ tầng của Supabase. Chúng tôi áp dụng các tiêu chuẩn mã hóa và bảo mật hiện đại để ngăn chặn truy cập trái phép. Mô hình uỷ quyền RLS (Row Level Security) đảm bảo chỉ bạn mới có quyền đọc và chỉnh sửa dữ liệu của mình.</p>

    <h2>4. Quyền của bạn (Your Rights & Data Deletion)</h2>
    <p>Bạn có toàn quyền kiểm soát dữ liệu cá nhân của mình:</p>
    <ul>
      <li><strong>Quyền truy cập và sửa đổi:</strong> Bạn có thể xem lại các lá số và hội thoại của mình trong ứng dụng.</li>
      <li><strong>Quyền xoá dữ liệu (Right to be Forgotten):</strong> Bạn có thể tự mình xóa vĩnh viễn tài khoản trong mục <strong>Cài đặt</strong>. Khi tài khoản bị xóa, toàn bộ dữ liệu (lá số, lịch sử, hội thoại) sẽ bị xóa khỏi cơ sở dữ liệu của chúng tôi và không thể khôi phục.</li>
    </ul>

    <h2>5. Chia sẻ Dữ liệu</h2>
    <p>Chúng tôi không bán hoặc cho thuê dữ liệu cá nhân của bạn cho bên thứ ba. Dữ liệu chỉ được chia sẻ trong phạm vi cung cấp dịch vụ (ví dụ: chuyển tên và ngày sinh cho AI để nhận luận giải), và được tuân thủ nghiêm ngặt qua các API bảo mật.</p>

    <h2>6. Liên hệ</h2>
    <p>Nếu bạn có câu hỏi hoặc cần hỗ trợ về quyền riêng tư, vui lòng liên hệ với chúng tôi.</p>
  </div>
</div>
