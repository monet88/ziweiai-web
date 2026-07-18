# Hợp đồng API (web ↔ api)

> Tên schema/route lấy **trực tiếp từ code thật** (`packages/contracts`, `apps/api`,
> `apps/web/src/lib/api-client`), không theo minh hoạ trong SPEC cũ. Snapshot này
> được đối chiếu lại ngày 2026-07-12; khi code đổi, cập nhật file này trước khi
> coi docs là nguồn tham chiếu.

## Endpoint thật (snapshot 2026-07-12)

| Endpoint | Auth | Body / Param | Response schema (camelCase, từ `@ziweiai/contracts`) |
|---|---|---|---|
| `GET /health` | Public | — | `healthResponseSchema` |
| `GET /features` | Public | — | `featuresResponseSchema` |
| `POST /charts` | Bearer | `createChartRequestSchema` | `createChartResponseSchema` |
| `GET /charts/:id` | Bearer | param `z.uuid()` | `chartDetailResponseSchema` |
| `POST /charts/:id/horoscope` | Bearer | param `z.uuid()` + `horoscopeRequestSchema` (`asOf` `YYYY-MM-DD`, `scopes` subset không rỗng) | `horoscopeResponseSchema` (`{ chartId, asOf, frame }`) |
| `GET /charts/:id/daily?asOf=YYYY-MM-DD` | Bearer | param `z.uuid()` + `dailyFortuneRequestSchema` (`asOf` `YYYY-MM-DD`) | `dailyFortuneResponseSchema` (`{ chartId, asOf, frame, summary }`) |
| `GET /charts/:id/monthly?asOf=YYYY-MM` | Bearer | param `z.uuid()` + `monthlyFortuneRequestSchema` (`asOf` `YYYY-MM`) | `monthlyFortuneResponseSchema` (`{ chartId, asOf, frame, summary }`) |
| `POST /charts/:id/annual-report?year=YYYY` | Bearer | param `z.uuid()` + `annualReportRequestSchema` (`year` int 1900–2100, coerce từ query) | `annualReportResponseSchema` (`{ chartId, year, frame, markdown }`) |
| `POST /divinations` | Bearer | `createDivinationRequestSchema` | `createDivinationResponseSchema` |
| `POST /explanations` | Bearer | `createExplanationRequestSchema` | `createExplanationResponseSchema` |
| `GET /history?limit=N` | Bearer | limit int 1–50, default 20 | `historyListResponseSchema` |
| `POST /conversations` | Bearer | `createConversationRequestSchema` | `createConversationResponseSchema` |
| `GET /conversations?chartSnapshotId=...` | Bearer | query `chartSnapshotId` uuid | `conversationListResponseSchema` |
| `GET /conversations/:id` | Bearer | param uuid | `conversationDetailResponseSchema` |
| `POST /conversations/:id/messages` | Bearer | `createConversationMessageRequestSchema` | `conversationDetailResponseSchema` |
| `POST /conversations/:id/messages/stream` | Bearer | `createConversationMessageRequestSchema` | SSE `conversationStreamEventSchema` |
| `POST /quizzes/mbti` | Bearer | `mbtiQuizRequestSchema` | `mbtiResultSchema` |
| `POST /pairings` | Bearer | `pairingRequestSchema` | `pairingSnapshotSchema` |
| `POST /vision/face` | Bearer | multipart `image` + optional `question` | `visionAnalysisSchema` |
| `POST /vision/palm` | Bearer | multipart `image` + optional `question` | `visionAnalysisSchema` |
| `DELETE /vision/results/:id` | Bearer | param uuid | 204 No Content |
| `POST /draws/tarot` | Bearer | `question`, `spread`, optional `seed` | `tarotDrawSchema` |
| `POST /draws/lenormand` | Bearer | `question`, `spread`, optional `seed` | `lenormandDrawSchema` |
| `POST /dreams/interpret` | Bearer | `dream` | `dreamInterpretationSchema` |
| `POST /draws/stick` | Bearer | `question`, optional `seed` | `stickDrawSchema` |
| `POST /almanac/select` | Bearer | `topic`, `startDate`, `endDate` | `almanacSelectionSchema` |

## Quy ước

- Mọi response UI dùng đều **parse bằng `@ziweiai/contracts`** trước khi vào state. Không
  trust raw JSON dù trong cùng monorepo. Zod parse fail = integration bug.
- Web **không** định nghĩa lại DTO type; import từ `@ziweiai/contracts`.
- Web import qua `workspace:*` (không vendor/copy) → triệt tiêu schema drift.

## Hình dạng api-client (port từ Expo, giữ tên hàm phẳng)

Expo app dùng hàm phẳng, KHÔNG dùng object lồng `apiClient.charts.listHistory()` như SPEC §13:

