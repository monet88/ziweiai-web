# BÁO CÁO PHÂN TÍCH HÀNH VI, AUDIT PHẢN BIỆN & KẾ HOẠCH KHẮC PHỤC SPRINT 59–60
## (BEHAVIORAL AUDIT & REMEDIATION PLAN)

**Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
**Ngày thực hiện:** 10/09/2026  
**Quy chuẩn áp dụng:** `/vibe-engineering-workflow`, `/vibe-git-manager`, `/behavior-model-debugger`, `Karpathy Behavioral Guidelines`.  
**Feature Branch:** `feature/sprint-60-audit-hardening-and-architecture-fixes`  
**Rollback Anchor (Base Commit):** `d1828ef`  

---

## I. MỤC TIÊU (OBJECTIVES & AUDIT CONTEXT)

Tiếp thu 100% bản phản biện và audit chuyên sâu từ Đại Ka (Codex Audit), chúng ta nghiêm túc nhìn nhận:
- Các thay đổi trước đó đã giải quyết được migration collision `000021`, đưa Web gallery qua API NestJS và giữ các test suite xanh.
- **Tuy nhiên, hệ thống Gallery Cloud Sync, WebP compression, Storage Lifecycle và Audio Preloading vẫn còn những lỗ hổng thiết kế kiến trúc nghiêm trọng (Architectural & Behavioral Bugs).**
- Sprint 60 chưa đủ bằng chứng thực nghiệm (runtime evidence) để tuyên bố là production-ready hay hoàn hảo 100%.

**Mục tiêu của đợt công tác này:**
1. **Phân tích mô hình hành vi (Behavioral Reconstruction)** và xác minh từng dòng code đối với toàn bộ các phát hiện P0, P1, P2.
2. **Xây dựng Ma trận va chạm luật chơi (Invariant Collision Matrix)** làm rõ sự mâu thuẫn giữa các subsystem.
3. **Thiết lập kế hoạch hành động khắc phục từng bước (Actionable Remediation Roadmap)** theo thứ tự ưu tiên chuẩn xác nhất.
4. **Chuẩn hóa quy trình Git & Documentation trung thực**: Loại bỏ các claim giả định ("0ms", "CLS 0.00", "70-85%") khi chưa có benchmark đo kiểm trên thiết bị thực, cập nhật lại `walkthrough.md` và `implementation_notes.md`.

---

## II. NHỮNG VIỆC ĐÃ LÀM: PHÂN TÍCH MÔ HÌNH HÀNH VI & XÁC MINH CODE-LEVEL

Áp dụng phương pháp **Behavior-First Reverse Spec Debugging**, chúng tôi đã truy vết trực tiếp vào mã nguồn và xác minh chi tiết từng phát hiện:

### 1. Phân Tích Các Lỗi P0 (Nghiêm Trọng / Rủi Ro Mất Dữ Liệu & Gãy Luồng)

#### 🔴 P0-1: WebP Fallback tạo file PNG giả danh WebP
- **Hành vi người dùng**: Người dùng nhấn "Lưu Thư Viện" hoặc "Chia Sẻ" thẻ Tử Vi / Xin Xăm / Tarot / Lục Hào trên thiết bị không hỗ trợ codec native WebP hoặc khi thuật toán nén không làm giảm dung lượng.
- **Code hiện tại**:
  - `apps/mobile/lib/core/utils/royal_image_compressor.dart:26-38`: Khi `FlutterImageCompress` lỗi hoặc `compressed.length >= rawBytes.length`, hàm trả về mảng `rawBytes` (vốn là ảnh PNG gốc).
  - Cả 4 share cards (`royal_ziwei_share_card.dart:749`, `royal_sacred_stick_share_card.dart`, `royal_tarot_share_card.dart`, `royal_iching_share_card.dart`) luôn ghi ra file có đuôi `.webp`:
    ```dart
    final file = File('${tempDir.path}/ziwei_chart_${DateTime.now().millisecondsSinceEpoch}.webp');
    await file.writeAsBytes(compressedBytes);
    ```
  - `RoyalGalleryService.dart:140`: Kiểm tra `ext == 'webp'` và upload với header `contentType: 'image/webp'`.
