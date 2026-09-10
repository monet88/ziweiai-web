# KẾ HOẠCH TOÀN DIỆN SPRINT 59: REFACTOR & HARDENING THƯ VIỆN HOÀNG TRIỀU & SECURITY DEBT

- **Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)
- **Mã Sprint:** Sprint 59 — Royal Gallery Cloud Sync Refactor & Production Hardening
- **Trọng tâm:** Chuyển đổi tính năng Cloud Sync từ mức **Prototype** lên **Production-Ready**, sửa lỗi Migration Gate, giải quyết ranh giới kiến trúc Web và xử lý nợ kỹ thuật bảo mật.
- **Rollback Anchor (Base Commit):** `62aa898`
- **Git Branch:** `feature/sprint-59-gallery-cloud-sync-refactor-and-hardening`
- **Phương pháp luận áp dụng:** `/vibe-engineering-workflow`, `/vibe-git-manager`, `/behavior-model-debugger` (Steve Ruiz UX & Invariant Methodology).

---

## I. TỔNG QUAN & BỐI CẢNH (CONTEXT & AUDIT FINDINGS)

### 1. Kết quả kiểm chứng độc lập sau Sprint 58
Sau khi hoàn tất phần âm thanh nghi lễ cung đình (đạt chất lượng tốt với độ trễ tối ưu, bộ điều khiển đầy đủ trên Mobile và Web Audio Synthesizer), đợt rà soát độc lập đã chỉ ra các lỗ hổng kỹ thuật nghiêm trọng trong tính năng **VIP PRO Gallery Cloud Sync**:

| Mức Độ | Mã Lỗi | Mô Tả Thực Tế | Hệ Quả Thực Tế |
|:---:|:---|:---|:---|
| **P0** | **Local Path Sync** | Mobile lưu absolute path của thiết bị (`/data/user/0/...`) lên database; không upload binary lên Supabase Storage. | Thiết bị B kéo metadata về bị lỗi "Ảnh không tồn tại trên thiết bị". Web chỉ hiển thị text giả lập. |
| **P0** | **VIP PRO Client-Only** | RLS migration chỉ kiểm tra `auth.uid() = owner_user_id`. Không có server-side entitlement check. Web query trực tiếp không check VIP. | Bất kỳ ai đăng nhập anonymous đều có thể đọc/ghi database qua Supabase SDK. |
| **P1** | **Manual Sync Only** | Các thẻ chia sẻ gọi `saveItem(item)` không truyền `isPro`, mặc định `false`, chỉ lưu local. | Không hề có "tự động đồng bộ chéo tức thì"; người dùng phải bấm sync thủ công. |
| **P1** | **Zombie Records** | "Xóa tất cả" (`clearAll`) chỉ xóa local; lần sync tiếp theo cloud đè ngược trở lại. Không có `deleted_at` (tombstone). | Dữ liệu người dùng đã xóa bị hồi sinh sau khi đồng bộ lại. |
| **P1** | **Duplicate Migration** | Trùng version `000021`: `000021_create_iching_draws.sql` và `000021_daily_referral_cap.sql`. | `pnpm check:supabase-migrations` bị **FAIL (Exit code 1)**. Migration `000024` chưa thể migrate lên production. |
| **P1** | **Web Architecture Drift** | `apps/web/src/routes/(app)/gallery/+page.svelte` gọi trực tiếp Supabase SDK trong component, bỏ qua Zod contract, cast `as any`. | Vi phạm quy ước kiến trúc `apps/web/AGENTS.md` (mọi data backend phải qua API client & TanStack Query). |
| **P1** | **Contract Mismatch** | Schema trong contracts là `royalGalleryShareRecordSchema`, thiếu `SyncRoyalGalleryResponseSchema`. Không có API endpoint nào dùng. | Contract thành code chết; không có sự đồng bộ giữa Web, API và Mobile. |
| **P2** | **Silent Failures** | Mobile `catch (_) { return 0; }` nuốt toàn bộ lỗi mạng/RLS/bảng chưa tạo. | UI luôn báo "Đồng bộ thành công! Hiện có 0 thiệp" gây hiểu lầm cho người dùng. |
| **P2** | **Audio Race Condition** | `RitualAudioService` init async, volume và mute mặc định phát trước khi load preferences hoàn tất. | Âm thanh có thể phát to ngay khi vừa mở app dù trước đó đã tắt âm. |
| **P2** | **Nợ Bảo Mật Runtime** | `pnpm audit --prod` còn 30 vulnerabilities (17 High, 9 Moderate, 4 Low) ở `multer`, `qs`, `body-parser`. | Nguy cơ bảo mật tiềm ẩn trên server production. |

