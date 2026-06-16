# Test Matrix

> File này ánh xạ story → proof. **Nguồn sự thật là durable layer Harness**
> (`scripts/bin/harness-cli.exe query matrix`), không phải bảng dưới đây — bảng chỉ là
> ảnh chụp gần nhất để đọc nhanh. Khi lệch, tin matrix CLI và cập nhật lại file này.

## Status Values

| Status | Ý nghĩa |
| --- | --- |
| planned | Đã chấp nhận là hành vi mục tiêu, chưa implement |
| in_progress | Đang xây |
| implemented | Đã implement và có proof |
| changed | Contract đổi sau khi implement |
| retired | Không còn trong product contract |

## Matrix (ảnh chụp từ `query matrix`, 2026-06-16)

| Story | Nội dung | Unit | Integration | E2E | Platform | Status |
| --- | --- | --- | --- | --- | --- | --- |
| US-001 | Scaffold `apps/web` (env/supabase/query/api-client + guard boundary) | ✅ | ✅ | — | ✅ | implemented |
| US-002 | Auth client-only Supabase + route guard | ✅ | ✅ | ✅ | — | implemented |
| US-003 | Logic thuần + i18n + design tokens (CJK guard) | ✅ | — | — | — | implemented |
| US-004 | UI primitives + `AppScaffold` | — | — | — | ✅ | implemented |
| US-005 | Dashboard + birth form + điều hướng | ✅ | — | — | ✅ | implemented |
| US-006 | Chi tiết Tử Vi (palace grid + luận giải) | ✅ | ✅ | ✅ | ✅ | implemented |
| US-007 | 5 hệ thuật số khác + history + chốt guard Hán | ✅ | — | ✅ | ✅ | implemented |
| US-008 | Lá số Tử Vi trực quan (bàn vuông truyền thống) | — | — | — | — | planned |
| US-009 | Bỏ tường đăng nhập — ẩn danh qua Supabase anonymous sign-in | — | — | — | — | planned |
| US-010 | Luận giải AI premium — gate server-side + flag free khi test | — | — | — | — | planned |

(`✅` = proof = 1, `—` = proof = 0 trong durable matrix. Lấy dạng số: `query matrix --numeric`.)

## Backend coverage (Phase 1, ngoài US-001..010)

Backend (`apps/api`) được migrate as-is từ repo gốc kèm test suite riêng, **không** map vào
story US web nào. Đây là coverage pre-migration giữ nguyên hành vi:

- `quotas.service.test.ts` — sliding-window + daily cap (US-010 sẽ dựa lên gate này).
- `charts.service.test.ts`, `explanations.service.test.ts`, `history.service.test.ts`.
- `supabase-auth.service.test.ts`, AI provider tests (gemini / openai-compatible / router),
  prompt builder tests, persistence (idempotency / migration / policy / timestamp).

## Evidence Rules

- Unit: domain + application rule thuần.
- Integration: backend enforcement, data integrity, provider behavior, service contract.
- E2E: luồng browser người dùng thấy được (`apps/web/tests/e2e/*.spec.ts`).
- Platform: shell / deploy / runtime không chứng minh được ở tầng dưới (vd `pnpm check`,
  `turbo typecheck`, build static SPA).
- Một story có thể `implemented` mà không đủ cả 4 cột nếu story packet giải thích lý do.
