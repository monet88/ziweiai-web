# Zero Hanzi characters in client and public UI

Các thư viện chiêm tinh và thuật số gốc sử dụng nhiều ký tự chữ Hán trong mã nguồn và dữ liệu xuất bản. Chúng tôi quyết định toàn bộ giao diện phía client và phản hồi API công khai phải là 100% tiếng Việt chuẩn, không chứa bất kỳ ký tự Hán nào (`\p{Script=Han}`), đồng thời bộ dịch `translateZiweiKey` phải báo lỗi ngay lập tức (fail-fast) nếu thiếu khóa thay vì ngầm trả về chữ Hán. Quyết định này bảo đảm trải nghiệm người dùng bản địa hoàn hảo và cho phép kiểm tra tự động bằng kiểm thử trên toàn bộ bản build.
