# Test Matrix

> File này ánh xạ story → proof. Bản cũ dựa vào Harness CLI, nhưng binary
> `scripts/bin/harness-cli.exe` không có trong workspace hiện tại. Snapshot dưới
> đây là operational snapshot ngày 2026-07-12, đối chiếu từ code, migrations,
> E2E specs và deploy report.

## Status Values

| Status | Ý nghĩa |
| --- | --- |
| planned | Đã chấp nhận là hành vi mục tiêu, chưa implement |
| in_progress | Đang xây |
| implemented | Đã implement và có proof |
| changed | Contract đổi sau khi implement |
| retired | Không còn trong product contract |

## Matrix (operational snapshot, 2026-07-12)

| Story | Nội dung | Unit | Integration | E2E | Platform | Status |
| --- | --- | --- | --- | --- | --- | --- |
| US-001 | Scaffold `apps/web` (env/supabase/query/api-client + guard boundary) | ✅ | ✅ | — | ✅ | implemented |
| US-002 | Auth client-only Supabase + route guard | ✅ | ✅ | ✅ | — | implemented |
| US-003 | Logic thuần + i18n + design tokens (CJK guard) | ✅ | — | — | — | implemented |
| US-004 | UI primitives + `AppScaffold` | — | — | — | ✅ | implemented |
| US-005 | Dashboard + birth form + điều hướng | ✅ | — | — | ✅ | implemented |
| US-006 | Chi tiết Tử Vi (palace grid + luận giải) | ✅ | ✅ | ✅ | ✅ | implemented |
| US-007 | 5 hệ thuật số khác + history + chốt guard Hán | ✅ | — | ✅ | ✅ | implemented |
| US-008 | Lá số Tử Vi trực quan (bàn vuông truyền thống) | ✅ | — | ✅ | ✅ | implemented |
| US-009 | Bỏ tường đăng nhập — ẩn danh qua Supabase anonymous sign-in | ✅ | ✅ | ✅ | ✅ | implemented |
| US-010 | Luận giải AI premium — gate server-side + flag free khi test | ✅ | ✅ | ✅ | — | implemented |
| US-011 | Đường nối tam phương/tứ chính | ✅ | — | ✅ | — | implemented |
| US-012 | Tô màu sao Tử Vi | ✅ | — | ✅ | — | implemented |
| US-013 | Quota anon/persistence store | ✅ | ✅ | ✅ | — | implemented |
| US-014 | Flow-info vận hạn server-side | ✅ | ✅ | ✅ | — | implemented |
| US-015 | Panel vận hạn tương tác | ✅ | — | ✅ | — | implemented |
| US-016 | Vận ngày/tháng + báo cáo năm | ✅ | ✅ | ✅ | ✅ | implemented |
| US-017 | Extended systems: Hợp Hôn, Mang Phái, Tarot, MBTI, Face/Palm | ✅ | ✅ | ✅ | ✅ | implemented |
| US-018 | Trợ lý AI hội thoại | ✅ | ✅ | ✅ | ✅ | implemented |
| US-019 | Supabase Cloud migration | — | ✅ | — | ✅ | implemented |
| US-020 | E2E stabilization | — | — | ✅ | ✅ | implemented |
| US-037..040 | Lenormand, Dream, Stick, Almanac | ✅ | ✅ | ✅ | ✅ | implemented |
| US-041 | Luvsa-inspired web redesign | — | — | — | ✅ | in_progress |

`✅` nghĩa là có test/code/deploy evidence trong workspace hiện tại. `—` nghĩa
là không áp dụng hoặc chưa được audit ở tầng đó trong lần snapshot này.

## Backend coverage (Phase 1, ngoài US-001..010)

Backend (`apps/api`) hiện có coverage riêng và nhiều module đã vượt khỏi bảng
US-001..010 ban đầu:

- `quotas.service.test.ts` — sliding-window + daily cap (US-010 sẽ dựa lên gate này).
- `charts.service.test.ts`, `explanations.service.test.ts`, `history.service.test.ts`.
- `supabase-auth.service.test.ts`, AI provider tests (gemini / openai-compatible / router),
  prompt builder tests, persistence (idempotency / migration / policy / timestamp).
- Các module mở rộng có test: conversations, annual report, fortune, pairings,
  tarot, lenormand, dreams, sticks, almanac, MBTI, vision.

## Release Evidence

- Vercel demo deploy + TestSprite report:
  `docs/reports/20260710-tuvitoantap-vercel-testsprite-deploy.md`.
- Safe smoke mới nhất không ghi dữ liệu:
  `docs/reports/20260713-vercel-safe-smoke.md`.
- Report index và quy tắc đọc evidence:
  `docs/reports/README.md`.
- Release checklist:
  `docs/deploy/vercel-demo-release-checklist.md`.

## Evidence Rules

- Unit: domain + application rule thuần.
- Integration: backend enforcement, data integrity, provider behavior, service contract.
- E2E: luồng browser người dùng thấy được (`apps/web/tests/e2e/*.spec.ts`).
- Platform: shell / deploy / runtime không chứng minh được ở tầng dưới (vd `pnpm check`,
  `turbo typecheck`, build static SPA).
- Một story có thể `implemented` mà không đủ cả 4 cột nếu story packet giải thích lý do.
