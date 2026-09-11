# IMPLEMENTATION NOTES: SPRINT 59 REFACTOR & HARDENING

## 1. Unspecified & Implicit Decisions
- **Migration Version Selection:** Đổi `000021_daily_referral_cap.sql` thành `000025_daily_referral_cap.sql`. Quyết định giữ `000021_user_notifications_fcm.sql` vì notification module đã được tích hợp trước đó, trong khi referral cap chạy độc lập trên layer monetization.
- **Signed URL TTL Strategy:** URL ký danh phía API backend trả về có TTL 3600 giây (1 giờ) cho web client, trong khi Mobile upload trực tiếp tạo URL 7 ngày.
- **Multer Interface Typing:** Thay vì thêm package `@types/multer` vào devDependencies gây phình node_modules, ta khai báo `interface UploadedImageFile` cục bộ theo đúng pattern đã dùng trong `apps/api/src/modules/vision-shared/vision-analysis.controller.ts`.
- **Service Worker PWA Hardening:**
  - Chặn triệt để request scheme không phải `http/https` (đặc biệt là `chrome-extension:` và `moz-extension:`) trước khi gọi `cache.put()`, loại bỏ lỗi `TypeError: Request scheme 'chrome-extension' is unsupported`.
  - Chuyển đổi chiến lược điều hướng trang HTML (`request.mode === 'navigate'`) sang **Network-First**: luôn lấy `index.html` mới nhất từ Vercel để khớp hash bundle JS, chỉ fallback về cache khi offline.
  - Ngăn chặn cache các response dạng `text/html` khi request là file asset JS/CSS (tránh cache nhầm trang 404 SPA fallback HTML).
  - Tự động xóa sạch các version cache cũ (`vios-cache-v1`, `vios-cache-v2`) khi activate `vios-cache-v3`.
  - Tích hợp self-healing handler trong `app.html`: tự động unregister SW và xóa cache nếu gặp lỗi dynamic import mismatch sau deploy.

## 2. Deviations from Specification
- Không có sự sai lệch nào so với mục tiêu ban đầu của Sprint 59.

## 3. Considered Trade-offs
- **Hard Delete vs. Soft Delete Tombstone:**
  - *Hard Delete:* Đơn giản, giải phóng bộ nhớ DB ngay lập tức. Tuy nhiên, trong môi trường đa thiết bị (Web + Mobile), khi thiết bị A xóa thẻ và thiết bị B đồng bộ dữ liệu local của nó lên Cloud, thẻ đã xóa sẽ bị "hồi sinh" (resurrection).
  - *Soft Delete Tombstone (`deleted_at`):* Giữ bản ghi tombstone để mọi client khi delta sync đều biết thẻ đã bị hủy.
- **Direct Supabase Call vs. API Gateway trên Web:**
  - *Direct Call:* Viết nhanh nhưng vi phạm `apps/web/AGENTS.md`, làm lộ schema DB trực tiếp ra client.
  - *API Gateway:* Tuân thủ kiến trúc phân tầng, NestJS API làm trung tâm bảo vệ nghiệp vụ và cấp signed URL an toàn.

## 4. Maintenance Notes
- Khi bổ sung migration mới cho Supabase, luôn kiểm tra bằng `pnpm check:supabase-migrations` trước khi tạo PR để tránh trùng version.

---

# IMPLEMENTATION NOTES: SPRINT 60 — MULTI-MODAL PREVIEW, PERFORMANCE OPTIMIZATION & AUDIT HARDENING

## 1. Unspecified & Implicit Decisions

### A. Image Compression & File Typing (P0-1 Fix)
- **Format Integrity:** `RoyalImageCompressor.compressToWebp()` được cấu trúc lại để trả về đối tượng `CompressedImageResult` gồm `bytes`, `actualFormat` (`webp` | `png`), `mimeType` (`image/webp` | `image/png`), và `fileExtension` (`webp` | `png`).
- **Magic Bytes Detection:**
  - Trên Mobile: Tích hợp hàm `isWebpBytes()` kiểm tra 12 byte đầu tiên (`RIFF....WEBP`). Nếu native compressor thất bại hoặc trả về bytes không phải WebP, hệ thống tự động nhận diện và gán đúng extension `.png`.
  - Trên Web: Bổ sung `getDataUrlExtension(dataUrl)` kiểm tra header MIME type (`data:image/webp` -> `.webp`, `data:image/png` -> `.png`).
- **Share Card Export:** Cả 4 widget share card di động (`RoyalZiweiShareCard`, `RoyalSacredStickShareCard`, `RoyalTarotShareCard`, `RoyalIchingShareCard`) và modal Web không còn hardcode đuôi `.webp` mà sử dụng extension thực tế từ kết quả nén.

