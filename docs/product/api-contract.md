# Hợp đồng API (web ↔ api)

> Tên schema/route lấy **trực tiếp từ code thật** (`packages/contracts`, `apps/api`), không
> theo minh hoạ trong SPEC.md (SPEC dùng tên PascalCase ví dụ `ChartHistoryResponseSchema`
> và route `/charts/history` — KHÔNG khớp code thật; xem [[0006-spec-vs-code-naming]]).

## Endpoint thật (xác nhận từ reader + contracts)

| Endpoint | Auth | Body / Param | Response schema (camelCase, từ `@ziweiai/contracts`) |
|---|---|---|---|
| `GET /health` | Public | — | `healthResponseSchema` |
| `POST /charts` | Bearer | `createChartRequestSchema` | `createChartResponseSchema` |
| `GET /charts/:id` | Bearer | param `z.uuid()` | `chartDetailResponseSchema` |
| `POST /explanations` | Bearer | `createExplanationRequestSchema` | `createExplanationResponseSchema` |
| `GET /history?limit=N` | Bearer | limit int 1–50, default 20 | `historyListResponseSchema` |

## Quy ước

- Mọi response UI dùng đều **parse bằng `@ziweiai/contracts`** trước khi vào state. Không
  trust raw JSON dù trong cùng monorepo. Zod parse fail = integration bug.
- Web **không** định nghĩa lại DTO type; import từ `@ziweiai/contracts`.
- Web import qua `workspace:*` (không vendor/copy) → triệt tiêu schema drift.

## Hình dạng api-client (port từ Expo, giữ tên hàm phẳng)

Expo app dùng hàm phẳng, KHÔNG dùng object lồng `apiClient.charts.listHistory()` như SPEC §13:

- `fetchHealth()`
- `createChart(...)`
- `fetchChartDetail(id)`
- `createExplanation(...)`
- `fetchHistory(limit)`
- hằng `DASHBOARD_HISTORY_LIMIT`, `HISTORY_SCREEN_LIMIT`, helper `createHeaders`

## Map lỗi → UI (SPEC §20)

| Lỗi | Hành vi UI |
|---|---|
| 401 | clear auth + redirect `/sign-in` |
| 403 | hiện permission error |
| 404 | hiện not-found |
| 422 | hiện form validation |
| 500 | hiện server error retry được |
| network | hiện reconnect/retry |
| Zod parse error | hiện integration error chung + log ở dev |

Không hiển thị raw backend exception cho user.
