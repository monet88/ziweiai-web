# US-020 Ổn định 3 E2E spec lá số (US-007/009/012)

## Status

planned

## Lane

normal

## Product Contract

Ba E2E spec hiện fail dưới full-suite trên môi trường Supabase Cloud phải xanh ổn định
(không flaky), mà không nới lỏng nội dung kiểm thử. Đây là nợ kỹ thuật test tách ra từ
US-019 (chuyển cloud); bản thân đường chạy sản phẩm đã verify hoạt động trên cloud.

## Relevant Product Docs

- `docs/stories/epics/E20-supabase-cloud/US-019-supabase-cloud-migration.md`
- `docs/decisions/0009-anonymous-auth-strategy.md`
- `docs/decisions/0015-vn-birthform-hide-coordinates.md`
- `apps/web/playwright.config.ts`

## Acceptance Criteria

- `pnpm --filter @ziweiai/web e2e` chạy full suite → 21/21 spec pass, lặp lại 2 lần không flaky.
- Không giảm độ phủ: vẫn kiểm tô màu sao (US-012), 5 hệ + history (US-007), CTA ẩn danh (US-009).
- Không hardcode endpoint local; mọi spec đập vào môi trường cấu hình ở `.env` root.

## Design Notes

Ba lỗi đã phân loại (chạy 2026-06-22 trên cloud `uaicvwttnajeglxiorpb`):

1. US-009 `us-009-anonymous-access.spec.ts` — PASS khi chạy riêng (3.2s), chỉ FAIL dưới
   tải full suite. Nguyên nhân: rate-limit auth của Supabase Cloud (anon sign-in +
   sign-up dồn dập; cloud siết `anonymous_users`/`sign_in_sign_ups` chặt hơn stack local).
   Hướng xử lý: nâng `auth.rate_limit.anonymous_users` + `sign_in_sign_ups` trên project
   (qua Management API/config), hoặc tái dùng một anon session chung thay vì sign-in mới
   mỗi test, hoặc thêm retry/backoff cho bước anon sign-in.
2. US-012 `us-012-ziwei-star-coloring.spec.ts:76` — board render đúng (`.star-meta` visible
   dòng 64, brightness style dòng 92 pass), nhưng `firstStarWithMeta.hover()` timeout.
   Locator `board.locator('li.star').filter({ has: board.locator('.star-meta') }).first()`
   resolve được phần tử nhưng hover không tiến hành (nghi scroll-into-view/animation/overlap).
   Hướng xử lý: `scrollIntoViewIfNeeded()` trước hover, hoặc `hover({ force: true })`, hoặc
   bám `.star-meta` cha trực tiếp. Cần mở trace (`--trace on`) xác nhận trước khi sửa.
3. US-007 `us-007-other-systems-history.spec.ts` — loop tuần tự 5 hệ, mỗi hệ tạo lá số +
   luận giải AI thật trong MỘT test. Thời gian tích lũy + rate-limit per-user dễ vượt
   ngưỡng. Hướng xử lý: tách thành 5 test (mỗi hệ một test, song song được), hoặc nâng
   timeout per-test + quota e2e, hoặc mock luận giải AI cho nhánh này.

- Commands: `pnpm --filter @ziweiai/web e2e`; debug: `... exec playwright test <spec> --trace on`.
- API/Tables: không đổi; thuần test + (có thể) cấu hình rate-limit auth cloud cho e2e.
- UI surfaces: không đổi UI; chỉ điều chỉnh selector/luồng trong spec.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id US-020-e2e-ziwei-flow-stabilization --unit 0 --integration 0 --e2e 1 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | n/a (thuần E2E) |
| Integration | n/a |
| E2E | `pnpm --filter @ziweiai/web e2e` full suite 21/21 pass, không flaky qua 2 lần chạy |
| Platform | (nếu chỉnh rate-limit auth cloud) ghi lại giá trị mới + lý do |
| Release | Không giảm độ phủ kiểm thử |

## Harness Delta

- Thêm story US-020 + epic E21 vào durable store.

## Evidence

Thực thi 2026-06-23 trên cloud `ziweiai-web` (ref `uaicvwttnajeglxiorpb`). Full suite `pnpm --filter @ziweiai/web e2e` → 21/21 pass, lặp 2 lần liên tiếp không flaky (1.5m + 1.9m).

Root cause + fix từng spec:

- US-012 — Lỗi thật (selector), không phải overlay. `board.locator('li.star').filter({ has: board.locator('.star-meta') })` dùng locator re-root ở `board` làm has-predicate → khớp 0 phần tử. Đổi sang CSS `li.star:has(.star-meta)` (đánh giá tương đối theo từng `<li>`). Bỏ luôn `hover()` thừa vì `title` là thuộc tính HTML tĩnh, đọc trực tiếp.
- US-007 — Drift role: item lịch sử giờ là `<a href="/charts/:id">` (role=link), spec cũ tìm `getByRole('button')`. Đổi sang `getByRole('link')`.
- US-009 + US-015 — Không phải lỗi sản phẩm (đều pass khi chạy riêng), mà do dồn tải full suite dưới một user test dùng chung:
  - Quota per-user/in-memory (charts 20/ngày, 30 req/phút...) cộng dồn → nâng cho riêng tiến trình api e2e qua `playwright.config.ts` `webServer.env` (cùng cơ chế CORS/feature-flag). KHÔNG nới lỏng sản phẩm; quota kiểm riêng ở US-013.
  - Anon sign-in cloud `rate_limit_anonymous_users=30/giờ/IP` cạn do chạy lặp → nâng lên 1000 qua Management API (`/v1/projects/<ref>/config/auth`). Đây là trần chống-lạm-dụng của project dev, đảo được.

Không spec nào bị giảm độ phủ: chỉ sửa selector/role + nâng trần hạ tầng test.
