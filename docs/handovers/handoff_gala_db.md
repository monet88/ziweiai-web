# Handoff: Tích Hợp Supabase Gala & Cập Nhật Môi Trường Máy Chủ

**Tạo lúc:** 20/07/2026
**Bối cảnh:** Session hiện tại đã kéo dài sau khi hoàn thành việc triển khai Backend API Demo lên server `newtop` (domain `ziwei.7app.online` qua Cloudflare Tunnel). Hệ thống đang chạy độc lập và cô lập tốt, không ảnh hưởng service khác.

## Trạng thái cấu hình hiện tại
- File `.env.local` trên máy dev (M1) **đã được cập nhật đầy đủ** và sạch sẽ với các thông số của dự án Supabase mới (Gala - URL: `nachzh...`). Các config cũ/dư thừa không còn tồn tại.
- File `galatuvi` lưu trữ backup các key của Gala, nội dung hoàn toàn khớp với `.env.local`.
- **TUY NHIÊN**, API đang chạy trên server `newtop` (process `ziwei-demo-api`) vẫn đang sử dụng file `.env` cũ chứa URL của Supabase cũ (`ttvqru...`).

## Nhiệm vụ cho Session Tiếp Theo
Hãy mở một session mới và copy nguyên văn đoạn prompt dưới đây:

---

> **Prompt cho Agent ở Session mới:**
> 
> "Chào bạn, hãy đọc bối cảnh công việc từ file `docs/handovers/handoff_gala_db.md`.
> Trong session trước, tôi đã deploy xong backend demo lên server `newtop` (`ziwei.7app.online`) và đã setup xong project Supabase mới tên là Gala. Ở máy local (M1), file `.env.local` đã có sẵn thông tin DB Gala này.
> 
> **Nhiệm vụ của bạn bây giờ là:**
> 1. Tích hợp Database Gala vào codebase: Chạy các script migrations/seed data (nếu có) từ repo lên DB Gala mới này để đảm bảo structure đầy đủ.
> 2. SSH vào server `newtop` (`ssh newtop-vpn`), đồng bộ/cập nhật lại file `~/deployments/ziweiai-demo/.env` bằng các key mới nhất của Gala (lấy từ `.env.local` ở máy M1).
> 3. Khởi động lại pm2 process `ziwei-demo-api` trên `newtop` để nhận biến môi trường mới.
> 4. Test một vòng end-to-end trên web/app để đảm bảo mọi thứ nói chuyện thông suốt với Database Gala."
