# US-002 Auth client-only Supabase + route guard

## Status

implemented

## Lane

high-risk

## Product Contract

Người dùng đăng nhập bằng Supabase (client-only, không SSR cookie). Store auth
runes giữ `session` + `access_token` luôn tươi. Route group `(app)` redirect tới
`/sign-in` khi chưa đăng nhập. Token bơm vào api-client qua `Authorization: Bearer`.

## Relevant Product Docs

- `docs/product/invariants.md` (bất biến bảo mật: token, autoRefresh)
- `docs/product/api-contract.md` (endpoint Bearer)
- `SPEC.md` Phần C — Phase 3, Section 10–12, 14

## Acceptance Criteria

- Chưa đăng nhập, vào route trong `(app)` → redirect `/sign-in`.
- Đăng nhập thành công → vào `(app)`; `GET /history` trả 200 (token gắn đúng).
- Logout → redirect `/sign-in` **và** `queryClient.clear()` (xóa cache user cũ).
- Session idle qua thời điểm refresh → request kế tiếp vẫn 200 (token auto-refresh).
- Guard chờ `loading=false` trước khi quyết định redirect (không vòng lặp).
- `tsc --noEmit` xanh.

## Design Notes

- Nguồn rewrite-svelte: `apps/app/src/features/auth/{auth-context,auth-provider,auth-shell,sign-in-screen}.*`
- Files: `src/lib/auth/auth-store.svelte.ts`, `auth-context.ts`; routes
  `+layout.svelte` (init + setContext), `sign-in/+page.svelte`, `(app)/+layout.svelte` (guard).
- Token đọc từ store **ngay trước mỗi request**, không snapshot lúc mount.
- `onAuthStateChange` subscribe trong `$effect`, cleanup ở return.

## Validation

`scripts\bin\harness-cli.exe story update --id US-002 --unit 1 --integration 1 --e2e 1 --platform 0`

| Layer | Expected proof |
| --- | --- |
| Unit | auth-store: getAccessToken, signIn/signOut state transitions |
| Integration | guard redirect chưa-auth; request gắn Bearer |
| E2E | login → (app) → logout → /sign-in; cache cleared |
| Platform | — |
| Release | — |

## Harness Delta

Decision 0007 (web-server-boundary) áp dụng. Nếu auth flow đổi shape token →
ghi decision mới.

## Evidence

_(điền sau khi implement)_
