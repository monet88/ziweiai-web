# US-003 Logic thuần frontend + i18n + design tokens

## Status

implemented

## Lane

normal

## Product Contract

Mang toàn bộ logic thuần (không phụ thuộc React) + từ điển i18n tiếng Việt +
design tokens sang web. Sau story: hàm build view-model + dịch key chạy độc lập;
test quét chữ Hán có khung; bất biến ngôn ngữ được đảm bảo bằng test.

## Relevant Product Docs

- `docs/product/invariants.md` (bất biến CJK, fail-fast, fallback "Thuật ngữ cũ")
- `SPEC.md` Phần C — Phase 4, Section 15 (state policy)

## Acceptance Criteria

- Logic thuần copy sang `src/lib/features/*` giữ import `@ziweiai/contracts` (workspace).
- `translateZiweiKey` fail-fast: key thiếu → throw, KHÔNG fallback im lặng ra chữ Hán.
- `text/cjk.ts` copy `CJK_TEXT_PATTERN` (KHÔNG import `@ziweiai/core`); displayName Hán
  → trả `"Thuật ngữ cũ"`; displayName ASCII → trả nguyên.
- `legacy-ziwei-display-name.ts` + `iztro` KHÔNG được mang vào web.
- `tokens.ts` → `tokens.css` (CSS custom properties trong `:root`).
- Test vitest: dịch key xanh + quét `\p{Script=Han}` trên output xanh.

## Design Notes

- Copy verbatim: palace-grid-layout, palace-view-builder, chart-detail-view-state,
  chart-explanation-intent, explanation-sections, markdown-blocks, birth-profile-draft,
  history-query, chart-system-registry.
- Copy-adapt: `chart-display.ts` (gỡ import React/RN nếu lẫn); `ziwei-terms-vi.ts`
  (`process.env.NODE_ENV` → `import.meta.env.DEV`).
- Quyết định Q4 (bỏ iztro): `docs/decisions/0006-spec-vs-code-naming.md` neighbourhood
  — nếu muốn tách riêng, tạo decision 0008.

## Validation

`scripts\bin\harness-cli.exe story update --id US-003 --unit 1 --integration 0 --e2e 0 --platform 0`

| Layer | Expected proof |
| --- | --- |
| Unit | dịch key fail-fast; cjk fallback; quét Han trên view-model mẫu |
| Integration | — |
| E2E | — |
| Platform | — |
| Release | — |

## Harness Delta

Test quét chữ Hán là proof tái dùng cho US-007, US-008.

## Evidence

_(điền sau khi implement)_