### B. Storage Architecture & RLS Compatibility (P0-2 & P0-3 Fix)
- **Tách Bucket Riêng Biệt `royal-gallery`:**
  - Thay vì lưu chung vào `vision-uploads` (nơi có pg_cron job tự động dọn dẹp các file cũ hơn 7 ngày), ta tạo migration `000026_create_royal_gallery_bucket.sql` thiết lập bucket riêng `royal-gallery` vĩnh viễn.
  - Sửa pg_cron job `cleanup_stale_vision_uploads_cron` để loại trừ `royal-gallery/%`.
- **Cấu Trúc Path Khớp RLS Supabase:**
  - Supabase Storage RLS policy mặc định kiểm tra: `(storage.foldername(name))[1] = auth.uid()::text`.
  - Tiền tố cũ `royal-gallery/{userId}/{cardId}.webp` khiến folder đầu tiên là `royal-gallery`, dẫn đến vi phạm RLS và thất bại 403 khi client Mobile upload trực tiếp bằng JWT của user.
  - Cấu trúc path mới trong bucket `royal-gallery`: `{userId}/{cardId}.{ext}`. Thỏa mãn 100% RLS check và bảo vệ tính cô lập giữa các user.

### C. Guard Semantics & Identity Requirement (P0-4 Fix)
- **Trung Thực Trong Đặt Tên & Thông Báo Lỗi:**
  - `RoyalGalleryProGuard` được định danh lại thành `IdentifiedUserGuard` (với alias tương thích ngược `RoyalGalleryProGuard`).
  - Guard kiểm tra `req.user?.email` (ngăn tài khoản anonymous).
  - Thông báo lỗi 403 được chỉnh sửa chính xác thành: *"Tính năng Đồng Bộ Thư Viện Hoàng Triều yêu cầu tài khoản đã đăng nhập định danh (Email) để bảo toàn dữ liệu đa thiết bị."*, không giả định quyền VIP PRO khi chưa có module kiểm tra entitlement.

### D. Anti-Resurrection Tombstone Precedence & Magic Bytes Validation (P1-1 & P1-3 Fix)
- **Tombstone Wins Invariant:**
  - Khi client đồng bộ lên server (`syncGallery`), server kiểm tra các bản ghi hiện có trong database.
  - Nếu server đã đánh dấu xóa (`deleted_at != null`), client chỉ được phép phục hồi bản ghi nếu `clientItem.updatedAt` có timestamp lớn hơn thời điểm xóa trên server. Nếu client gửi bản ghi cũ hoặc không có timestamp mới hơn -> Bỏ qua update, giữ nguyên tombstone.
- **Server Magic Bytes Validation:**
  - Endpoint upload thiệp kiểm tra header nhị phân của file:
    - PNG: `89 50 4E 47 0D 0A 1A 0A`
    - WebP: `52 49 46 46` ... `57 45 42 50`
  - Từ chối ngay các file không khớp signature để ngăn chặn tải lên file rỗng hoặc mã độc.
- **Data Hygiene:** Loại bỏ logging nhạy cảm, chỉ ghi các thông số vận hành an toàn.

### E. Server Pagination & Resilient UI (P1-2 Fix)
- **Web Pagination Thực Chất:**
  - `gallery/+page.svelte` kết nối đầy đủ với backend API thông qua `currentOffset` và `BATCH_SIZE`.
  - `loadMore()` gọi API server để nạp các đợt tiếp theo thay vì chỉ cắt mảng 100 items cục bộ.
  - Bổ sung `serverTotal`, `serverHasMore`, `isLoadingMore` và thông báo lỗi `apiErrorMessage` trên giao diện khi việc đồng bộ thất bại.
- **CLS & Shimmer Resilience:**
  - Gán sự kiện `onerror={() => (loadedImages[item.id] = true)}` trên thẻ `<img>` để chấm dứt hiệu ứng skeleton shimmer ngay cả khi ảnh tải bị lỗi mạng.
  - Đặt `<svelte:window>` ở top-level bắt phím Escape đóng modal chi tiết.

### F. Race-Free Audio Preloading & Native Buffer Playback (P2-1 Fix)
- **Concurrent Call Guard:** Sử dụng biến `_initFuture` để đảm bảo hàm `initialize()` chỉ khởi chạy một lần duy nhất, giải quyết race condition khi nhiều component cùng gọi init.
- **Buffer Playback:**
  - Theo dõi danh sách audio đã nạp sẵn vào RAM bằng `_preloadedSources`.
  - Khi phát âm thanh, nếu asset đã nằm trong bộ nhớ RAM, sử dụng `player.seek(Duration.zero)` và `player.resume()` thay vì gọi `player.play(source)` (vốn sẽ re-set source và tải lại file).

