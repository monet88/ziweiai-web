# BÁO CÁO NGHIỆM THU SPRINT 59: REFACTOR & PRODUCTION HARDENING CHO THƯ VIỆN HOÀNG TRIỀU & SECURITY DEBTS

**Thời gian thực hiện:** Ngày 10 Tháng 09 Năm 2026  
**Chiến dịch:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
**Quy chuẩn áp dụng:** `/vibe-git-manager`, `/vibe-engineering-workflow`, `/behavior-model-debugger`, Karpathy Guidelines.  
**Git Branch:** `feature/sprint-59-gallery-cloud-sync-refactor-and-hardening`  
**Rollback Anchor:** `62aa898`  

---

## 1. MỤC TIÊU SPRINT 59 (GOALS & OBJECTIVES)

Từ kết quả audit chuyên sâu snapshot Sprint 58, Sprint 59 được kích hoạt với nhiệm vụ trọng tâm:
1. **Khắc phục lỗi Supabase Migration Version Collision**:
   - Giải quyết xung đột trùng mã version `000021` giữa `000021_daily_referral_cap.sql` và `000021_user_notifications_fcm.sql`.
   - Đảm bảo script `scripts/check-supabase-migrations.zsh` đạt exit code 0.
2. **Nâng cấp Thư Viện Hoàng Triều (Royal Gallery Cloud Sync) từ Prototype thành Production-Grade**:
   - Cung cấp kiến trúc đồng bộ hai chiều (2-way delta sync) thực sự giữa Mobile (Flutter) và Web (SvelteKit).
   - Xử lý lưu trữ hình ảnh đa thiết bị qua Supabase Storage bucket `vision-uploads` (signed URLs TTL 7 ngày).
   - Thiết lập Server-Side VIP PRO Guard (`RoyalGalleryProGuard`) chặn hoàn toàn tài khoản vô danh (anonymous session).
   - Xử lý Soft Delete Tombstone (`deleted_at`) để tránh hiện tượng xóa trên thiết bị này lại bị thiết bị khác sync ngược lên (resurrection bug).
3. **Refactor Kiến Trúc Web SvelteKit theo Chuẩn `apps/web/AGENTS.md`**:
   - Loại bỏ hoàn toàn việc gọi trực tiếp Supabase SQL Client (`supabase.from('royal_gallery_shares')`) trong Svelte component.
   - Định nghĩa API client `apps/web/src/lib/api-client/gallery.ts` dùng Zod runtime validation và TanStack Query.
4. **Sửa Race Condition Âm Thanh Lễ Nghi trên Mobile**:
   - Đảm bảo `RitualAudioService` đã sẵn sàng đọc cấu hình âm lượng từ `SharedPreferences` trước khi phát hiệu ứng đầu tiên.
5. **Quality Gates Tuyệt Đối**:
   - Vượt qua 100% các validation gates nghiêm ngặt nhất: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `turbo run build`, `flutter analyze`, `flutter test`.

---

## 2. NHỮNG VIỆC ĐÃ THỰC HIỆN (ACTIONS TAKEN)

### A. Hạ tầng & Migration (`apps/api/supabase/migrations`)
- **Đổi tên migration:** Đổi `000021_daily_referral_cap.sql` thành `000025_daily_referral_cap.sql` (bảo toàn toàn bộ SQL logic, xóa trùng mã 21).
- **Cập nhật migration `000024_create_royal_gallery_shares.sql`:**
  - Bổ sung cột `storage_path text` lưu object key trên Supabase Storage.
  - Bổ sung cột `deleted_at timestamptz` phục vụ soft-delete tombstone delta sync.
  - Bổ sung cột `updated_at timestamptz` kèm Trigger tự động cập nhật timestamp khi sửa đổi.
  - Bổ sung index `idx_royal_gallery_owner_updated` trên `(owner_user_id, updated_at desc)`.
- **Kết quả gate migration:** `pnpm check:supabase-migrations` -> **PASS 100% (Exit 0)**.