- **Va chạm**: Trình duyệt, CDN hoặc ứng dụng xã hội nhận được file có magic bytes là PNG (`89 50 4E 47`) nhưng header MIME là `image/webp` và tên file `.webp`, dẫn đến lỗi hiển thị hoặc từ chối xử lý.
- **Trên Web**: `ViralReferralCardModal.svelte:239` cũng có nguy cơ tương tự khi fallback canvas trả về PNG nhưng tên file tải xuống vẫn gán `.webp`.

#### 🔴 P0-2: Ảnh Thư Viện Hoàng Triều bị pg_cron xóa sạch sau 7 ngày
- **Hành vi người dùng**: Người dùng VIP PRO lưu trữ các thiệp chiêm tinh quan trọng trong Thư Viện Hoàng Triều để lưu giữ kỷ niệm nhiều năm.
- **Code hiện tại**:
  - Migration `apps/api/supabase/migrations/000002_vision-uploads-bucket.sql:48-56`:
    ```sql
    perform cron.schedule(
      'vision-uploads-cleanup',
      '0 3 * * *',
      $job$
      delete from storage.objects
      where bucket_id = 'vision-uploads'
        and created_at < now() - interval '7 days';
      $job$
    );
    ```
- **Va chạm kiến trúc (Lifecycle Collision)**:
  - Bucket `vision-uploads` ban đầu được thiết kế cho tính năng chụp ảnh nhân tướng / chỉ tay tạm thời (US-017) với vòng đời 7 ngày.
  - Sprint 59 tái sử dụng bucket này cho Thư Viện Hoàng Triều với prefix `royal-gallery/{userId}/{cardId}` mà **không có mệnh đề loại trừ**.
  - **Hậu quả**: Toàn bộ ảnh thiệp của người dùng sẽ biến mất sau đúng 7 ngày, trong khi metadata trong bảng `royal_gallery_shares` vẫn còn, tạo ra hàng loạt thiệp bị vỡ ảnh (Broken Image)!

#### 🔴 P0-3: Mobile Direct Upload bị Storage RLS từ chối do sai cấu trúc Folder
- **Hành vi người dùng**: Người dùng Mobile lưu thiệp lên Cloud.
- **Code hiện tại**:
  - Migration `000002_vision-uploads-bucket.sql:16, 24, 32`:
    ```sql
    using (
      bucket_id = 'vision-uploads'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
    ```
    Yêu cầu folder đầu tiên `(storage.foldername(name))[1]` phải chính là User ID.
  - `apps/mobile/lib/features/gallery/data/royal_gallery_service.dart:146`:
    ```dart
    final storagePath = 'royal-gallery/$userId/$cardId.$ext';
    await _supabase.storage.from('vision-uploads').uploadBinary(storagePath, bytes, ...);
    ```
- **Va chạm**:
  - `(storage.foldername(storagePath))[1]` là `'royal-gallery'`, KHÔNG PHẢI `auth.uid()`.
  - Backend API upload thành công vì dùng `service_role` (bypass RLS).
  - Mobile client upload bằng Supabase JWT của user sẽ bị PostgreSQL Storage RLS chặn (403 Forbidden). Lỗi upload trong `RoyalGalleryService.saveShareCard()` bị try-catch nuốt, khiến metadata vẫn được upsert nhưng ảnh trên cloud không tồn tại!

#### 🔴 P0-4: `RoyalGalleryProGuard` không xác thực VIP PRO thực tế
- **Hành vi người dùng**: Người dùng đăng ký tài khoản miễn phí (Free Tier) bằng Email/Password.
- **Code hiện tại**:
  - `apps/api/src/modules/royal-gallery/royal-gallery.guard.ts:29-33`:
    ```ts
    if (!user.email) {
      throwGalleryProRequired();
    }
    ```
- **Va chạm**:
  - Guard chỉ kiểm tra `user.email != null` (chỉ loại trừ tài khoản ẩn danh anonymous).
  - Một tài khoản email miễn phí vẫn qua được guard này một cách hợp lệ.
  - Tuy nhiên, tên Class (`RoyalGalleryProGuard`), thông điệp lỗi (`...yêu cầu đặc quyền VIP PRO`) và giao diện Web/Mobile đều tuyên bố đây là tính năng VIP PRO. Thiếu hoàn toàn tầng kiểm tra subscription entitlement từ cơ sở dữ liệu.

