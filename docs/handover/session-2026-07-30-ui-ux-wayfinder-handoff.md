# Handoff: Chiến dịch UI/UX Mobile-First & Monetization

**Ngày:** 2026-07-30
**Trạng thái:** Bắt đầu Phase mới (UI/UX & Monetization) sau khi đã hoàn tất dọn nợ kỹ thuật Backend.

## 1. Tóm tắt Session trước (Những gì đã hoàn thành)
- **Kiến trúc Backend hoàn hảo:** Đã xé lẻ thành công "The God Class" `SupabasePersistenceGateway` thành các Repositories độc lập (Charts, Vision, History...).
- **QuotasService Rule Engine:** Đưa cơ chế đếm Quota vào `QuotasRegistry` tuân thủ OCP. Không còn hardcode.
- **Độ ổn định:** 100% API Tests (429/429) pass. Web Frontend typecheck thành công. Móng đã rất vững.

## 2. Bản đồ Wayfinder (The Map)

Đã thống nhất tạm gác việc thêm tính năng mới và nâng cấp AI để dồn toàn lực vào "cái phễu" giữ chân người dùng.

### Destination (Đích đến)
**Đại tu UI/UX Mobile-First (Premium Feel) để chuẩn bị cho chiến dịch Monetization.** 
Mục tiêu: Đạt đẳng cấp của một App Native chuyên nghiệp dù đang chạy PWA, tạo sự tin tưởng tuyệt đối (trust) để user sẵn sàng rút hầu bao.

### Notes (Lưu ý cho Agent tiếp theo)
- **Domain/Stack:** Frontend SvelteKit, PWA.
- **Kỹ năng (Skills) cần dùng:** `mobile-design` (bắt buộc cho touch targets, performance), `antigravity-design-expert` (nếu cần micro-animations, glassmorphism, UI huyền bí cao cấp), `/tdd` (cho logic hiển thị).
- **Nguyên tắc:** Tập trung vào trải nghiệm chạm (touch), tránh dùng Modal chói lóa, dùng Bottom Sheets, Skeleton, và Optimistic UI.

### Decisions so far
*(Chưa có, sẽ cập nhật khi giải quyết các ticket)*

### Not yet specified (Sương mù - Cần làm rõ và chia Ticket)
- **Khung giao diện (Layout & Theme):** Bảng màu Premium (Huyền bí, Dark mode/Glassmorphism). Thanh điều hướng dưới cùng (Bottom Navigation) chuẩn Mobile.
- **Trải nghiệm tương tác cốt lõi:**
  - Chuyển các Form nhập liệu Tử Vi/Xem ngày sang dạng **Bottom Sheet** mượt mà.
  - Animations lật bài Tarot, xin xăm chân thực.
- **Trải nghiệm chờ đợi (Loading UX):** Skeleton Loaders khi chờ AI (5-10s) thay vì cục spinner nhàm chán.
- **Luồng thu tiền (Monetization UI):** Màn hình Gói cước (Pricing), Paywall bị chặn khi hết Quota, và giao diện Wallet Top-up đẹp mắt, 1-2 chạm.

### Out of scope (Ngoài phạm vi)
- Thêm thuật số mới (Bát Tự, Tứ Trụ, v.v.).
- Tối ưu RAG / LLM Prompt (Sẽ làm ở Phase sau khi đã có user trả tiền).

---

## 3. Lệnh khởi động (Prompt) cho Session Mới

*(Copy đoạn dưới đây và dán vào cửa sổ chat mới để bắt đầu)*

```markdown
Chào bạn, hãy đọc file `docs/handover/session-2026-07-30-ui-ux-wayfinder-handoff.md`.

Chúng ta đang ở lộ trình `/wayfinder` với Đích đến là: "Đại tu UI/UX Mobile-First (Premium Feel) để chuẩn bị cho chiến dịch Monetization." 

Dựa trên phần "Not yet specified" trong file handoff, hãy sử dụng kỹ năng `/grilling` và `mobile-design` để bóc tách hạng mục đầu tiên: **Khung giao diện (Layout & Theme)** thành một Ticket cụ thể, sau đó gợi ý thiết kế hoặc Prototype cho tôi xem trước nhé.
```