---

## II. MỤC TIÊU SPRINT 59 (OBJECTIVES)

1. **Mục tiêu 1: Khắc phục triệt để Migration Gate:** Sửa lỗi duplicate version `000021` và đồng bộ ledger migration để `pnpm check:supabase-migrations` đạt **Exit code 0 (Pass)**.
2. **Mục tiêu 2: Kiến Trúc Lại Lưu Trữ Ảnh Đa Nền Tảng (True Multi-Device Media Sync):**
   - Thiết lập bucket private `royal-gallery-cards` trên Supabase Storage.
   - Khi xuất thiệp, render binary WebP/PNG, upload lên storage với path `{userId}/{cardId}.webp`.
   - Database chỉ lưu `storage_path`.
   - API cung cấp **Signed URL có thời hạn (1 giờ)** để Mobile và Web hiển thị ảnh thật 100%.
3. **Mục tiêu 3: Server-side VIP PRO Protection & API Module:**
   - Xây dựng module `RoyalGalleryModule` trong NestJS API (`apps/api/src/modules/royal-gallery`).
   - Bảo vệ endpoints bằng `JwtAuthGuard` và `ProEntitlementGuard` (hoặc RPC database xác thực bảng entitlements).
   - Chặn đứng hoàn toàn truy cập trái phép từ tài khoản miễn phí.
4. **Mục tiêu 4: Cơ Chế Đồng Bộ Hai Chiều Đầy Đủ & Xử Lý Xóa Vĩnh Viễn:**
   - Hỗ trợ Soft Delete với trường `deleted_at TIMESTAMP WITH TIME ZONE NULL`.
   - Đồng bộ dựa trên mốc thời gian `last_synced_at` và `updated_at`.
   - Khi xóa local, gửi tombstone lên server để xóa vĩnh viễn trên cloud, triệt tiêu 100% hiện tượng "Zombie hồi sinh".
5. **Mục tiêu 5: Refactor Web Gallery Đúng Ranh Giới Kiến Trúc:**
   - Loại bỏ hoàn toàn raw Supabase SDK trong `apps/web/src/routes/(app)/gallery/+page.svelte`.
   - Chuyển sang gọi backend API thông qua `src/lib/api-client` và TanStack Query.
   - Sử dụng Zod validation từ `@ziweiai/contracts`.
6. **Mục tiêu 6: Báo Lỗi Minh Bạch & Khắc Phục Race Condition:**
   - Trả về chi tiết trạng thái: `success`, `offline`, `forbiddenNotPro`, `error`.
   - UI hiển thị lỗi rõ ràng, không báo thành công giả.
   - Đảm bảo `RitualAudioService` hoàn tất tải preferences trước khi sẵn sàng phát âm thanh.
7. **Mục tiêu 7: Hardening Bảo Mật & Dependencies:**
   - Xử lý các dependency vulnerabilities từ `pnpm audit --prod`.
   - Bổ sung integration tests và E2E tests kiểm chứng luồng đồng bộ đa thiết bị.

---

## III. THIẾT KẾ KIẾN TRÚC MỤC TIÊU (TARGET ARCHITECTURAL BLUEPRINT)

