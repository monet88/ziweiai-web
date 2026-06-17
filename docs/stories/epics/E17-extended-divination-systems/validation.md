# Validation

## Proof Strategy

US-017 là story TỔNG dựng khung. Chứng minh khung "đã sẵn sàng để cắm 6
epic con" yêu cầu 4 lớp bằng chứng:

1. **Khung contract** parse 12 hệ + 4 schema mới + 3 mã lỗi mới → unit
   xanh trong `@ziweiai/contracts`.
2. **Khung env + cờ** parse default `false` + reject sai + boot OK →
   unit + integration xanh trong `apps/api`.
3. **Khung Storage** migration chạy được trên Supabase local; RLS chặn
   cross-user; cron job lên lịch đúng → integration xanh.
4. **Khung endpoint** chứng minh bằng 1 epic con thật (Tarot — US-017a):
   `POST /draws/tarot` chạy với cờ on, 404 với cờ off; UI Tarot e2e
   xanh; `pnpm -F @ziweiai/web check` xanh.

Nguyên tắc:

- Mỗi epic con TỪNG epic phải có proof riêng (unit + integration + ít
  nhất 1 e2e + cờ tắt mặc định ở prod) trước khi merge — KHÔNG dồn proof
  vào story TỔNG.
- KHÔNG claim pass nếu lệnh chưa chạy thật xanh (tuân thủ
  `CLAUDE.md` <important if="you just finished implementing a story or milestone">).
- 6 cờ giữ `false` ở prod sau merge — operator audit cấu hình prod là
  một phần proof "Release".

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | • `chartSystemSchema` parse 12 giá trị + reject `'unknown-system'` <br>• Snapshot legacy (6 hệ cũ) parse OK sau mở rộng <br>• `pairingSnapshotSchema` / `tarotDrawSchema` / `mbtiResultSchema` / `visionAnalysisSchema` parse OK + reject input méo <br>• `apiErrorCodeSchema` parse 3 mã mới <br>• `apiEnvSchema` parse default `false` cho 6 cờ; reject `EXTENDED_SYSTEM_TAROT_ENABLED=invalid` <br>• `z.stringbool()` không bug `'false' → true` (regression test theo decision 0010) <br>• `assertEmailIdentityRequired` ném `IDENTITY_REQUIRED` cho `is_anonymous=true`; pass cho user email <br>• `assertCanUseAiVisionExplanation` ném `VISION_QUOTA_EXCEEDED` khi vượt; pass khi đủ <br>• Tarot service rút bài deterministic theo seed (cùng seed → cùng kết quả) |
| Integration | • `POST /draws/tarot` cờ TAROT on + Bearer hợp lệ → trả `tarotDrawSchema` <br>• `POST /draws/tarot` cờ TAROT off → 404 (hoặc 503 — chốt P1) <br>• `POST /draws/tarot` không Bearer → 401 (auth guard hiện hành) <br>• Migration `000002_vision-uploads-bucket.up.sql` chạy xanh trên Supabase local <br>• Upload ảnh tới `vision-uploads/{owner_user_id}/...` thành công cho owner; cross-user select bị RLS chặn <br>• `pg_cron` job `vision-uploads-cleanup` lên lịch trong `cron.job` <br>• `GET /features` trả 6 cờ với trạng thái đúng |
| E2E | • Tarot UI: nhập câu hỏi + chọn spread → bấm rút → hiển thị diễn giải Việt (không Han) <br>• Cờ TAROT off → CTA Tarot ẩn / hiển thị "Tính năng đang phát triển" <br>• 5 route stub (`/pairings`, `/mbti`, `/face`, `/palm`, hoặc tab Manh Phái) hiển thị "đang phát triển" Việt ngữ — KHÔNG vỡ navigation |
| Platform | • `pnpm -F @ziweiai/contracts test` xanh <br>• `pnpm -F @ziweiai/api test` xanh <br>• `pnpm -F @ziweiai/web check` xanh <br>• `pnpm -F @ziweiai/web build` xanh (static build vẫn ra) <br>• `pnpm why zod` đơn nhất (chỉ 1 version) <br>• `pnpm lint` xanh (`--max-warnings=0`) <br>• ESLint `no-restricted-imports` vẫn chặn web import core/astro-engine/iztro |
| Performance | • `POST /draws/tarot` p95 < 5s với LLM provider thật ở stg (mục tiêu mềm — báo nếu vượt) <br>• Bundle web không tăng > 5% sau khi thêm route stub + Tarot UI |
| Logs/Audit | • Mỗi gọi LLM Tarot log đủ trường (`provider`, `model`, `prompt_tokens`, `completion_tokens`, `cost_usd_estimate`, `system='tarot'`, `request_id`) <br>• Cảnh báo log khi cờ feature on ở `NODE_ENV=production` <br>• Audit cấu hình prod: 6 cờ giữ `false` (kiểm tra deploy spec) |