---

### 2. Phân Tích Các Lỗi P1 (Toàn Vẹn Dữ Liệu & Bảo Mật)

#### 🟠 P1-1: Hồi sinh thẻ đã xóa (Tombstone Resurrection Bug)
- **Kịch bản tái hiện**:
  1. Người dùng dùng Thiết bị A xóa thiệp ID `#123`. Server ghi nhận `deleted_at = now()`.
  2. Thiết bị B (đang offline hoặc chưa sync) vẫn giữ thiệp `#123` với `isDeleted = false`.
  3. Thiết bị B kết nối mạng và gửi sync request lên `POST /gallery/sync`.
  4. `royal-gallery.service.ts:86-105`: Server thực hiện `upsert` với `deleted_at: null` và `updated_at: now` mà không kiểm tra xem server đã có tombstone chưa, hoặc không so sánh `item.updatedAt` của client với `updated_at` của server.
  5. Thẻ `#123` bị hồi sinh (resurrected) trên server và sau đó sync ngược về lại Thiết bị A!
  6. Ngoài ra, các câu lệnh `upsert`/`update` trong vòng lặp không kiểm tra `{ error }`, âm thầm bỏ qua các lỗi ghi cơ sở dữ liệu.

#### 🟠 P1-2: Server Pagination bị ngắt kết nối trên Web UI
- **Code hiện tại**:
  - `apps/web/src/routes/(app)/gallery/+page.svelte:38`: Gọi cứng `fetchGalleryShares(token, 100, 0)` một lần duy nhất lúc khởi tạo trang.
  - `visibleCount` chỉ cắt mảng 100 phần tử trên RAM trình duyệt thành các khối 12 thẻ.
- **Va chạm**:
  - Khi người dùng có >100 thiệp, thiệp thứ 101 trở đi không bao giờ được tải.
  - `hasMore`, `total` từ API không được sử dụng.
  - Đây chỉ là client-side array slicing, chưa phải là Infinite Scrolling hay Virtual Grid được hỗ trợ bởi Server như mục tiêu ban đầu.

#### 🟠 P1-3: Upload Endpoint thiếu kiểm định an toàn & Lỗ hổng Dependency
- **Code hiện tại**:
  - `apps/api/src/modules/royal-gallery/royal-gallery.controller.ts:56`: Chỉ dựa vào `file.mimetype` do client gửi lên.
  - Thiếu kiểm tra Magic Bytes thực tế (`PNG: 89 50 4E 47`, `WebP: 52 49 46 46 ... 57 45 42 50`).
  - Thiếu xác minh xem `cardId` có thuộc quyền sở hữu của `userId` hay không trước khi upload file.
  - Logger trong test API ghi nguyên stack trace có chứa thông tin định dạng connection string / credentials giả định.

---

### 3. Phân Tích Các Lỗi P2 (Độ Ổn Định, UX & Đảm Bảo Khách Quan)

#### 🟡 P2-1: Cơ chế "Audio RAM Preload" chưa hiệu quả & Race Condition
- **Code hiện tại**:
  - `apps/mobile/lib/core/services/ritual_audio_service.dart:129`:
    Mỗi lần phát âm thanh, service lại gọi `player.play(AssetSource(...))`. Trong thư viện `audioplayers`, hàm `play(Source)` sẽ thiết lập lại nguồn phát (setSource) từ đầu, vô hiệu hóa việc preload trước đó bằng `player.setSource()`.
  - Cờ `_initialized` chỉ là boolean, không có `Future<void>? _initFuture` dùng chung, dẫn đến việc nhiều consumer gọi cùng lúc sẽ kích hoạt `initialize()` trùng lặp.

#### 🟡 P2-2: Tuyên bố Hiệu năng (Performance Claims) thiếu bằng chứng đo kiểm thực tế
- Các chỉ số như *"Dung lượng 180-250KB"*, *"Giảm 70-85%"*, *"CLS = 0.00"*, *"Độ trễ âm thanh 0ms"* trong tài liệu trước đó là suy đoán lý thuyết (claims), chưa được chứng minh bằng telemetry hoặc benchmark đo kiểm trên thiết bị thực.
- Thiếu các bài test nén file ảnh mẫu thực tế (fixtures) và đo đạc kích thước bytes thực.

