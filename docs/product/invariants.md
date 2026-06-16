# Bất biến sản phẩm (Invariants)

> Đây là ràng buộc cứng. Vi phạm = build phải fail. Sửa file này chỉ qua decision record.

## 1. Bất biến bảo mật — Boundary client/server

`apps/web` **chỉ** được import `@ziweiai/contracts` từ workspace nội bộ.

**Tuyệt đối cấm** ở `apps/web`:

- `@ziweiai/core`, `@ziweiai/astro-engine` (kéo `iztro` + `lunar-javascript` + ephemeris +
  hàng trăm literal chữ Hán vào client bundle).
- `iztro`, `lunar-javascript` (import trực tiếp).
- `process.env`, `$env/static/private`, `$env/dynamic/private`.
- Mọi secret server: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `DEEPSEEK_API_KEY`,
  `GEMINI_API_KEY`, `OPENAI_COMPAT_API_KEY`, geocoding key, database URL.

Chỉ `PUBLIC_*` được lộ ra client: `PUBLIC_API_BASE_URL`, `PUBLIC_SUPABASE_URL`,
`PUBLIC_SUPABASE_ANON_KEY` (anon key là public theo thiết kế Supabase).

Cơ chế chặn (chính xác theo code):

- ESLint `no-restricted-imports` (`apps/web/eslint.config.mjs`) **chỉ** chặn 4 engine
  package: `@ziweiai/core`, `@ziweiai/astro-engine`, `iztro`, `lunar-javascript`. Đây là
  hàng rào có hiệu lực ở lint/CI.
- Phần secret/private-env (`process.env`, `$env/static/private`, `$env/dynamic/private`)
  hiện **chưa có lint rule riêng**: được giữ bằng (a) quy ước "web chỉ đọc `$env/static/public`",
  và (b) SvelteKit báo lỗi build khi client code import `$env/*/private`. Một lint rule chặn
  tường minh là backlog (xem `harness-cli query backlog`).

## 2. Bất biến ngôn ngữ — Không chữ Hán ở frontend

Frontend KHÔNG BAO GIỜ hiển thị chữ Hán. Mọi nhãn là tiếng Việt.

- Lá số mới dùng **key slug ASCII** (vd `nameKey: "soulPalace"`). Contract không lưu chữ Hán.
- `translateZiweiKey` **fail-fast**: token thiếu trong từ điển phải báo lỗi rõ, **cấm**
  fallback im lặng ra chữ Hán.
- Chữ Hán (`displayName`) chỉ xuất hiện read-time khi parse **snapshot legacy v1** (qua
  `z.preprocess(normalizeLegacyChartSnapshot)` trong contract). Web giữ **CJK guard**
  (regex `CJK_TEXT_PATTERN`) + fallback hiển thị `"Thuật ngữ cũ"`.
- Web có `src/lib/text/cjk.ts` (copy giá trị `CJK_TEXT_PATTERN`, **không** import `@ziweiai/core`).
- `CJK_TEXT_PATTERN` rộng hơn `\p{Script=Han}` đơn lẻ — chặn cả Han + Hiragana/Katakana
  (Nhật) + Hangul (Hàn) + Bopomofo (chú âm) + dấu câu CJK (U+3000–303F) + ký tự fullwidth
  (U+FF00–FFEF). Nguồn chuẩn: `packages/core/src/text/cjk-guard.ts`.
- Test quét guard chạy trên **output formatter ở mức logic** (vd `no-han-characters.test.ts`),
  không quét artifact `build/`. Cùng pattern cũng được dùng **server-side trên output AI**
  (`containsCjkText` reject → router không failover sang chữ Hán).

## 3. Bất biến token tươi

- Token = `session.access_token` (Supabase JWT) gửi qua `Authorization: Bearer`.
- `autoRefreshToken: true` + lắng nghe `onAuthStateChange` để tránh 401 ngầm session dài.
- Logout phải `queryClient.clear()` để không rò dữ liệu user cũ sang user mới trên cùng browser.