### G. Performance & Metric Transparency (P2-2 Correction)
- **Nguyên Tắc Đo Lường:**
  - Bãi bỏ các tuyên bố về hiệu năng tuyệt đối ("0ms latency", "CLS 0.00", "tiết kiệm 70-85%") chưa có dữ liệu đo kiểm thực tế trên thiết bị vật lý hoặc mạng môi trường production.
  - Hiệu quả giảm tải của WebP so với PNG phụ thuộc vào độ phức tạp của họa tiết thiệp (dao động tùy thuộc vào nội dung ảnh).
  - Tốc độ phát audio nghi lễ sau khi nạp vào RAM phụ thuộc vào audio engine của hệ điều hành, giúp giảm đáng kể độ trễ I/O đĩa nhưng cần đo kiểm cụ thể trên từng dòng máy Android/iOS.

### H. Codex Deep Audit Hardening (P0, P1-1, P1-2 Resolution)
- **RLS Policy Thắt Chặt (Migration 000027):**
  - Khóa vĩnh viễn bảng `royal_gallery_shares` và bucket `storage.objects` (`royal-gallery`) trước anonymous token bằng điều kiện `auth.jwt() ->> 'email' IS NOT NULL AND auth.jwt() ->> 'email' != '' AND coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false`.
  - Đảm bảo cơ chế Defense-in-depth: ngay cả khi client bỏ qua API guard và gọi Supabase trực tiếp, database layer vẫn kiên quyết từ chối ghi dữ liệu đối với người dùng ẩn danh.
- **Strict Server Tombstone Invariant:**
  - Trong quá trình delta sync, tombstone trên server luôn là nguồn chân lý tuyệt đối (`deleted_at != null` WINS).
  - Không cho phép client update ghi đè dựa trên `client.updatedAt` để phòng tránh client clock drift hoặc malicious future timestamps (ví dụ: client gửi timestamp 2035).
- **Transactional Upload Pre-Check & Compensation:**
  - `uploadCardImage` thực hiện pre-check: card phải tồn tại trong DB, thuộc về user và chưa bị xóa trước khi gửi bytes lên Storage.
  - Áp dụng mẫu bù trừ (Compensation Pattern): nếu Storage upload thành công nhưng câu lệnh DB update `storage_path` bị lỗi (mất kết nối, lỗi query), service sẽ tự động kích hoạt `storage.remove([storagePath])` để dọn sạch orphan object và trả về 500 error.
- **Audio Service Guard:**
  - Toàn bộ luồng khởi tạo `initialize()` trong `RitualAudioService` được wrap qua `_initFuture ??= _doInternalInitialize()`, triệt tiêu triệt để race condition khi có nhiều notifier cùng build đồng thời.
- **MIME & Toast Clarity:**
  - Modal Web và share cards phản ánh đúng đuôi định dạng ảnh thực tế (`PNG` hoặc `WEBP`), không còn hardcode toast "WebP thành công" khi file thực tế là PNG fallback.

## 2. Deviations from Specification
- Điều chỉnh cấu trúc đường dẫn lưu trữ từ `royal-gallery/{userId}/{cardId}.webp` sang `{userId}/{cardId}.{ext}` trong bucket riêng `royal-gallery` để đảm bảo tính toàn vẹn dữ liệu và tương thích với Supabase Storage RLS.

## 3. Considered Trade-offs
- **Bucket chung vs. Bucket riêng cho Gallery:**
  - *Dùng chung `vision-uploads`:* Tiết kiệm thao tác tạo bucket nhưng dính nguy cơ file bị xóa tự động sau 7 ngày bởi cron job dọn dẹp định kỳ.
  - *Tạo bucket riêng `royal-gallery`:* Thêm một migration SQL nhưng đảm bảo an toàn dữ liệu người dùng vĩnh viễn và cấu hình RLS sạch sẽ, độc lập.
- **Client Clock Trust vs. Strict Server Tombstone:**
  - *Tin tưởng client timestamp:* Có thể hỗ trợ offline undo/restore đơn giản, nhưng để lộ lỗ hổng khổng lồ về clock drift và rủi ro hồi sinh card đã xóa.
  - *Strict Server Tombstone:* Bảo vệ tính nhất quán dữ liệu ở cấp độ cao nhất. Khôi phục phải là thao tác explicit mutation riêng.

## 4. Maintenance Notes
- Migration `000026_create_royal_gallery_bucket.sql` và `000027_enforce_identified_user_on_gallery.sql` đã được kiểm tra tính nhất quán với `pnpm check:supabase-migrations` (26 versions).
- Bộ test tự động bao phủ toàn diện:
  - Mobile: 147 tests pass; 0 lint/analyze issues.
  - API: 83 test files (512 tests) pass 100%.
  - Web: 59 test files (316 tests) pass 100%.
  - Astro-engine: 5 test files (35 tests) pass 100%.