---

## III. MA TRẬN VA CHẠM LUẬT CHƠI (INVARIANT COLLISION MATRIX)

| Thành phần A | Thành phần B | Điểm Va Chạm (Collision Point) | Hậu Quả Thực Tế |
| :--- | :--- | :--- | :--- |
| **Mobile Image Compressor** | **Share Card File Writer** | Compressor fallback trả PNG, nhưng Writer ép đuôi `.webp` | File PNG giả danh WebP, CDN/Browser từ chối hiển thị |
| **Vision Cleanup Cron (7d)** | **Royal Gallery Storage** | Cron xóa mọi object trong bucket `vision-uploads` | Ảnh thiệp của user tự động biến mất sau 7 ngày |
| **Storage RLS Policy** | **Mobile Direct Upload Path** | RLS đòi folder là `userId`, mobile gửi `royal-gallery/...` | Direct upload bị 403, metadata mất liên kết ảnh |
| **RoyalGalleryProGuard** | **VIP PRO Entitlement Spec** | Guard chỉ kiểm tra `email != null`, không tra cứu subscription | Tài khoản Free Tier vẫn qua được guard |
| **Client Sync Request** | **Server Tombstone Status** | Client active item ghi đè `deleted_at: null` lên server | Thẻ đã xóa bị hồi sinh khi thiết bị khác sync lên |
| **Web Chunked Batching** | **Server Range Query API** | Web gọi `limit=100, offset=0` một lần duy nhất | Không tải được thiệp thứ 101 trở đi |
| **Audio Preload (`setSource`)** | **Audio Playback (`play`)** | `play(AssetSource)` re-load lại source từ đầu | Mất tác dụng preload, âm thanh vẫn có độ trễ |

---

## IV. KẾ HOẠCH HÀNH ĐỘNG KHẮC PHỤC TRIỆT ĐỂ (10-STEP REMEDIATION ROADMAP)

Để đảm bảo hệ thống thực sự đạt chuẩn **Production-Grade & Performance-Verified**, chúng tôi cam kết lộ trình 10 bước thực thi như sau:

### Bước 1: Chuẩn hóa Định dạng Nén Ảnh (Fix P0-1)
- **Mobile**:
  - Tạo cấu trúc dữ liệu `CompressedImageResult`:
    ```dart
    class CompressedImageResult {
      final Uint8List bytes;
      final String actualFormat; // 'webp' | 'png'
      final String mimeType;     // 'image/webp' | 'image/png'
      final String fileExtension;// 'webp' | 'png'
    }
    ```
  - Cả 4 share cards sử dụng `result.fileExtension` để đặt tên file và `result.mimeType` để upload.
- **Web**:
  - Cập nhật `image-compress.ts` trả về định dạng thực tế; `ViralReferralCardModal.svelte` lưu file với đúng extension `.webp` hoặc `.png`.

### Bước 2: Tách Biệt Bucket Storage Cho Thư Viện Hoàng Triều (Fix P0-2)
- Tạo migration mới `000026_create_royal_gallery_bucket.sql`:
  - Tạo bucket riêng biệt `royal-gallery` (private, không có scheduled cleanup xóa sau 7 ngày).
  - Thiết lập RLS policies cho bucket `royal-gallery` tương thích chuẩn với User ID.
  - Cập nhật cron job cũ của `vision-uploads` chỉ nhắm vào các object tạm thời (`palm/%`, `face/%`).

### Bước 3: Đưa Mobile Upload Hoàn Toàn Qua Backend API (Fix P0-3)
- Tái cấu trúc `RoyalGalleryService` trên Flutter:
  - Thay vì direct upload qua Supabase Storage client với user JWT (dễ bị RLS chặn), Mobile sẽ gọi endpoint API chuẩn của NestJS: `POST /gallery/upload` (multipart/form-data).
  - Đảm bảo tính đồng nhất 100% kiến trúc giữa Web và Mobile, bảo vệ logic upload tại máy chủ.

### Bước 4: Chuẩn Hóa VIP Entitlement Verification (Fix P0-4)
- Cập nhật `RoyalGalleryGuard`:
  - Đổi tên thành `IdentifiedUserGuard` nếu chính sách sản phẩm cho phép mọi user đã đăng nhập email được dùng Cloud Sync.
  - HOẶC tích hợp service kiểm tra entitlement `EntitlementService / BillingService` nếu bắt buộc phải là người dùng VIP PRO đã kích hoạt subscription.

