# US-005 Dashboard + birth form + nav

## Status

implemented

## Lane

normal

## Product Contract

Dựng màn hình chính sau đăng nhập: form nhập thông tin sinh + sidebar lịch sử gần đây
+ điều hướng giữa các hệ thuật số. Sau story: người dùng đăng nhập tạo được lá số
(POST /charts) và điều hướng tới trang chi tiết.

## Relevant Product Docs

- `SPEC.md` Phần C — Phase 6, A7 (API surface), A8 (mapping)
- `docs/product/api-contract.md` (`createChart`, `fetchHistory`)
- `docs/product/invariants.md` (nhãn/lỗi tiếng Việt)

## Acceptance Criteria

- Đăng nhập → nhập form hợp lệ → submit → điều hướng sang trang chi tiết với id thật.
- Submit thiếu field → chặn + báo lỗi tiếng Việt (không nuốt lỗi).
- Sidebar lịch sử load (history limit 8) hoặc hiện empty state.
- Map `chartSystem` → route đúng (ziwei/bazi/…); không sai trang chi tiết rỗng.
- Layout 2 cột responsive; <768px xếp dọc.

## Design Notes

- Tách nhỏ DashboardScreen (component phức tạp nhất): `dashboard-model.svelte.ts`
  (factory: state draft + `createMutation` createChart + điều hướng), `BirthForm.svelte`,
  `DashboardSidebar.svelte`, `ChartSystemPicker.svelte`.
- draft là `$state` thuần, validity là `$derived` (KHÔNG `$effect` ghi ngược state).
- Dùng primitive US-004; on success `goto('/charts/<id>')` (hoặc route hệ tương ứng).

## Validation

`scripts\bin\harness-cli.exe story update --id US-005 --unit 1 --integration 0 --e2e 0 --platform 1`

> Proof khớp matrix durable (nguồn sự thật): unit 1, integration 0, e2e 0, platform 1.

| Layer | Expected proof |
| --- | --- |
| Unit | logic draft validity (`birth-profile-draft`, `dashboard-history`) |
| Integration | — |
| E2E | (chưa có spec riêng — flow form được phủ gián tiếp ở E2E US-006/US-007) |
| Platform | `pnpm check` + `tsc --noEmit` xanh |
| Release | — |

## Harness Delta

DashboardScreen được tách thành model + 3 component — 5 wrapper hệ ở US-007 tái dùng `dashboard-model`.

## Evidence

_(điền sau khi implement)_
