# US-004 UI primitives + AppScaffold

## Status

planned

## Lane

normal

## Product Contract

Dựng tầng UI nền: chuyển RN primitive + StyleSheet sang HTML + scoped CSS/CSS vars
(từ `tokens.css` ở US-003). Sau story: có bộ component dùng lại (button, card, form
control, banner, full-screen state) + khung layout `AppScaffold` cho US-006..008 lắp
màn hình vào.

## Relevant Product Docs

- `SPEC.md` Phần C — Phase 5, Section 18 (styling), A8 (RN→HTML mapping)
- `docs/product/invariants.md` (không hardcode chữ Hán)

## Acceptance Criteria

- Component primitive: `AppScaffold`, `PrimaryButton`, `SummaryCard`, `FormField`,
  `TextInputField`, `SelectField`, `NoticeBanner`, `FullScreenState`, `EmptyStateCard`,
  `Spinner` — tất cả ở `src/lib/components/ui/`.
- Mọi style dùng `var(--*)` từ `tokens.css`; chỉ animate `transform`/`opacity`.
- `useWindowDimensions` → CSS media query (768/1024), KHÔNG đo JS.
- A11y: `<button type>` thật, label gắn `for`, focus-visible ring, spinner
  `role="status"` + nhãn ẩn tiếng Việt.
- Form control dùng `$bindable` value; `aria-invalid` + `aria-describedby` khi lỗi.
- Mọi chuỗi hiển thị tiếng Việt; không chữ Hán.

## Design Notes

- Tạo `Spinner` + `FullScreenState` trước (US-005..007 phụ thuộc).
- `PrimaryButton`: props `variant`/`loading`/`disabled`/`type`; loading khoá click.
- `AppScaffold`: header (tiêu đề + slot action) + `<main>` semantic + container responsive.
- Route nháp `/_ui-sandbox` (dev-only, gate `import.meta.env.DEV`) để kiểm mắt.

## Validation

`scripts\bin\harness-cli.exe story update --id US-004 --unit 0 --integration 0 --e2e 0 --platform 1`

| Layer | Expected proof |
| --- | --- |
| Unit | — |
| Integration | — |
| E2E | — |
| Platform | `tsc --noEmit` + `pnpm check` (svelte-check) xanh; keyboard focus ring |
| Release | — |

## Harness Delta

Primitive là nền cho mọi màn hình US-006..008; giữ kỷ luật YAGNI (không thêm biến thể chưa cần).

## Evidence

_(điền sau khi implement)_
