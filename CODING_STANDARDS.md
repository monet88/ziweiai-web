# Coding Standards & Architectural Invariants

Tài liệu quy chuẩn kỹ thuật cho reviewer agent và kiểm duyệt mã nguồn trong `ziweiai-web`.

---

## 1. Import Boundaries (Bất biến phân tầng)

- **Web Client (`apps/web`)**:
  - CHỈ ĐƯỢC PHÉP import `@ziweiai/contracts` từ các internal package.
  - **TUYỆT ĐỐI KHÔNG import**: `@ziweiai/core`, `@ziweiai/astro-engine`, `@ziweiai/xuanshu-runtime`, `iztro`, `lunar-javascript` vào web client (kéo ephemeris, iztro, runtime và chữ Hán làm phình bundle client).
  - Mọi dữ liệu lá số / tính toán thuật số phải gọi thông qua HTTP API của `apps/api`.
  - Được kiểm soát tự động bởi rule `no-restricted-imports` trong `eslint.config.mjs`.

- **Mobile Client (`apps/mobile`)**:
  - Tương tự web client: chỉ giao tiếp qua API hoặc schema chuẩn, không kéo server engines.

- **Server Modules (`apps/api`, `packages/core`, `packages/astro-engine`, `packages/xuanshu-runtime`)**:
  - Giữ ranh giới rõ ràng giữa adapter (iztro, lunar-javascript, xuanshu-runtime) và domain logic.

---

## 2. Language Invariant (Bất biến ngôn ngữ)

- **Frontend không bao giờ chứa chữ Hán**: Mọi nhãn, thuật ngữ thuật số hiển thị trên giao diện người dùng đều phải bằng tiếng Việt chuẩn.
- **Fail-fast translation**: Hàm `translateZiweiKey` và các từ điển ánh xạ phải ném lỗi (throw) khi gặp key thiếu, cấm fallback ngầm về chữ Hán nguyên bản.
- **Kiểm duyệt tự động**:
  - Lệnh `pnpm check:hanzi` (tích hợp trong `pnpm lint` và `.githooks/pre-commit`) tự động quét biểu thức chính quy `\p{Script=Han}` trên toàn bộ `apps/web/src` (ngoại trừ các file test và bảng tra cứu legacy đã được whitelist).
  - Mọi template `.svelte` phải đạt 0 ký tự chữ Hán.

---

## 3. Contracts-First Architecture (Thiết kế dựa trên Contracts)

- **Single Source of Truth**:
  - Mọi request/response DTO và data model dùng chung qua ranh giới api/web/mobile đều phải định nghĩa tại `@ziweiai/contracts` bằng Zod v4 schemas.
  - Nghiêm cấm định nghĩa song song (duplicate DTO) ở từng ứng dụng riêng lẻ.
- **Workflow**:
  - Sau khi sửa đổi `@ziweiai/contracts`, bắt buộc phải build package (`pnpm --filter @ziweiai/contracts build` hoặc `pnpm build`) trước khi chạy typecheck trên `apps/api` hoặc `apps/web`.

---

## 4. Svelte 5 Runes & Scoped Styling

- **Runes First**:
  - Toàn bộ reactive state trong `apps/web` phải sử dụng Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`).
  - Không sử dụng cú pháp reactive legacy của Svelte 4 (`$:`, `export let`).
- **Styling**:
  - Không dùng Tailwind CSS.
  - Sử dụng Scoped CSS component kết hợp với CSS custom properties định nghĩa tại `apps/web/src/lib/theme/tokens.css`.
  - Tôn trọng hệ thống Design Tokens: màu sắc, typography, khoảng cách, dark/light theme.

---

## 5. Security & Auth Guardrails

- **Client-only Supabase Auth**:
  - Auth flow chạy phía client qua `@supabase/supabase-js` với `PUBLIC_SUPABASE_ANON_KEY`.
  - TUYỆT ĐỐI không bao giờ để lộ `SUPABASE_SERVICE_ROLE_KEY` hoặc các secret API key ở phía client, log, documentation hay git commits.
- **Pre-commit Secret Scan**:
  - Hook `.githooks/pre-commit` chặn commit file `.env`, file chứng chỉ (`.pem`, `.key`, `.p12`), binary dung lượng lớn, và các token định dạng nhạy cảm (`sbp_`, `ghp_`, `github_pat_`).