---

# IMPLEMENTATION NOTES: SPRINT 63 — MULTI-PALACE ASSISTANT CONTEXT & HOÀNG GIA POSTER EXPORT

## 1. Unspecified & Implicit Decisions

### A. Multi-Palace Assistant Context Integration
- **Contracts Schema Extension:** Bổ sung `palaceScope?: PalaceScope` vào `createConversationMessageRequestSchema` trong `@ziweiai/contracts`. Khai báo `palaceScopeSchema` ngay trước để tránh hoisting issue.
- **Dynamic Context Injection:**
  - Trong `ConversationsService.prepareGeneration`, khi `input.palaceScope` có mặt, hệ thống tự động truyền vào `promptPayload`.
  - `buildConversationPrompt` tự động nạp `buildPalaceExplanationPrompt` và `buildPalaceScopeLines`, cung cấp cho LLM thông tin đầy đủ về:
    1. Bản cung (chính tinh, phụ tinh, độ sáng Miếu/Vượng/Đắc/Hãm, Tứ Hóa Khoa/Quyền/Lộc/Kỵ, Can Chi cung).
    2. Đối cung (xung chiếu / bổ trợ).
    3. Tam hợp (2 phương hội chiếu cùng tam hợp cục).
    4. Nhị hợp (Lục hợp tương hỗ hoặc ẩn tàng).
    5. Giáp cung (hai cung liền trước/sau che chở hoặc kẹp giáp sát tinh).
- **User Control & Transparency in AssistantPanel:**
  - Banner `palace-context-banner` hiển thị tên cung vị đang chọn, kèm nút toggle cho phép người dùng chuyển đổi linh hoạt giữa đàm đạo chuyên sâu cung vị và đàm đạo toàn bàn lá số.
  - Tin nhắn có ngữ cảnh cung vị được đánh dấu bằng badge `bubble-palace-pill`.

### B. Hoàng Gia Poster Export Architecture
- **Retina High-DPI Canvas Rendering:**
  - Tách logic render sang `royal-poster-exporter.ts` sử dụng `html2canvas` với `scale: 2` (hoặc 3 trên màn hình lớn) và nền tối `#0c0a09`.
  - Thiết kế cố định layout 780px trong container scrollable, đảm bảo khi render sang canvas không bao giờ bị méo, co giật hay vỡ tỷ lệ trên các thiết bị mobile.
- **Royal Aesthetic Consistency:**
  - Viền thếp vàng hoàng gia (`#d4af37`), 4 hoa văn góc `✦`.
  - Bàn 12 cung sắp xếp 4x4 chuẩn địa chi Tử Vi.
  - Trung cung đóng triện son đỏ viền vàng *"TỬ VI TOÀN TẬP • KHÂM THIÊN GIÁM"*.
  - Chân trang hiển thị mã chứng thư `royalSecurityCode` lấy từ `chartId` để đảm bảo tính xác thực.
- **Web Share API Fallback:**
  - Khi thiết bị hỗ trợ `navigator.canShare({ files })`, xuất trực tiếp file `image/png` lên các app mạng xã hội (Zalo, Messenger, Facebook).
  - Khi thiết bị không hỗ trợ hoặc người dùng hủy share, tự động fallback sang `triggerDirectDownload` để lưu file PNG về máy.

## 2. Deviations from Specification
- Không có sự sai lệch nào so với yêu cầu ban đầu của Sprint 63.

## 3. Considered Trade-offs
- **Canvas Screenshot DOM vs. SVG Vector Direct Render:**
  - *SVG Vector:* Cần dựng lại toàn bộ component dưới dạng thẻ `<svg>`, tăng phức tạp trong việc tính toán dòng chữ và wrap text.
  - *HTML2Canvas DOM:* Tái sử dụng trọn vẹn HTML/CSS design tokens hiện có, căn chỉnh chữ tiếng Việt tự nhiên và hỗ trợ xuất ảnh PNG sắc nét với scale 2x.

## 4. Maintenance Notes
- Quality Gates 100% pass:
  - `pnpm lint`: 0 error, 0 warning
  - `pnpm typecheck`: 10/10 tasks pass
  - `pnpm -F @ziweiai/web check`: 0 error, 0 warning
  - `pnpm test`: 847 tests pass (520 API + 327 Web)
  - `turbo build`: 6/6 packages build pass
  - `playwright smoke`: 1 passed (17.0s)
  - `flutter analyze apps/mobile`: No issues found
