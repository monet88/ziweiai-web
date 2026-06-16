# US-009 Bỏ tường đăng nhập — dùng ẩn danh qua Supabase anonymous sign-in

## Status

planned

## Lane

high-risk

## Product Contract

Khách không đăng nhập vẫn lập + xem được lá số (như tuvi.vn/lap-la-so-tu-vi), không bị
đẩy về `/sign-in`. Danh tính ẩn danh dùng **Supabase anonymous sign-in** (quyết định
`0009`): mỗi khách có JWT thật + dòng `auth.users` thật → backend (FK/RLS/quota/ownership)
KHÔNG đổi. Lịch sử (`/history`) vẫn chỉ dành cho phiên có danh tính; nâng cấp lên email
sau này giữ nguyên dữ liệu.

## Relevant Product Docs

- `docs/decisions/0009-anonymous-auth-strategy.md` (quyết định gốc)
- `docs/product/invariants.md` (§1 chỉ `PUBLIC_*` ra client, §2 ngôn ngữ)
- `SPEC.md` Phần C — Phase 3 (auth + route guard)

## Acceptance Criteria

- Mở app khi chưa đăng nhập → KHÔNG bị redirect `/sign-in`; dashboard + lập + xem lá số
  hoạt động dưới phiên ẩn danh.
- `AuthStore.init()`: nếu không có session → gọi `supabase.auth.signInAnonymously()` để luôn
  có JWT; các request giữ nguyên contract Bearer (token-everywhere không phá vỡ).
- Dashboard không còn hiển thị `auth.user.email` + nút đăng xuất vô điều kiện: phiên ẩn danh
  thấy CTA "Đăng nhập / Đăng ký" thay cho email.
- `/history` + sidebar lịch sử: phiên ẩn danh vẫn xem được lịch sử của chính phiên đó
  (anon user_id là user_id thật) — KHÔNG rò lịch sử user khác.
- Backend KHÔNG sửa guard/schema/RLS/quota (xác nhận anon JWT đi qua `SupabaseAuthGuard`
  như user thường; `authenticatedUserSchema` parse `userId` UUID của anon user OK).
- Nhãn/CTA mới tiếng Việt, không rò Hán (qua `viCopy`).

## Design Notes

- `auth-store.svelte.ts`: thêm nhánh anon trong `init()` — sau `getSession()` mà null thì
  `signInAnonymously()`; `onAuthStateChange` vẫn flip `isInitializing`. Thêm getter
  `isAnonymous` = `session?.user.is_anonymous === true`.
- `(app)/+layout.svelte`: bỏ redirect cứng về `/sign-in`. Vì anon-session luôn tồn tại sau
  init, `isAuthenticated` vẫn true → guard hiện tại không đá ai ra; chủ yếu là chờ init xong.
- `(app)/+page.svelte`: header email/sign-out → conditional theo `isAnonymous`.
- Model token-gated (`dashboard`/`chart-detail`/`explanation`): không cần nới (anon luôn có
  token); GIỮ nguyên để không suy yếu bảo mật.
- KHÔNG mở public endpoint, KHÔNG sửa `owner_user_id` nullable, KHÔNG drop owner filter —
  toàn bộ tránh được nhờ anon sign-in.
- Đường nâng cấp anon→email (`linkIdentity`/`updateUser`) ghi chú để story sau; story này
  chỉ cần `queryClient.clear()` xử lý đúng khi chuyển phiên.

## Validation

`scripts\bin\harness-cli.exe story update --id US-009 --unit 1 --integration 1 --e2e 1 --platform 1`

| Layer | Expected proof |
| --- | --- |
| Unit | `AuthStore.init()` gọi `signInAnonymously` khi không session; `isAnonymous` getter |
| Integration | anon JWT qua `SupabaseAuthGuard` → tạo + đọc lá số OK (backend không đổi) |
| E2E | mở app chưa login → không bị đá ra → lập + xem lá số → CTA đăng nhập hiển thị |
| Platform | `pnpm -F @ziweiai/web check` + backend test xanh (xác nhận không hồi quy) |
| Release | — |

## Harness Delta

Lane high-risk: chạm mô hình auth (tường đăng nhập). Đã có decision `0009`. Bất biến: chỉ
`PUBLIC_*` ra client (không lộ secret khi bật anon), nhãn tiếng Việt. Cần bật
**Anonymous sign-ins** trong cấu hình Supabase (Auth settings) — nếu môi trường chưa bật →
`backlog add`. Phải kiểm tra `queryClient` không rò cache giữa các phiên anon.

## Evidence
