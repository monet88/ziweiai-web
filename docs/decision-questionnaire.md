# Phiếu Chốt Quyết Định Còn Mơ Hồ

Ngày cập nhật: 2026-07-13

## Mục Đích

File này là bản hỏi nhanh cho chủ dự án. Trả lời 5 dòng ở cuối file là đủ để
tiếp tục goal hiện hành mà không phải hỏi lại nhiều vòng.

Nguồn chi tiết:

- `docs/open-decisions.md`
- `docs/remaining-decision-brief.md`
- `docs/project-execution-dashboard.md`
- `docs/goal-completion-audit.md`

## Khuyến Nghị Mặc Định

Với vai trò CEO/PM, khuyến nghị chọn:

- Demo public ổn định trước.
- Chạy live mutation smoke một lần có kiểm soát.
- Giữ DeepSeek làm provider chính, OpenRouter/OpenAI-compatible làm fallback.
- Mở free beta có quota chặt, không free unlimited.
- Giữ Lục Hào fallback cho demo, harden runtime thật trước paid/production canonical.
- Để Payment/VietQR/XU sau core reliability.

Lý do: dự án đang cần bằng chứng activation, reliability và AI data quality trước
khi mở tiền hoặc tăng lưu lượng. Payment và quota rộng khi core AI chưa có live
evidence sẽ tăng rủi ro support, refund và burn cost.

## Câu Hỏi Cần Chốt

### Q1 — Live Mutation Smoke Production

Có cho phép chạy smoke thật trên `https://tuvitoantap.vercel.app` không?

- A. Cho phép chạy một lần có kiểm soát. Khuyến nghị.
- B. Chưa chạy; tạm chấp nhận goal chưa complete phần production AI flow.

Ghi chú: lựa chọn A sẽ tạo dữ liệu Supabase production và gọi AI provider thật.
Nếu có cleanup key, script sẽ dọn dữ liệu test sau khi ghi report.

### Q2 — AI Provider Chính

Provider chính cho demo/beta là gì?

- A. DeepSeek chính, OpenRouter/OpenAI-compatible fallback. Khuyến nghị.
- B. OpenRouter/OpenAI-compatible chính. Cần chốt model và budget/latency kỳ vọng.

### Q3 — Free Beta / Quota

Chính sách AI public beta là gì?

- A. Free beta có quota chặt. Khuyến nghị.
- B. Free unlimited. Không khuyến nghị vì rủi ro cost/spam.
- C. Tắt AI public, chỉ mở cho test nội bộ.

Nếu chọn A, baseline đề xuất để bắt đầu:

- Anonymous: thấp theo IP/ngày.
- Signed-in: cao hơn anonymous.
- Vision/annual report: tách quota riêng hoặc tắt nếu chưa muốn burn cost.
- Sau 3-7 ngày không có 5xx/cost spike thì mới tăng quota.

### Q4 — Lục Hào Runtime/Fallback

Lục Hào fallback có được chấp nhận cho demo không?

- A. Chấp nhận fallback cho demo, ghi confidence `medium`. Khuyến nghị.
- B. Bắt buộc runtime `xuanshu` thật trước khi coi phần này xong.

### Q5 — Payment/VietQR/XU

Payment/VietQR/XU xử lý ngay hay để sau?

- A. Để sau core reliability. Khuyến nghị.
- B. Làm ngay phase kế tiếp. Cần tạo spec ledger/idempotency/webhook/paid gate
  trước khi code.

## Mẫu Trả Lời Nhanh

Anh có thể trả lời một dòng:

```text
Q1=A, Q2=A, Q3=A, Q4=A, Q5=A
```

Hoặc nếu muốn ghi rõ:

```text
Cho phép chạy live mutation smoke; DeepSeek chính; free beta quota chặt; giữ Lục Hào fallback demo; payment để sau.
```

## Việc Tôi Sẽ Làm Sau Khi Anh Chốt

Nếu anh chọn cấu hình khuyến nghị `Q1=A, Q2=A, Q3=A, Q4=A, Q5=A`:

1. Chạy live mutation smoke production bằng guarded script.
2. Ghi report mới trong `docs/reports/`.
3. Cập nhật audit goal với kết quả pass/fail thật.
4. Nếu pass, đóng các blocker production-facing còn lại hoặc ghi rõ rủi ro còn
   cần phase sau.
5. Không đụng payment, secret, production config ngoài phạm vi smoke đã được
   xác nhận.
