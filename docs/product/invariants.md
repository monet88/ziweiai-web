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

Cơ chế chặn: ESLint `no-restricted-imports` ở `apps/web` + CI + test quét bundle.

## 2. Bất biến ngôn ngữ — Không chữ Hán ở frontend

Frontend KHÔNG BAO GIỜ hiển thị chữ Hán. Mọi nhãn là tiếng Việt.

- Lá số mới dùng **key slug ASCII** (vd `nameKey: "soulPalace"`). Contract không lưu chữ Hán.
- `translateZiweiKey` **fail-fast**: token thiếu trong từ điển phải báo lỗi rõ, **cấm**
  fallback im lặng ra chữ Hán.
- Chữ Hán (`displayName`) chỉ xuất hiện read-time khi parse **snapshot legacy v1** (qua
  `z.preprocess(normalizeLegacyChartSnapshot)` trong contract). Web giữ **CJK guard**
  (regex `\p{Script=Han}`) + fallback hiển thị `"Thuật ngữ cũ"`.
- Web có `src/lib/text/cjk.ts` (copy giá trị `CJK_TEXT_PATTERN`, **không** import `@ziweiai/core`).
- Test quét `\p{Script=Han}` trên output UI để chặn rò chữ Hán hardcode.

## 3. Bất biến token tươi

- Token = `session.access_token` (Supabase JWT) gửi qua `Authorization: Bearer`.
- `autoRefreshToken: true` + lắng nghe `onAuthStateChange` để tránh 401 ngầm session dài.
- Logout phải `queryClient.clear()` để không rò dữ liệu user cũ sang user mới trên cùng browser.