```
                       ┌─────────────────────────────────────────┐
                       │           Mobile Flutter App            │
                       │ - Local SQLite / SharedPreferences      │
                       │ - Offline-first Sync Engine             │
                       └────────────────────┬────────────────────┘
                                            │ HTTP REST (JWT Bearer)
                                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          NestJS Backend API                            │
│                                                                        │
│  [RoyalGalleryController]                                              │
│  ├── GET    /api/gallery         -> Lấy danh sách thiệp (kèm Signed URL) │
│  ├── POST   /api/gallery/upload  -> Upload ảnh thiệp lên Storage       │
│  ├── POST   /api/gallery/sync    -> Đồng bộ Delta (updated_at)         │
│  └── DELETE /api/gallery/:id     -> Soft delete (tombstone)            │
│                                                                        │
│  Guards: [JwtAuthGuard] + [ProEntitlementGuard] (Server-side Enforced) │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌────────────────────────┐      ┌───────────────────────────┐
       │   Supabase Database    │      │     Supabase Storage      │
       │                        │      │                           │
       │ - royal_gallery_shares │      │ - Bucket: royal_gallery   │
       │ - RLS: Service Role    │      │   (Private, ACL Owner)    │
       │ - Cột: storage_path,   │      │ - Path:                   │
       │   deleted_at,          │      │   {userId}/{cardId}.webp  │
       │   updated_at (Trigger) │      │ - Signed URL (TTL 3600s)  │
       └────────────────────────┘      └───────────────────────────┘
                    ▲                                │
                    │ HTTP REST                      │ Signed Image URLs
                    │ (via api-client)               │
┌───────────────────┴────────────────────────────────┴───────────────────┐
│                           Web SvelteKit App                            │
│  - Trang: src/routes/(app)/gallery/+page.svelte                        │
│  - Data Fetching: TanStack Query + api-client                          │
│  - Validation: @ziweiai/contracts (Zod Schemas)                        │
│  - Rendering: Hiển thị ảnh thật từ Signed URLs                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## IV. BẢNG NHIỆM VỤ CHI TIẾT (STEP-BY-STEP TASKS BREAKDOWN)

### Task 1: Sửa Migration Gate & Cập Nhật Database Schema
- [ ] **1.1.** Đổi tên file `000021_daily_referral_cap.sql` thành `000022_daily_referral_cap.sql` (hoặc kiểm tra thứ tự migration chuẩn).
- [ ] **1.2.** Chạy `pnpm check:supabase-migrations` đảm bảo gate xanh (Exit code 0).
- [ ] **1.3.** Cập nhật file migration `000024_create_royal_gallery_shares.sql`:
  - Thêm cột `deleted_at TIMESTAMP WITH TIME ZONE NULL`.
  - Đổi tên `image_path` thành `storage_path VARCHAR(500) NULL` (lưu relative key).
  - Thêm trigger tự động cập nhật `updated_at` khi record thay đổi.
  - Bổ sung RLS policy kiểm tra `profiles.is_pro = true` hoặc thông qua RPC server.

### Task 2: Hoàn Thiện Packages Contracts (`@ziweiai/contracts`)
- [ ] **2.1.** Cập nhật `packages/contracts/src/persistence/royal-gallery.ts`:
  - `RoyalGalleryItemDtoSchema`: camelCase chuẩn (`id`, `cardType`, `title`, `subtitle`, `aspectRatio`, `customSealName`, `imageUrl`, `createdAt`, `updatedAt`, `deletedAt`).
  - `SyncRoyalGalleryRequestSchema`: Nhận `lastSyncedAt` và mảng `clientItems` (kèm cờ `isDeleted`).
  - `SyncRoyalGalleryResponseSchema`: Trả về `serverItems`, `deletedIds`, `serverTime`.
- [ ] **2.2.** Export tại `packages/contracts/src/index.ts` và chạy `pnpm -F @ziweiai/contracts build`.

### Task 3: Phát Triển Module Gallery Phía Backend API (`apps/api`)
- [ ] **3.1.** Tạo `apps/api/src/modules/royal-gallery/`:
  - `royal-gallery.controller.ts`: Các route `/api/gallery`, `/api/gallery/sync`, `/api/gallery/upload`.
  - `royal-gallery.service.ts`: Xử lý delta sync, sinh Signed URL từ Supabase Storage, soft delete.
- [ ] **3.2.** Tích hợp `ProEntitlementGuard` chặn đứng người dùng không có VIP PRO.
- [ ] **3.3.** Viết Unit & Controller tests cho module mới (`pnpm -F @ziweiai/api test`).

### Task 4: Nâng Cấp Mobile Client (`apps/mobile`)
- [ ] **4.1.** Sửa Race Condition Audio:
  - Khởi tạo `await initialize()` trước khi cho phép kích hoạt phát âm thanh.
- [ ] **4.2.** Nâng cấp `RoyalGalleryService`:
  - Khi lưu thiệp: Chụp ảnh render byte array, upload qua API backend lấy `storage_path`.
  - Lưu trữ local SQLite/SharedPreferences đầy đủ `storagePath`, `localPath`, `deletedAt`.
  - Khi xóa: Đánh dấu `deletedAt`, gửi tombstone lên server.
  - Khi sync: Xử lý 3 chiều (Thêm, Sửa, Xóa), không nuốt lỗi, trả về `SyncResult`.
- [ ] **4.3.** Cập nhật `RoyalGalleryScreen`:
  - Hiển thị thông báo trạng thái đồng bộ trung thực (Thành công, Lỗi mạng, Không có quyền VIP PRO).
  - Sử dụng ảnh local nếu có, fallback tải Signed URL về hiển thị.
- [ ] **4.4.** Cập nhật các màn hình Share Cards (`RoyalZiweiShareCard`, `RoyalSacredStickShareCard`, v.v.):
  - Truyền `isPro: ref.read(isProUserProvider)` khi gọi `saveItem`.

### Task 5: Refactor Web SvelteKit Gallery (`apps/web`)
- [ ] **5.1.** Xóa bỏ raw Supabase client trong `apps/web/src/routes/(app)/gallery/+page.svelte`.
- [ ] **5.2.** Tạo API client method trong `apps/web/src/lib/api-client/gallery.ts`.
- [ ] **5.3.** Sử dụng TanStack Query cho fetch và mutate dữ liệu gallery.
- [ ] **5.4.** Parse dữ liệu bằng Zod contract `@ziweiai/contracts`.
- [ ] **5.5.** Hiển thị ảnh thật từ Signed URL được API trả về, có skeleton loading và fallback error state.

### Task 6: Kiểm Thử Đa Tầng & Hardening Bảo Mật
- [ ] **6.1.** Viết integration test cho luồng Sync 2 thiết bị và tombstone delete.
- [ ] **6.2.** Cập nhật dependencies có lỗ hổng bảo mật: `multer`, `qs`, `body-parser`.
- [ ] **6.3.** Chạy toàn bộ Quality Gates:
  - `pnpm check:supabase-migrations` -> Exit 0.
  - `pnpm lint` -> 0 errors, 0 warnings.
  - `pnpm typecheck` -> 10/10 tasks successful.
  - `pnpm test` -> 100% tests passed.
  - `flutter analyze` & `flutter test` -> 0 issues, 100% passed.
  - `pnpm exec turbo run build --force` -> Clean build.

---

## V. TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

Một feature/refactor chỉ được coi là hoàn tất khi:
1. `check:supabase-migrations` chạy thành công không có lỗi trùng lặp.
2. Người dùng tạo thiệp trên Mobile (iPhone), ảnh được lưu trên Cloud Storage; sang iPad hoặc Web mở lên **thấy ảnh thật hiển thị trọn vẹn**, không bị lỗi missing file.
3. Người dùng miễn phí cố tình gọi API sync sẽ bị từ chối với mã lỗi `403 Forbidden` (`PRO_ENTITLEMENT_REQUIRED`).
4. Khi người dùng bấm "Xóa" hoặc "Xóa tất cả", dữ liệu trên cloud được cập nhật tombstone; các thiết bị khác khi sync **không bị hồi sinh thiệp cũ**.
5. Mọi tương tác mạng trên Web đều đi qua `api-client`, không có raw Supabase SQL gọi tự do từ component Svelte.
6. Khi mất mạng hoặc server lỗi, UI thông báo chính xác nguyên nhân, không hiển thị thông báo "Đồng bộ thành công" giả tạo.

---
*Kế hoạch được lập theo chuẩn Vibe Engineering Protocol & Steve Ruiz Behavioral Invariant Model. Sẵn sàng thực thi từng Task độc lập theo quy tắc Single Ticket Scope.*
