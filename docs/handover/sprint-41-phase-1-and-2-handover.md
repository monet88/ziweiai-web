# Sprint 41: Handover & Closeout Report — Phase 1 & Phase 2

**Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
**Thời gian:** 09/09/2026  
**Trạng thái nhánh Git:** `main` (Clean working tree, 0 uncommitted changes)  
**Commit Anchors:**
- Phase 1 Commit: `75f7733` (`feat(billing): harden money flow with automatic refunds and strict snapshot confidence gating`)
- Phase 2 Commit: `08b6e32` (`feat(privacy): support shared chart access via unguessable UUID with isOwner permission gates`)

---

## I. TỔNG QUAN VÀ MỤC TIÊU CỦA SPRINT 41

Sprint 41 tập trung giải quyết các bài toán hạ tầng cốt lõi (Core Invariants), tính bảo mật, toàn vẹn dòng tiền (Money Flow), quyền riêng tư lá số (Privacy & Shared Access) và trải nghiệm người dùng cao cấp.

Lộ trình Sprint 41 được chia thành 3 giai đoạn có ranh giới rõ ràng:
1. **Giai đoạn 1 (Phase 1):** Sửa triệt để Money Flow & Hoàn XU tự động (Auto-refund) khi LLM lỗi/timeout; Chặn đứng snapshot thiếu tin cậy (`blocksExactReading: true`) trước khi gọi AI hoặc trừ XU.
2. **Giai đoạn 2 (Phase 2):** Bảo mật & Quyền riêng tư lá số (Privacy & Shared Access Invariant); Khắc phục lỗi 404 NOT_FOUND khi khách mở link chia sẻ lá số; Phân quyền `isOwner` chặt chẽ nhằm bảo vệ tài nguyên và XU của chủ lá số.
3. **Giai đoạn 3 (Phase 3 - Kế tiếp):** Hạ tầng Quota & Rate Limit (Upstash Redis / Memory Store fallback, đồng bộ quota free vs pro) và Deploy Production Vercel.

---

## II. CHI TIẾT CÁC CÔNG VIỆC ĐÃ HOÀN THÀNH

### 1. Giai đoạn 1: Money Flow & Hoàn XU Tự Động (Auto-Refund) & Snapshot Eligibility Gate

#### A. Mục tiêu:
- Khắc phục tình trạng người dùng bị trừ XU nhưng không nhận được kết quả khi LLM provider gặp sự cố (timeout 504, 502 unavailable, 429 rate-limited).
- Đảm bảo AI chỉ luận giải trên dữ liệu đạt chuẩn độ tin cậy (`blocksExactReading: false`).

#### B. Các việc đã làm:
- **Tạo helper dùng chung:** `apps/api/src/common/entitlement/ai-snapshot-eligibility.ts` với hàm `assertChartSnapshotEligibleForAi`, ném `ApiErrorHttpException(400, 'INVALID_INPUT')` nếu snapshot bị gắn cờ `blocksExactReading: true`.
- **Áp dụng Gate đồng bộ:**
  - `ExplanationsService`: Kiểm tra trước khi gọi `deductXU`.
  - `ConversationsService`: Kiểm tra trước khi tạo hội thoại hoặc chat stream.
  - `AnnualReportService`: Kiểm tra trước khi sinh báo cáo năm.
- **Triển khai Auto-Refund (`addXU(userId, amount, 'ai_refund')`):**
  - Bọc khối `try...catch` sau khi đã `deductXU` thành công ở tất cả các service AI.
  - Nếu LLM downstream ném lỗi hoặc timeout, hoàn trả 100% XU về ví người dùng ngay lập tức.
  - Bổ sung auto-refund vào `RequireXU` Interceptor (`apps/api/src/common/interceptors/billing.interceptor.ts`).

#### C. Kết quả:
- Khách hàng không bao giờ bị mất tiền oan khi dịch vụ bên thứ 3 trục trặc.
- 10 unit tests mới xác thực tự động hoàn XU và chặn snapshot không đạt chuẩn.

---

### 2. Giai đoạn 2: Bảo Mật & Quyền Riêng Tư Lá Số (Shared Chart Access & isOwner Gating)

#### A. Mục tiêu:
- Giải quyết triệt để lỗi người dùng A bấm **"Chia Sẻ"** tạo link `https://tuvitoantap.vercel.app/share/charts/<uuid>`, người nhận B mở link bị redirect về `/charts/<uuid>` và bị API ném **404 NOT_FOUND**.
- Đảm bảo khách xem qua unguessable UUID xem được bàn lá số, vận hạn và bài luận giải có sẵn, nhưng **tuyệt đối không thể kích hoạt hành động gây trừ XU của chủ lá số**.

#### B. Các việc đã làm:
- **Contracts (`packages/contracts`):**
  - Mở rộng `chartDetailResponseSchema` trong `packages/contracts/src/api/backend-api.ts`: thêm `isOwner: z.boolean().default(true)`. Tương thích ngược 100%.