### B. Shared Contracts (`packages/contracts`)
- Cập nhật `packages/contracts/src/persistence/royal-gallery.ts`:
  - Thêm `storagePath`, `updatedAt`, `deletedAt` vào `royalGalleryShareRecordSchema`.
  - Định nghĩa schema đồng bộ: `syncRoyalGalleryItemInputSchema`, `syncRoyalGalleryRequestSchema`, `syncRoyalGalleryResponseSchema`.
- Export đầy đủ sang CJS & ESM: `pnpm -F @ziweiai/contracts build` thành công.

### C. Backend API NestJS (`apps/api/src/modules/royal-gallery`)
- Xây dựng module mới `RoyalGalleryModule`:
  - `RoyalGalleryProGuard`: Kiểm tra JWT và chặn người dùng có `email == null` (chặn anonymous).
  - `RoyalGalleryService`:
    - `listShares(userId, limit)`: Truy vấn danh sách thiệp chưa xóa, tự động tạo signed URLs 3600s cho các item có `storage_path`.
    - `syncGallery(userId, body)`: Delta sync hai chiều, xử lý tombstone xóa, trả về mảng item đã merge.
    - `uploadCardImage(userId, cardId, fileBuffer, contentType)`: Upload nhị phân lên bucket `vision-uploads/royal-gallery/{userId}/{cardId}.webp` qua Supabase Storage API, cập nhật DB.
    - `deleteShare(userId, cardId)`: Soft delete bằng cách set `deleted_at = now()`.
  - `RoyalGalleryController`: Cung cấp 4 endpoints: `GET /gallery`, `POST /gallery/sync`, `POST /gallery/upload`, `DELETE /gallery/:id`.
  - Viết suite kiểm thử `royal-gallery.controller.test.ts` (5 tests). Toàn bộ 501 tests API passed.

### D. Web SvelteKit Refactor (`apps/web`)
- Tạo `apps/web/src/lib/api-client/gallery.ts` dùng `fetchJson` chuẩn hóa.
- Tái cấu trúc `apps/web/src/routes/(app)/gallery/+page.svelte`:
  - Loại bỏ dependency `supabaseClient` trong component.
  - Sử dụng `fetchGalleryShares(token)` lấy dữ liệu đã ký Signed URL từ API NestJS.
  - Hiển thị hình ảnh thiệp thật trên Grid và Modal chi tiết qua `item.imageUrl`.
  - Hỗ trợ xem ảnh, tải ảnh về máy và xóa thiệp thông qua API NestJS.
- `pnpm -F @ziweiai/web check`: **0 errors, 0 warnings**.
- `pnpm -F @ziweiai/web test`: **312/312 tests passed**.

### E. Mobile Client Upgrade (`apps/mobile`)
- **Sửa Race Condition Âm Thanh:**
  - Trong `apps/mobile/lib/core/services/ritual_audio_service.dart`: Thêm method `_ensureInitialized()` đảm bảo đọc `SharedPreferences` trước khi gọi `play()`. Khởi tạo `_init()` ngay trong constructor của `RitualAudioVolumeNotifier`.
- **Nâng cấp Model & Service Gallery:**
  - `RoyalShareItem`: Thêm `storagePath`, `imageUrl`, `updatedAt`, `deletedAt`, getter `isDeleted` và hàm `copyWith()`.
  - `RoyalGalleryService`:
    - Định nghĩa enum `SyncStatus` và class `SyncResult`.
    - Phương thức `saveItem`: Nếu là VIP PRO, tự động upload file nhị phân lên Supabase Storage bucket `vision-uploads`, lấy Signed URL 7 ngày và đồng bộ metadata lên table `royal_gallery_shares`.
    - Phương thức `deleteItem`: Đánh dấu tombstone `deleted_at = DateTime.now()` lên Supabase Cloud nếu là VIP PRO.
    - Phương thức `syncCloudGallery`: Kéo remote items, lọc tombstone, sinh signed URLs cho remote cards, đẩy các cards mới ở local lên Cloud, loại bỏ các cards đã xóa ở remote, trả về `SyncResult(status: SyncStatus.success, count: ...)`.
