# US-010 Luận giải AI thành gói premium (gate server-side + feature-flag free khi test)

## Status

planned

## Lane

high-risk

## Product Contract

Luận giải AI trở thành tính năng trả phí: chỉ phiên CÓ danh tính (anon-session hoặc email,
theo quyết định bạn đã chốt) mới được dùng, và chỉ khi có entitlement. Một feature-flag
server (`AI_EXPLANATION_FREE_FOR_ALL`, mặc định `true`) cho phép **free toàn bộ khi test** —
khi bật free, gate là no-op. Enforcement THẬT nằm ở server (quyết định `0010`); cờ client
chỉ để hiển thị UI, không bao giờ là hàng rào thanh toán.

## Relevant Product Docs

- `docs/decisions/0010-premium-ai-entitlement-flag.md` (quyết định gốc)
- `docs/product/api-contract.md` (`POST /explanations`)
- `docs/product/invariants.md` (§2 ngôn ngữ; nhãn paywall tiếng Việt)

## Acceptance Criteria

- `apps/api`: thêm env `AI_EXPLANATION_FREE_FOR_ALL` (default `true`) trong `config/env.ts`.
- Gate đặt ở ĐẦU `ExplanationsService.createExplanation` (cạnh `assertCanCreateExplanation`,
  TRƯỚC khi gọi provider): khi flag off + không entitlement → ném
  `ApiErrorHttpException(402 PAYMENT_REQUIRED)`. Khi flag on → no-op (free).
- `packages/contracts`: thêm mã `PAYMENT_REQUIRED` vào `apiErrorCodeSchema` (web parse mọi
  lỗi qua contracts → phải nhận mã này).
- `apps/web`: `ChartDetailScreen` hiển thị CTA premium thay nút "Luận giải" khi nhận lỗi
  `PAYMENT_REQUIRED`; khi free (mặc định test) → nút luận giải hoạt động bình thường.
- Gate fail-CLOSED khi flag off (quên cấu hình ≠ free tràn lan); log khi flag đang ép free.
- Quyết định: gate có áp lên cache-hit (luận giải đã sinh trước đó) hay không — story này
  gate cả lần sinh mới; cache-hit trả kết quả cũ vẫn cho xem (ghi rõ trong code).
- Nhãn paywall + thông báo "miễn phí khi thử nghiệm" tiếng Việt, không rò Hán.

## Design Notes

- Nguồn entitlement THẬT chưa có (không bảng tier/payment). Story này: flag-only —
  `free=true` ⇒ luôn cho; `free=false` ⇒ chặn tất (chưa có ai entitled) cho tới khi billing
  được thêm ở story sau. KHÔNG tự ý thêm bảng payment trong story này (sẽ là decision riêng).
- `explanations.service.ts`: chèn `assertCanUseAiExplanation(user)` sau quota assert. Đặt ở
  SERVICE (không controller) để mọi client tương lai đều bị gate.
- `backend-api.ts`: `apiErrorCodeSchema` thêm `PAYMENT_REQUIRED`; map sang HTTP 402 trong
  `ApiErrorHttpException`.
- `apps/web/i18n/vi.ts`: copy CTA premium + note free-test (tiếng Việt).
- `explanation-model.svelte.ts` / `ChartDetailScreen.svelte`: bắt lỗi `PAYMENT_REQUIRED` →
  render paywall CTA (thuần presentational).

## Validation

`scripts\bin\harness-cli.exe story update --id US-010 --unit 1 --integration 1 --e2e 0 --platform 1`

| Layer | Expected proof |
| --- | --- |
| Unit | gate no-op khi flag on; ném 402 khi flag off + chưa entitled; contracts parse mã mới |
| Integration | `POST /explanations` flag off → 402 PAYMENT_REQUIRED; flag on → sinh luận giải OK |
| E2E | (tùy) UI paywall hiển thị khi 402 |
| Platform | `turbo typecheck` + `pnpm -F @ziweiai/api test` + `pnpm -F @ziweiai/web check` xanh |
| Release | — |

## Harness Delta

Lane high-risk: chạm public contract (`apiErrorCodeSchema`) + đường tiền tệ. Đã có decision
`0010`. Bất biến: nhãn tiếng Việt (mã lỗi mới cần message Việt translatable). Rủi ro: cờ
free quên tắt ở prod ⇒ chi phí AI không kiểm soát → gate PHẢI fail-closed khi flag off +
log cảnh báo khi đang ép free. Billing thật (bảng payment/order) là story + decision riêng.

## Evidence