- **Backend API (`apps/api`):**
  - File `apps/api/src/modules/charts/services/charts.service.ts`:
    - `getChartDetail(userId, chartSnapshotId)`: Tìm lá số của `userId` trước; nếu không thấy, fallback sang `findPublicChartSnapshotById(chartSnapshotId)` và đánh dấu `isOwner = false`.
    - Ghi nhận `createHistoryView` cho chính caller hiện tại (khách xem), không làm ô nhiễm lịch sử của chủ lá số.
    - Lấy bài luận giải theo `chartRecord.ownerUserId` để khách xem được luận giải đã lưu của chủ nhân.
    - `computeHoroscope`: Cho phép fallback sang `findPublicChartSnapshotById(chartId)` để khách có thể tra cứu và tính toán vận hạn các năm trên lá số được chia sẻ mà không bị 404.
  - File `apps/api/src/modules/charts/services/charts.service.test.ts`:
    - Thêm 3 unit tests mới xác thực `isOwner=true`, `isOwner=false` và `computeHoroscope` cho khách.
- **Web Frontend (`apps/web`):**
  - File `apps/web/src/lib/features/chart/chart-detail-model.svelte.ts`: Expose derived state và getter `isOwner`.
  - File `apps/web/src/lib/features/chart/ChartDetailScreen.svelte`:
    - Cập nhật header eyebrow: thêm `" · Lá số được chia sẻ"` khi `!detail.isOwner`.
    - Thêm notice banner tinh tế cho khách xem ở đầu trang.
    - Ẩn nút tạo/tạo lại bài luận giải đối với khách; hiển thị thông báo nhẹ nhàng nếu chưa có luận giải.
    - Ẩn nút Báo cáo năm 20 XU (`AnnualReportButton`) khi `!detail.isOwner`.
    - Ẩn Trợ lý AI cá nhân (`AssistantPanel`) khi `!detail.isOwner`, thay bằng notice banner lịch thiệp mời tạo lá số riêng.
  - File `apps/web/src/lib/features/chart/chart-detail-shared-access.test.ts`:
    - Viết unit test mới cho schema validation và phân quyền `isOwner`.

#### C. Kết quả:
- Người dùng chia sẻ lá số hoạt động trơn tru 100%.
- Không gian unguessable UUID v4 ($2^{122}$ tổ hợp) bảo vệ lá số không bị index hay truy cập trái phép.
- Toàn bộ tài nguyên XU và quyền riêng tư của chủ lá số được bảo vệ tuyệt đối.

---

## III. BẢNG KIỂM TRA CHẤT LƯỢNG (VERIFICATION GATES)

Mọi thay đổi trong Sprint 41 Phase 1 & 2 đã vượt qua 100% các validation gates nghiêm ngặt nhất:

| Hạng mục kiểm tra | Lệnh thực thi | Kết quả | Chi tiết |
| :--- | :--- | :--- | :--- |
| **Contracts Build** | `pnpm -F @ziweiai/contracts build` | **PASS (0 errors)** | Đã build cả CJS & ESM |
| **API Typecheck** | `pnpm -F @ziweiai/api typecheck` | **PASS (0 errors)** | Không có lỗi TypeScript |
| **API Unit Tests** | `pnpm -F @ziweiai/api test` | **PASS (75/75 files)** | **458/458 tests pass** |
| **API Build** | `pnpm -F @ziweiai/api build` | **PASS (0 errors)** | NestJS build production sạch |
| **Web Svelte Check** | `pnpm -F @ziweiai/web check` | **PASS (0 errors, 0 warnings)** | 100% sạch sẽ |
| **Web Unit Tests** | `pnpm -F @ziweiai/web test` | **PASS (50/50 files)** | **272/272 tests pass** |

---

## IV. TRẠNG THÁI GIT & REPOSITORY HYGIENE

- **Nhánh hiện tại:** `main`
- **Chính sách Git:** Tuân thủ `/vibe-git-manager` — direct commit sạch sẽ trên `main`, thông điệp rõ ràng theo chuẩn Conventional Commits.
- **Kiểm tra Secret / Artifacts:**
  - Không có file `.env`, service keys, hay token nào bị lọt vào commit.
  - Working tree hoàn toàn sạch sẽ (`git status --short` trống).
- **Lịch sử commit mới nhất:**
  - `08b6e32` (HEAD -> main): `feat(privacy): support shared chart access via unguessable UUID with isOwner permission gates`
  - `75f7733`: `feat(billing): harden money flow with automatic refunds and strict snapshot confidence gating`

---

## V. ĐỊNH HƯỚNG BƯỚC TIẾP THEO (GIAI ĐOẠN 3 — SPRINT 41)

Khi mở session mới, Đại Ka có thể chọn một trong hai nhiệm vụ sau:

### Lựa chọn A: Thực hiện Giai đoạn 3 (Phase 3: Hạ tầng Quota & Rate Limit)
1. **Kiểm tra & chuẩn hóa Quota Counter Store:**
   - Đảm bảo `UpstashRestQuotaCounterStore` và `MemoryQuotaCounterStore` có cơ chế fail-mode an toàn (fail-closed hoặc fail-open tùy policy tài nguyên).
   - Kiểm tra cấu hình kết nối Redis Upstash trên môi trường production và biến môi trường `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
2. **Quota Tiering:**
   - Tách biệt rõ quota giữa người dùng Anonymous (IP-based limit) và người dùng đã đăng nhập (User ID-based limit).

### Lựa chọn B: Deploy Demo Production lên Vercel
1. Chạy lệnh deploy demo: `pnpm deploy:vercel-demo` với token `VERCEL_GALAXY`.
2. Kiểm tra health check và live smoke:
   - `https://tuvitoantap.vercel.app/api/health`
   - `https://tuvitoantap.vercel.app/api/features`
   - Kiểm tra luồng lập lá số anonymous -> xem chi tiết -> bấm chia sẻ -> mở link chia sẻ ở tab ẩn danh (khách xem).