- **Nâng cấp Giao Diện & Thẻ Chia Sẻ:**
  - `royal_gallery_screen.dart`: Xử lý phản hồi `SyncResult`, render ảnh qua `Image.file` nếu có local file, fallback sang `Image.network` nếu là ảnh đồng bộ từ cloud.
  - Cập nhật 4 share cards (`royal_ziwei_share_card.dart`, `royal_sacred_stick_share_card.dart`, `royal_tarot_share_card.dart`, `royal_iching_share_card.dart`): Chuyển dialog sang `ConsumerStatefulWidget` và truyền `isPro: ref.read(isProUserProvider)` khi lưu thiệp.
- **Unit & Widget Test:**
  - Bổ sung test kiểm thử `SyncResult`, `copyWith`, `isDeleted` trong `apps/mobile/test/features/gallery/royal_gallery_test.dart`.
  - `flutter analyze lib/ test/`: **No issues found!**
  - `flutter test`: **141/141 tests passed!**

---

## 3. KẾT QUẢ KIỂM CHỨNG CHẤT LƯỢNG (QUALITY GATES SUMMARY)

| Validation Gate | Công cụ / Lệnh | Trạng thái | Chi tiết kết quả |
| :--- | :--- | :---: | :--- |
| **Migration Consistency** | `pnpm check:supabase-migrations` | **PASS** | 24 file migration hợp lệ, không còn trùng mã version (Exit code 0). |
| **Contracts Build** | `pnpm -F @ziweiai/contracts build` | **PASS** | Build CJS + ESM hoàn tất. |
| **ESLint & Code Style** | `pnpm lint` | **PASS** | 0 errors, 0 warnings toàn bộ repository. |
| **TypeScript Monorepo** | `pnpm typecheck` | **PASS** | 10/10 Turbo tasks thành công hoàn toàn. |
| **API Automated Tests** | `pnpm -F @ziweiai/api test` | **PASS** | **501/501 tests** passed (82 test files). |
| **Web Svelte Diagnostics** | `pnpm -F @ziweiai/web check` | **PASS** | 0 errors, 0 warnings. |
| **Web Automated Tests** | `pnpm -F @ziweiai/web test` | **PASS** | **312/312 tests** passed (58 test files). |
| **Core & Engine Tests** | `pnpm test` | **PASS** | 100% tests core & astro engine pass. |
| **Monorepo Production Build**| `pnpm exec turbo run build` | **PASS** | 6/6 build tasks pass trơn tru. |
| **Flutter Linter** | `flutter analyze lib/ test/` | **PASS** | 0 issues found. |
| **Flutter Mobile Tests** | `flutter test` | **PASS** | **141/141 tests** passed. |
| **Git Diff & Whitespace** | `git diff --check` | **PASS** | Không có lỗi whitespace hay trailing line thừa. |

**TỔNG CỘNG TEST SUITES TOÀN DỰ ÁN: 1,078 tests PASSED (100% Green).**

---

## 4. BẢO MẬT & SECRET HYGIENE
- Không có file `.env`, `.env.local`, API keys hoặc private tokens nào bị commit.
- Chặn cứng anonymous session truy cập endpoint đồng bộ đám mây tại tầng NestJS Guard (`RoyalGalleryProGuard`).
- Ảnh tải lên Supabase Storage được đặt trong đường dẫn phân lập theo `userId`: `royal-gallery/{userId}/{cardId}.webp`, đảm bảo nguyên tắc Data Isolation.

---

## 5. KẾT LUẬN & SẴN SÀNG TRIỂN KHAI
Sprint 59 đã giải quyết triệt để toàn bộ các món nợ kỹ thuật tồn đọng của Sprint 58, đưa tính năng Thư Viện Hoàng Triều trở thành tính năng đồng bộ đám mây thực thụ, sẵn sàng cho Production Deploy.
