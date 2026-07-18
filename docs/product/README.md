# Product Docs

Hợp đồng sản phẩm hiện tại của `ziweiai-web`, dẫn xuất từ spec gốc và được đồng
bộ với `spec.md`. Spec là input material, không phải living plan — xem
`docs/HARNESS.md` §Spec Lifecycle.

## File hiện có

- `overview.md` — bối cảnh sản phẩm + phạm vi.
- `invariants.md` — 3 bất biến (boundary client/server, ngôn ngữ không-Hán, token tươi).
  Vi phạm = build fail; sửa chỉ qua decision record.
- `api-contract.md` — hợp đồng API web ↔ api (endpoint, schema, error-map), tên lấy
  trực tiếp từ `packages/contracts` + `apps/api`.

## Update Rule

Khi behavior thay đổi:

1. Update the affected product doc.
2. Update or create the story packet.
3. Update durable proof status nếu Harness CLI có trong workspace. Nếu không có,
   ghi evidence bằng code/tests/report như `docs/TEST_MATRIX.md` mô tả.
4. Record a decision nếu thay đổi ảnh hưởng architecture, scope, risk hoặc rule
   sản phẩm đã chốt.
