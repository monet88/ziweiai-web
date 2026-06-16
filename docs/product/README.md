# Product Docs

Hợp đồng sản phẩm hiện tại của `ziweiai-web`, dẫn xuất từ `SPEC.md` (SPEC là input
material, không phải living plan — xem `docs/HARNESS.md` §Spec Lifecycle).

## File hiện có

- `overview.md` — bối cảnh sản phẩm + phạm vi.
- `invariants.md` — 3 bất biến (boundary client/server, ngôn ngữ không-Hán, token tươi).
  Vi phạm = build fail; sửa chỉ qua decision record.
- `api-contract.md` — hợp đồng API web ↔ api (endpoint, schema, error-map), tên lấy
  trực tiếp từ `packages/contracts` + `apps/api`.

## Update Rule

When behavior changes:

1. Update the affected product doc.
2. Update or create the story packet.
3. Update durable proof status with `scripts/bin/harness-cli story add` or
   `scripts/bin/harness-cli story update`.
4. Record a decision if the change affects architecture, scope, risk, or a
   previously settled product rule.
