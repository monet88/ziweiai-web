# 0014 Timeout riêng cho đường báo cáo năm (annual report)

Date: 2026-06-20

## Status

Accepted

## Context

US-016 thêm endpoint báo cáo năm (`POST /charts/:id/annual-report`): tổng hợp lưu niên + 12 lưu nguyệt rồi gọi LLM sinh Markdown ~600-1200 từ. Mọi provider AI (`deepseek`, `openai-compat`, `gemini`) dùng chung một timeout `AI_PROVIDER_TIMEOUT_MS` (mặc định 15000ms).

Khi chạy E2E live nhánh modal (cờ bật, cache-miss, ép provider deepseek), lần chạy đầu **timeout thật ở 15s** → 504 `PROVIDER_TIMEOUT`. Đo lại với timeout nới rộng: deepseek sinh báo cáo năm mất **~18s** (log: gửi `01:18:08` → `outcome=generated 01:18:26`, `tokensIn=2404 tokensOut=2047`).

Hệ quả: ở production với giá trị mặc định 15s, báo cáo năm **gần như luôn timeout** — tính năng không dùng được. Defect này không bị unit test bắt vì test mock provider (trả tức thì, không đo thời gian thực). Daily/monthly không ảnh hưởng (thuần đọc engine, không gọi LLM); explanation thường (~320-550 từ) vẫn vừa 15s.

## Decision

Tách timeout cho đường báo cáo năm khỏi timeout provider chung:

1. Thêm env `AI_ANNUAL_REPORT_TIMEOUT_MS` (mặc định **60000ms**), bên cạnh `AI_PROVIDER_TIMEOUT_MS` (giữ 15000ms).
2. Thêm field `timeoutMsOverride?: number` vào `ExplanationPromptPayload`. Cả ba provider dùng `payload.timeoutMsOverride ?? apiEnv.AI_PROVIDER_TIMEOUT_MS` cho `AbortSignal.timeout(...)`.
3. `AnnualReportService` truyền `timeoutMsOverride: apiEnv.AI_ANNUAL_REPORT_TIMEOUT_MS` khi gọi `providerRouter.generate('auto', ...)`.

Đường annual đã có cờ riêng (`AI_ANNUAL_REPORT_ENABLED`, decision 0010) + quota riêng (`API_ANNUAL_REPORTS_PER_DAY_PER_USER`) nên timeout riêng là phần mở rộng nhất quán của cùng ranh giới "annual là đường tốn-tài-nguyên-cao, phanh độc lập".

## Alternatives Considered

1. **Nâng `AI_PROVIDER_TIMEOUT_MS` chung lên 60s.** Sửa tối thiểu nhưng khi provider treo, cả explanation/daily/monthly cũng phải chờ tới 60s mới báo lỗi — làm xấu trải nghiệm các đường nhẹ. Bác bỏ.
2. **Viết provider riêng cho annual với timeout cứng.** Trùng lặp logic CJK guard + failover + parse đã có trong provider chain. Bác bỏ (đi ngược DRY, decision 0010 đã chọn tái dùng chain qua `promptOverride`).
3. **Để nguyên, chỉ ghi backlog.** Defect khóa tính năng cốt lõi ở production → không chấp nhận hoãn.

## Consequences

Positive:

- Báo cáo năm dùng được ở production với timeout đủ rộng (đã xác nhận E2E live: `outcome=generated providerName=deepseek`, ghi row DB thật).
- Các đường nhẹ (explanation/daily/monthly) giữ timeout 15s — vẫn fail-fast khi provider treo.
- `timeoutMsOverride` là cơ chế chung, tái dùng được cho mọi đường tốn-tài-nguyên-cao tương lai.

Tradeoffs:

- Thêm một env phải cấu hình ở deploy (có default an toàn 60s nên không bắt buộc set).
- Caller phải nhớ truyền `timeoutMsOverride` cho đường dài; quên thì lặng lẽ rơi về 15s. Đã có unit test khẳng định annual truyền đúng giá trị.

## Follow-Up

- Theo dõi p95 thời gian sinh báo cáo năm trên nhiều provider; nếu vượt 60s thì cân nhắc streaming thay vì nâng tiếp timeout (giữ kết nối lâu tốn tài nguyên server).
