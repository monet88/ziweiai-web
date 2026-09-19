# Handover: Hoàn thiện Phase 4.2 (Observability) và Quét Kiến trúc (Phase 5)

## 1. Mục Tiêu (Goal)
- **Hoàn tất Phase 4.2:** Đảm bảo hệ thống giám sát (Observability) bằng Sentry và Langfuse có khả năng bắt lỗi chính xác và theo dõi chi phí AI thực tế (Prompt Tokens + Completion Tokens) trên Production.
- **Đánh giá Kiến trúc (Architecture Scan):** Dùng phương pháp `/improve-codebase-architecture` để rà soát mã nguồn (Codebase health), chuẩn bị dọn dẹp kỹ thuật trước khi bước vào các thay đổi lớn của Phase 5.

## 2. Công Việc Đã Thực Hiện (Work Done)
- **Tích hợp Sentry (Backend):**
  - Cập nhật `ApiErrorFilter` (`apps/api/src/common/http/api-error.filter.ts`). Bổ sung cơ chế tự động đính kèm `userId` (nếu người dùng đã đăng nhập) khi có lỗi 5xx xảy ra, giúp việc truy vết lỗi trên Sentry dễ dàng hơn.
- **Tích hợp Langfuse (AI Token Tracking):**
  - Cập nhật `LangfuseAiProviderWrapper` (`apps/api/src/providers/ai/langfuse-ai-provider-wrapper.ts`). Tính toán bổ sung `promptTokens` (bằng cách convert payload) và `totalTokens`, thay vì chỉ đo lường được `completionTokens`.
- **Khắc phục lỗi Test Frontend (Vitest):**
  - Fix lỗi virtual module `$env/dynamic/public` trong Vitest của SvelteKit bằng cách tạo `env-dynamic-public-stub.ts` và thiết lập alias trong `vitest.config.ts`. Toàn bộ 414 test API và 245 test Web đều vượt qua 100%.
- **Quét Kiến trúc (Architecture Scan):**
  - Tìm ra 2 điểm cấu trúc "nông" (shallow) cần cải thiện:
    1. **Xuanshu Runtime Seam:** Việc sử dụng `spawn()` để gọi `vendor/xuanshu-runtime` rất dễ sập trên Vercel Serverless và không hiệu quả về cold-start. Cần chuyển thành HTTP Service hoặc Bundle Node.
    2. **Global ZodValidationPipe:** Các Controller đang phải gọi hàm private `parseOrBadRequest` một cách thủ công. Có thể gom lại thành Global Pipe của NestJS.

## 3. Kết Quả (Result)
- Tính năng giám sát lỗi và chi phí AI đã hoàn toàn sẵn sàng cho Production.
- Không còn bất cứ test nào bị fail.
- Đã xác định rõ ràng hạng mục kỹ thuật cần giải quyết tiếp theo (Gia cố cầu nối Xuanshu).

## 4. Kế Hoạch Cho Session Tiếp Theo (Next Steps)
- Dồn lực giải quyết **Xuanshu Runtime Seam** để đảm bảo khả năng mở rộng (Scalability) của các tính năng Bói toán Lục Hào/Đại Lục Nhâm trên hạ tầng Serverless.
- Khởi động session mới với `/handoff` hoặc `/grill-with-docs` cho mục tiêu trên.