### Bước 5: Khắc Phục Triệt Để Tombstone Resurrection & DB Error Handling (Fix P1-1)
- Trong `RoyalGalleryService.syncGallery()`:
  - Đọc trạng thái hiện tại của item trên server trước khi ghi đè.
  - Áp dụng nguyên tắc: **Tombstone mới hơn luôn thắng (`server.deleted_at != null` và `server.updated_at >= client.updated_at` thì không cho phép client active ghi đè)**.
  - Bắt buộc kiểm tra `error` trên toàn bộ các câu query của Supabase SDK, rollback hoặc ném lỗi có cấu trúc khi ghi DB thất bại.

### Bước 6: Kết Nối Server Pagination Thật Trên Web SvelteKit (Fix P1-2)
- Cập nhật `apps/web/src/routes/(app)/gallery/+page.svelte`:
  - Khởi tạo tải trang đầu tiên `limit = 12, offset = 0`.
  - `IntersectionObserver` khi chạm đáy sẽ gọi tiếp `fetchGalleryShares(token, 12, currentOffset)` nếu `hasMore == true`.
  - Nối thanh tìm kiếm và bộ lọc với API query hoặc quản lý cache danh sách cục bộ đúng cách.

### Bước 7: Gia Cố Bảo Mật Endpoint Upload & Audit Dependencies (Fix P1-3)
- Bổ sung kiểm tra Magic Bytes cho buffer ảnh trong `royal-gallery.service.ts` hoặc custom Pipe:
  - Kiểm tra 4 bytes đầu của PNG: `0x89, 0x50, 0x4E, 0x47`.
  - Kiểm tra header WebP: `RIFF....WEBP`.
- Nâng cấp `multer` và `qs` lên bản vá an toàn mới nhất để giải quyết các security advisories.
- Sanitize toàn bộ loggers, che giấu credentials và connection strings trong test/production logs.

### Bước 8: Tối Ưu Hóa Audio Service & Loại Bỏ Initialization Race (Fix P2-1)
- Trong `RitualAudioService` (Flutter):
  - Dùng `Future<void>? _initFuture` dùng chung để triệt tiêu hoàn toàn race condition khi nhiều widget gọi khởi tạo đồng thời.
  - Với các âm thanh đã preload, lưu đối tượng `Source` và sử dụng cơ chế phát thích hợp tránh nạp lại source từ disk.

### Bước 9: Xây Dựng Bộ Integration Tests Toàn Diện (Fix P2-2)
- Viết integration test thực thụ cho `RoyalGalleryService`:
  - Test kịch bản 2 thiết bị đồng bộ (A xóa, B sync -> tombstone không bị hồi sinh).
  - Test xử lý lỗi khi Storage upload thất bại.
  - Test phân trang với `offset` và `limit`.
  - Test kiểm tra quyền truy cập chéo giữa User A và User B.

### Bước 10: Đo Lường Thực Nghiệm & Cập Nhật Tài Liệu Trung Thực
- Chạy benchmark nén ảnh trên file fixtures thật, ghi nhận dung lượng bytes trước và sau nén.
- Loại bỏ các thuật ngữ "0ms", "CLS 0.00", "70-85%" không có căn cứ khỏi `walkthrough.md`, `implementation_notes.md` và các báo cáo.
- Cập nhật `walkthrough.md` phản ánh đúng Sprint 59 và Sprint 60 với các link markdown chuẩn.

---

## V. KẾT LUẬN & CAM KẾT

Tập thể Antigravity xin trân trọng cảm ơn bản audit sâu sắc và sắc bén của Đại Ka. Toàn bộ các vấn đề đã được bóc tách tận gốc nguyên nhân và đưa vào kế hoạch xử lý ngay lập tức trên branch `feature/sprint-60-audit-hardening-and-architecture-fixes`.

Chúng tôi sẽ triển khai lần lượt từng vertical ticket, đảm bảo mọi bước đều có **bằng chứng kiểm thử thực tế (Execution Evidence)** trước khi báo cáo hoàn tất!
