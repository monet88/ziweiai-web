<script lang="ts">
  import { ArrowLeft } from 'lucide-svelte';
  import { resolve } from '$app/paths';
</script>

<svelte:head>
  <title>Điều khoản Dịch vụ - Tử Vi Toàn Tập</title>
</svelte:head>

<div class="max-w-3xl mx-auto p-4 md:p-8">
  <div class="mb-8">
    <a href={resolve('/')} class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4">
      <ArrowLeft class="w-4 h-4" />
      Quay lại
    </a>
    <h1 class="text-3xl font-bold text-slate-900">Điều khoản Dịch vụ</h1>
    <p class="text-slate-500 mt-2">Cập nhật lần cuối: Tháng 7 năm 2026</p>
  </div>

  <div class="prose prose-slate max-w-none">
    <h2>1. Chấp nhận Điều khoản</h2>
    <p>Bằng việc truy cập và sử dụng ứng dụng Tử Vi Toàn Tập, bạn đồng ý tuân thủ các Điều khoản Dịch vụ này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản, vui lòng không sử dụng dịch vụ của chúng tôi.</p>

    <h2>2. Bản chất Dịch vụ</h2>
    <p>Tử Vi Toàn Tập cung cấp các công cụ lập lá số và phân tích dựa trên thuật toán và trí tuệ nhân tạo (AI). Mọi kết quả luận giải chỉ mang tính chất tham khảo, giải trí và chiêm nghiệm. Chúng tôi không chịu trách nhiệm cho bất kỳ quyết định cá nhân, tài chính, y tế hoặc pháp lý nào của bạn dựa trên kết quả từ ứng dụng.</p>

    <h2>3. Tài khoản Người dùng</h2>
    <ul>
      <li>Bạn có trách nhiệm bảo mật thông tin đăng nhập của mình.</li>
      <li>Bạn có thể yêu cầu xóa tài khoản và dữ liệu cá nhân bất kỳ lúc nào thông qua phần Cài đặt trong ứng dụng.</li>
      <li>Chúng tôi có quyền đình chỉ hoặc chấm dứt tài khoản nếu phát hiện hành vi vi phạm điều khoản.</li>
    </ul>

    <h2>4. Dịch vụ Trả phí</h2>
    <p>Một số tính năng nâng cao có thể yêu cầu thanh toán (sử dụng tín dụng/XU). Việc mua XU là không hoàn lại trừ trường hợp do lỗi kỹ thuật nghiêm trọng từ phía hệ thống.</p>

    <h2>5. Sửa đổi Điều khoản</h2>
    <p>Chúng tôi bảo lưu quyền sửa đổi các điều khoản này bất kỳ lúc nào. Những thay đổi sẽ có hiệu lực ngay khi được đăng tải trên ứng dụng.</p>

    <h2>6. Liên hệ</h2>
    <p>Nếu bạn có bất kỳ câu hỏi nào về Điều khoản Dịch vụ, vui lòng liên hệ với chúng tôi qua email hỗ trợ trên trang chủ.</p>
  </div>
</div>
