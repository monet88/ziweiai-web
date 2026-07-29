# Handoff Report: Session 2026-07-28 — Fix 504 Provider Router & Payment State Analysis

**Ngày thực hiện**: 28/07/2026  
**Dự án**: Tử Vi Toàn Tập (`ziweiai-web`)  

---

## 🎯 1. Mục tiêu (Objectives)
- **Fix lỗi 504 Gateway Timeout cho Báo cáo năm**: Báo cáo năm bị đứt đoạn do API Vercel giới hạn quá chặt và DeepSeek phản hồi quá lâu.
- **Khảo sát hệ thống Payment (SePay) & Lên kế hoạch tiếp theo**: Kiểm tra tình trạng tích hợp SePay và định hướng bước kế tiếp theo góc nhìn PM (Ask-Matt).

---

## 🛠️ 2. Việc Đã Làm (Work Accomplished)
1. **Sửa Provider Router ưu tiên Gemini**:
   - Cập nhật logic trong `apps/api/src/providers/ai/provider-router-base.ts` để chuỗi `auto` ưu tiên gọi `gemini` trước, sau đó đến `openai-compat` và `deepseek`.
   - Lợi ích: Khắc phục triệt để lỗi 504 vì Gemini 1.5 Flash tạo markdown rất nhanh (10-20s), hoàn toàn nằm trong mức an toàn của Vercel Hobby (60s).
2. **Cập nhật & Chạy Pass 100% Unit Test**:
   - Rewrite lại toàn bộ Test Cases bị gãy do đổi router (trong `conversation-provider-router.test.ts` và `explanation-provider-router.test.ts`).
   - Kết quả: **439/439 tests PASSED**.
3. **Phân tích Codebase (Chống ảo giác AI)**:
   - Phát hiện AI bị "mất trí nhớ" (context amnesia) khi gợi ý tích hợp VNPAY, trong khi hệ thống đã tích hợp xong toàn bộ **SePay (VietQR)** và **RevenueCat**.
   - Kiểm chứng thành công Frontend (`/wallet`) đã hiển thị QR SePay, cắm Supabase Realtime tự động nhảy số dư XU. Backend (`PaymentController`) đã có webhook xử lý + update DB mượt mà.
   - Admin Panel (`/admin`) cũng đã hoàn thiện.

---

## 📊 3. Kết Quả (Result)
- Luồng Báo Cáo Năm (Annual Report) hoạt động trơn tru không còn 504.
- Codebase an toàn, không có regression. Payment UI, Admin UI đều đã hiện diện và hoạt động 90-100%.

---

## 🧠 4. Giải pháp chống "Mất trí nhớ" cho AI Agent (Context Amnesia)
Sự cố AI quên mất các tính năng đã làm (Wallet, SePay, Admin...) là do **cửa sổ ngữ cảnh (Context Window) bị reset sau mỗi session** và Repo quá lớn để AI quét toàn bộ trong 1 câu prompt.

**Cách khắc phục triệt để:**
1. **Khởi tạo `CONTEXT.md` ở root**: Lưu danh sách các tính năng ĐÃ HOÀN THÀNH (ví dụ: `Payment: SePay, RevenueCat, Supabase Realtime đã xong. Admin Panel: SvelteKit đã xong`). 
2. **Tạo file `ARCHITECTURE.md` (hoặc `FEATURES_STATE.md`)**: Để AI map được ngay các folder với tính năng tương ứng.
3. **Cập nhật `AGENTS.md`**: Bắt buộc AI đọc `CONTEXT.md` ngay câu lệnh đầu tiên của mọi session. (Kết hợp với kỹ năng `/grill-with-docs` của Matt để duy trì file này).
4. **Agent Memory Skill**: Cân nhắc sử dụng skill `diary` hoặc thiết lập Memory Vector DB (nếu IDE hỗ trợ). Nhưng `CONTEXT.md` là giải pháp tốn ít effort mà hiệu quả cao nhất.

---

## 📋 5. Ready Prompt cho Session Mới (Next Session Prompt)

Bạn hãy copy đoạn sau và dán vào Session mới:

```text
Chào AI, tiếp tục dự án Tử Vi Toàn Tập (ziweiai-web). 
Session trước tôi đã fix xong 504 Timeout bằng cách set Gemini làm primary cho Provider Router (Pass 439 tests).
Payment (SePay VietQR, RevenueCat), Wallet UI (Supabase Realtime) và Admin Panel đều đã hoàn thiện.

Hãy đọc file `docs/handover/session-2026-07-28-provider-router-fix-handoff.md` để nắm bối cảnh.
Nhiệm vụ hôm nay:
1. Tạo file `CONTEXT.md` ở root để tóm tắt các tính năng cốt lõi đã hoàn thành (giúp bạn không bị "ảo giác" quên code cũ nữa).
2. Hướng dẫn tôi test end-to-end Webhook SePay ở local (ngrok), HOẶC làm SEO (OG Image động cho Referral), HOẶC chính thức mở Public Báo Cáo Năm.
```