- `fetchHealth()`
- `fetchFeatures()`
- `fetchHistory(token, limit)`
- `createChart(token, request)`
- `createDivination(token, request)`
- `fetchChartDetail(token, chartId)`
- `fetchChartHoroscope(token, chartId, asOf, scopes)`
- `createExplanation(token, request)`
- `createConversation(token, request)`
- `fetchConversationsForChart(token, chartSnapshotId)`
- `fetchConversationDetail(token, conversationId)`
- `appendConversationMessage(token, conversationId, request)`
- `streamConversationMessage(token, conversationId, request)`
- `collectAssistantStream(token, conversationId, request)`
- `createMbtiQuiz(token, answers)`
- `createPairing(token, request)`
- `createVisionAnalysis(token, kind, params)`
- `deleteVisionResult(token, visionResultId)`
- `drawTarot(token, params)`
- `drawLenormand(token, params)`
- `interpretDream(token, params)`
- `drawStick(token, params)`
- `selectAlmanac(token, params)`
- `fetchDailyFortune(token, chartId, asOf)`
- `fetchMonthlyFortune(token, chartId, asOf)`
- `createAnnualReport(token, request)`
- hằng `DASHBOARD_HISTORY_LIMIT`, `HISTORY_SCREEN_LIMIT`, helper `createHeaders`
- hằng `DEFAULT_HOROSCOPE_SCOPES`, `HOROSCOPE_QUERY_STALE_MS`, `HOROSCOPE_QUERY_GC_MS` (US-014)

## Error envelope (xác nhận từ code)

Mọi lỗi backend trả cùng một shape, parse bằng `apiErrorSchema` (`@ziweiai/contracts`):

```jsonc
{
  "code": "INVALID_INPUT",      // apiErrorCodeSchema (12 giá trị, xem dưới)
  "message": "…",                // string tiếng Việt, luôn có
  "requestId": "…" | null        // gắn từ request-id.middleware, có thể null
}
```

Nguồn: `apps/api/src/common/http/api-error.filter.ts` (catch-all filter) +
`ApiErrorHttpException` (`api-error.ts`). `ZodError` được map cứng về
`400 INVALID_INPUT`. Lỗi không xác định → `500 INTERNAL_ERROR`.

## Map mã lỗi → HTTP → UI (key theo `apiErrorCode`, không theo HTTP status)

`apiErrorCodeSchema` có **12 giá trị**. Bảng dưới là cặp `code` ↔ HTTP status
thường gặp từ backend:

| `code` | HTTP | Nguồn phát | Hành vi UI |
|---|---|---|---|
| `UNAUTHORIZED` | 401 | `SupabaseAuthGuard` (thiếu/invalid bearer) | clear auth + redirect `/sign-in` |
| `FORBIDDEN` | 403 | quyền truy cập bị chặn ở policy/guard | hiện lỗi không đủ quyền |
| `INVALID_INPUT` | 400 | `ZodError` filter + validate ở charts/explanations service | hiện form validation |
| `NOT_FOUND` | 404 | charts/explanations (lá số không tồn tại/không sở hữu) | hiện not-found |
| `RATE_LIMITED` | 429 | quota (`charts.service`, `explanations.service`) | hiện thông báo vượt hạn mức + retry sau |
| `PAYMENT_REQUIRED` | 402 | gate premium/annual report/AI entitlement | hiện CTA nâng cấp hoặc trả phí |
| `IDENTITY_REQUIRED` | 403 | anonymous user gọi tính năng cần email identity (vd face/palm) | yêu cầu đăng nhập email |
| `FEATURE_DISABLED` | 403 | feature flag tắt một hệ mở rộng | ẩn entry hoặc hiện thông báo tính năng chưa mở |
| `VISION_QUOTA_EXCEEDED` | 429 | quota riêng cho Xem Tướng/Xem Tay | hiện vượt hạn mức vision |
| `PROVIDER_TIMEOUT` | 504 | AI provider router (timeout) | hiện lỗi nhà cung cấp + cho retry |
| `PROVIDER_UNAVAILABLE` | 502 | AI provider router (provider lỗi/không khả dụng) | hiện lỗi nhà cung cấp + cho retry |
| `INTERNAL_ERROR` | 500 | fallback catch-all filter | hiện server error retry được |

Lưu ý chênh với SPEC §20 cũ (đã chỉnh ở đây cho khớp code):

- Validation là **400/INVALID_INPUT**, KHÔNG phải 422 — backend không dùng 422.
- Ownership sai thường trả **404** (`NOT_FOUND`) để không lộ sự tồn tại của bản
  ghi người khác; không suy luận quyền truy cập chỉ từ HTTP status.
- Ngoài bảng: **network error** (fetch fail) → hiện reconnect/retry; **Zod parse error**
  ở web (response không khớp contract) → hiện integration error chung + log ở dev.

Không hiển thị raw backend exception cho user.
