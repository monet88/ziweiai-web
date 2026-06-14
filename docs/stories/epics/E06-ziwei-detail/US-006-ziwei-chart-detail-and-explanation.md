# US-006 Chi tiết Tử Vi + luận giải AI theo cung

## Status

planned

## Lane

high-risk

## Product Contract

Trang chi tiết Tử Vi: vẽ vòng 12 cung (palace grid), chọn cung, sinh luận giải AI theo
cung (POST /explanations). Đây là màn hình lõi của sản phẩm. Tên cung/sao/luận giải đều
tiếng Việt, không rò chữ Hán.

## Relevant Product Docs

- `SPEC.md` Phần C — Phase 7, Section 7 (createQuery), Section 20 (error)
- `docs/product/api-contract.md` (`fetchChartDetail`, `createExplanation`)
- `docs/product/invariants.md` (CJK guard, fail-fast, sanitize markdown)
- `docs/decisions/0007-web-server-boundary.md`

## Acceptance Criteria

- Mở 1 lá số → thấy 12 cung tiếng Việt → chọn cung → bấm luận giải → nhận text tiếng
  Việt render markdown đã sanitize.
- Đổi sang lá số khác → state cung selected reset đúng (không giữ cung lá số cũ).
- Test quét `\p{Script=Han}` trên output palace + explanation xanh (không rò Hán).
- Markdown luận giải KHÔNG render `{@html}` thô chưa sanitize (chặn XSS).
- Snapshot legacy gặp displayName Hán → fallback `"Thuật ngữ cũ"` (không lọt Hán).

## Design Notes

- `chart-detail-model.svelte.ts`: `$state` selectedPalaceKey, reset khi chartId đổi qua
  `{#key chartId}` block — TRÁNH `$effect` ghi state gây vòng lặp.
- `PalaceGrid`/`PalaceCell` dựng từ `palace-grid-layout` + `palace-view-builder` (US-003).
- `explanation-model.svelte.ts`: `createMutation` createExplanation theo intent cung.
- `MarkdownView.svelte`: render `markdown-blocks` → HTML đã sanitize.
- **PHẢI định vị** `use-palace-explanation-model.ts` (reader bỏ sót); fallback tái dựng
  từ `chart-explanation-intent` + `createExplanation`.

## Validation

`scripts\bin\harness-cli.exe story update --id US-006 --unit 1 --integration 0 --e2e 1 --platform 0`

| Layer | Expected proof |
| --- | --- |
| Unit | test quét Hán trên output palace + explanation; reset state theo chartId |
| Integration | — |
| E2E | mở lá số → chọn cung → luận giải markdown tiếng Việt → đổi lá số → reset |
| Platform | `pnpm check` + `tsc --noEmit` xanh |
| Release | — |

## Harness Delta

Lane high-risk: chạm public contract (POST /explanations), render nội dung AI (XSS),
bất biến ngôn ngữ. Nếu `use-palace-explanation-model.ts` không định vị được → ghi backlog.

## Evidence

_(điền sau khi implement)_
