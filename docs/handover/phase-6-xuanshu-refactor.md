# Handover: Phase 6 - Xuanshu Runtime Refactor & Product Pivot

## 1. Mục Tiêu (Goal)
- **Tái cấu trúc (Refactor) Xuanshu Runtime Seam:** Loại bỏ điểm nghẽn kiến trúc bằng cách thay thế việc gọi Node.js `tsx` CLI (thông qua hàm `spawn()`) bằng việc import trực tiếp module nội bộ, nhằm tối ưu cold-start và memory khi deploy lên Vercel Serverless.
- **Quét Kiến trúc (Architecture Scan):** Dùng phương pháp `/improve-codebase-architecture` để tìm ra các "bottleneck" hoặc "shallow module" trong hệ thống nhằm nâng cao chất lượng code.

## 2. Công Việc Đã Thực Hiện (Work Done)
1. **Refactor Xuanshu Runtime:**
   - Chuyển toàn bộ thư mục `vendor/xuanshu-runtime` sang `packages/xuanshu-runtime` và khởi tạo như một workspace package (`@ziweiai/xuanshu-runtime`).
   - Xoá các runner cũ (`xuanshu-liuyao-runner.ts`, `xuanshu-qimen-runner.ts`...) sử dụng cơ chế IPC/spawn.
   - Cập nhật các Adapter chính (`liuyao-adapter.ts`, `daliuren-adapter.ts`, `qimen-adapter.ts`) trong `packages/astro-engine` để import các hàm tính toán (`createLiuYaoPaiPan`, v.v.) một cách đồng bộ.
   - Biên dịch thành công (build & typecheck) và vượt qua toàn bộ 35 unit test cũ (Zero regressions).
   - Đã tạo commit chốt hạ (`20a90a9`).

2. **Quét Kiến trúc & Chiến lược (Architecture Scan & Pivot):**
   - Đã phát hiện 2 cơ hội đào sâu kiến trúc (Deepening opportunities):
     - Biến `api-client/index.ts` (God Module > 500 dòng) thành các domain-specific clients.
     - Tách logic kiểm tra ví/trừ XU ra khỏi `charts.service.ts` để loại bỏ "domain leak".
   - **Quyết định (Decision):** Áp dụng nguyên tắc **YAGNI** (You Aren't Gonna Need It). Hủy bỏ việc sửa kiến trúc để tập trung toàn bộ nguồn lực vào **User Acquisition (Kéo người dùng)** cho MVP.

## 3. Kết Quả (Result)
- Toàn bộ luồng bói toán nâng cao (Lục Hào, Đại Lục Nhâm, Kỳ Môn) đã hết lỗi timeout và chạy với độ trễ tối thiểu (zero network latency) trên Serverless.
- Hệ thống đã sẵn sàng 100% để tập trung làm các tính năng Product mang tính chất Marketing.

## 4. Kế Hoạch Cho Session Tiếp Theo (Next Steps)
- Dựa trên quyết định tập trung vào Product, session tiếp theo sẽ triển khai một tính năng giúp **Viral / User Acquisition**. Đề xuất: **Tạo luồng Share Facebook/Zalo kết quả luận giải với hình ảnh đẹp (OG Image)** hoặc **Tối ưu Programmatic SEO cho các lá số**.
