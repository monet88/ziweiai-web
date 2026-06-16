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

## Error envelope (xác nhận từ code)

Mọi lỗi backend trả cùng một shape, parse bằng `apiErrorSchema` (`@ziweiai/contracts`):

```jsonc
{
  "code": "INVALID_INPUT",      // apiErrorCodeSchema (enum 8 giá trị, xem dưới)
  "message": "…",                // string tiếng Việt, luôn có
  "requestId": "…" | null        // gắn từ request-id.middleware, có thể null
}
```

Nguồn: `apps/api/src/common/http/api-error.filter.ts` (catch-all filter) +
`ApiErrorHttpException` (`api-error.ts`). `ZodError` được map cứng về
`400 INVALID_INPUT`. Lỗi không xác định → `500 INTERNAL_ERROR`.

## Map mã lỗi → HTTP → UI (key theo `apiErrorCode`, không theo HTTP status)

`apiErrorCodeSchema` có **8 giá trị**. Bảng dưới là cặp `code` ↔ HTTP status **thật**
mà backend phát (xác nhận từ mọi nơi ném `ApiErrorHttpException`):

| `code` | HTTP | Nguồn phát | Hành vi UI |
|---|---|---|---|
| `UNAUTHORIZED` | 401 | `SupabaseAuthGuard` (thiếu/invalid bearer) | clear auth + redirect `/sign-in` |
| `INVALID_INPUT` | 400 | `ZodError` filter + validate ở charts/explanations service | hiện form validation |
| `NOT_FOUND` | 404 | charts/explanations (lá số không tồn tại/không sở hữu) | hiện not-found |
| `RATE_LIMITED` | 429 | quota (`charts.service`, `explanations.service`) | hiện thông báo vượt hạn mức + retry sau |
| `PROVIDER_TIMEOUT` | 504 | AI provider router (timeout) | hiện lỗi nhà cung cấp + cho retry |
| `PROVIDER_UNAVAILABLE` | 502 | AI provider router (provider lỗi/không khả dụng) | hiện lỗi nhà cung cấp + cho retry |
| `INTERNAL_ERROR` | 500 | fallback catch-all filter | hiện server error retry được |
| `FORBIDDEN` | — | **reserved**: có trong enum nhưng KHÔNG endpoint nào phát hiện tại | (chưa dùng) |

Lưu ý chênh với SPEC §20 cũ (đã chỉnh ở đây cho khớp code):

- Validation là **400/INVALID_INPUT**, KHÔNG phải 422 — backend không dùng 422.
- `FORBIDDEN` chỉ tồn tại trong enum, chưa có đường phát; ownership sai → trả **404**
  (`NOT_FOUND`) để không lộ sự tồn tại của bản ghi người khác.
- Ngoài bảng: **network error** (fetch fail) → hiện reconnect/retry; **Zod parse error**
  ở web (response không khớp contract) → hiện integration error chung + log ở dev.

Không hiển thị raw backend exception cho user.
