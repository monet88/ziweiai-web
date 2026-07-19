# Xuanshu Runtime Snapshot

Thư mục này là snapshot runtime nội bộ được vendor từ repo tham khảo `./.ref/xuanshu`.

Mục đích:

- cung cấp runtime cục bộ ổn định cho các bridge `liuyao`, `daliuren`, `qimen`
- loại bỏ phụ thuộc runtime vào `./.ref/xuanshu`
- giữ `.ref/xuanshu` chỉ còn vai trò repo nghiên cứu/đối chiếu

Nguyên tắc:

- chỉ bridge/server-side được phép dùng snapshot này
- nếu cần cập nhật thuật toán từ repo tham khảo, phải cập nhật snapshot này có chủ đích và re-verify toàn bộ các test bridge liên quan
- không import snapshot này vào `apps/app`