## Fixtures

- `seedTarotDeterministic = 'us-017-fixture-seed-001'` — seed cố định
  cho rút bài Tarot integration test (rút cùng kết quả mỗi lần).
- 2 user fixture trong Supabase local:
  - `user_email_a@test.local` (email identity) — dùng cho upload Storage
    test.
  - `user_anon_b` (anon JWT) — dùng cho test face/palm bị
    `IDENTITY_REQUIRED`.
- Ảnh fixture (cho P3e/f sau): `apps/api/test/fixtures/face-sample.jpg`
  + `palm-sample.jpg` (≤ 100KB, đã pixelate / không phải người thật) —
  KHÔNG đưa ảnh thật của ai vào repo.
- Snapshot legacy fixture: tái dùng `chart-contracts.test.ts` data hiện
  có — đảm bảo parse OK sau khi mở rộng `chartSystems`.
- LLM mock provider: tái dùng pattern hiện có trong
  `apps/api/test/mocks/` (nếu có); thêm `tarot-mock-response.json`.
- 60 câu MBTI fixture: TBD ở P3b.
- 78 lá Tarot deck: deterministic constant trong `tarot-deck.ts`.

## Commands

P0 (Contract foundation):

```text
pnpm -F @ziweiai/contracts test
pnpm why zod
```

P1 (Env + cờ + quota):

```text
pnpm -F @ziweiai/api test -- env.test
pnpm -F @ziweiai/api test -- quotas.service
pnpm -F @ziweiai/api test -- identity.guard
```

P2 (Storage + RLS + cleanup):

```text
# (Supabase local đã start)
pnpm -F @ziweiai/api supabase:migrate
pnpm -F @ziweiai/api test -- vision-uploads.integration
```

P3a (Tarot epic — chứng minh khung):

```text
pnpm -F @ziweiai/api test -- draws-tarot
pnpm -F @ziweiai/api test:integration -- draws-tarot
pnpm -F @ziweiai/web check
pnpm -F @ziweiai/web test:e2e -- tarot
```

P4 (Docs + lint):

```text
pnpm lint
turbo typecheck
turbo test
pnpm -F @ziweiai/web build
```

Story TỔNG đóng:

```text
scripts\bin\harness-cli.exe story update --id US-017 --unit 1 --integration 1 --e2e 1 --platform 1
scripts\bin\harness-cli.exe trace --intake <n> --story US-017 --summary "khung 12 hệ + Tarot epic merged" --outcome completed --agent claude --actions "P0+P1+P2+P3a" --read <files> --changed <files> --friction "<nếu có>"
```

## Acceptance Evidence

Add results after verification.

- Decision `0012-extended-divination-systems.md` — accepted 2026-06-17.
- P0/P1/P2/P3a evidence sẽ được điền sau khi từng phase merge (mỗi PR
  link + lệnh đã chạy + kết quả).
- 6 cờ prod audit: TBD sau khi deploy stg.
- US-017b..f tracked riêng — KHÔNG yêu cầu evidence trong story TỔNG.
