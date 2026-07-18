# Bản Tóm Tắt Quyết Định Còn Lại

Ngày cập nhật: 2026-07-13 10:23 +07

## Mục Đích

Tài liệu này gom các phần còn mơ hồ cần chủ dự án chốt để hoàn tất goal hiện
hành. Đây là bản ngắn để trả lời nhanh; bản chi tiết nằm ở
`docs/open-decisions.md`, `docs/project-execution-dashboard.md` và
`docs/goal-completion-audit.md`. Nếu muốn trả lời theo dạng A/B ngắn gọn, dùng
`docs/decision-questionnaire.md`.

## Khuyến Nghị CEO/PM

Chọn hướng **demo public ổn định trước**, chưa mở payment/XU ngay.

Lý do: sản phẩm đang cần bằng chứng mạnh cho activation, reliability và AI data
quality. Nếu thêm payment khi core flow hoặc provider còn thiếu live evidence,
rủi ro support/refund và mất niềm tin cao hơn lợi ích doanh thu sớm.

## Cần Anh Chốt

| Mã | Câu hỏi | Khuyến nghị mặc định | Tôi cần anh trả lời/cung cấp | Việc tôi sẽ làm sau đó |
| --- | --- | --- | --- | --- |
| D1 | Có cho chạy live mutation smoke production không? | Có, chạy một lần có kiểm soát. | Trả lời rõ: `cho phép chạy live mutation smoke`. Nếu muốn cleanup, xác nhận có thể dùng `SUPABASE_SERVICE_ROLE_KEY` từ env hiện tại. | Chạy `LIVE_MUTATION_SMOKE=1 LIVE_MUTATION_SMOKE_CONFIRM=tuvitoantap.vercel.app pnpm smoke:vercel-live-mutation`, ghi report, dọn dữ liệu nếu có cleanup key. |
| D2 | Supabase project nào là production ledger cần verify? | Đã xử lý. | Không cần thêm ở thời điểm này. | Project ref `ttvqrukctlebkggsylun`; linked ledger pass 2026-07-13 10:23 +07. |
| D3 | AI provider chính là DeepSeek hay OpenRouter/OpenAI-compatible? | Giữ DeepSeek chính, OpenRouter/OpenAI-compatible làm fallback. | Trả lời `DeepSeek chính` hoặc `OpenRouter chính`. Nếu chọn OpenRouter chính, cần model mục tiêu và budget/latency kỳ vọng. | Cập nhật policy docs/env checklist; chỉ đổi config/code nếu anh xác nhận. |
| D4 | Public beta AI mở miễn phí thế nào? | Free beta có quota chặt, không free unlimited. | Chốt quota baseline: anonymous/ngày, signed-in/ngày, vision/annual có bật không. | Cập nhật quota policy docs, test/hardening nếu thay đổi code. |
| D5 | Lục Hào fallback có chấp nhận cho demo không? | Chấp nhận cho demo, harden `xuanshu` trước paid/production canonical. | Trả lời `giữ fallback demo` hoặc `bắt buộc runtime thật`. | Nếu giữ fallback: ghi rõ giới hạn trong docs. Nếu bắt buộc runtime thật: mở phase hardening riêng. |
| D6 | Payment/VietQR/XU làm ngay hay để sau? | Để sau core reliability. | Trả lời `để sau` hoặc chọn provider/payment flow cụ thể. | Nếu để sau: giữ backlog. Nếu làm ngay: tạo spec ledger/idempotency/webhook/paid gate trước khi code. |

Mẫu trả lời nhanh:

```text
Q1=A, Q2=A, Q3=A, Q4=A, Q5=A
```

## Điều Kiện Hoàn Thành Goal

Goal chỉ nên đánh dấu complete khi có đủ bằng chứng:

- `goal.md`, `spec.md`, `AGENTS.md` và docs điều hành phản ánh đúng trạng thái.
- Tooling map đã rõ: Vercel dùng CLI/script, Build Web Apps là skill frontend,
  Sites/Figma/Browser dùng đúng phạm vi.
- Mỗi feature có validation/hardening matrix.
- Local test/smoke pass đúng phạm vi.
- Production safe smoke pass.
- Live mutation smoke production pass hoặc được chủ dự án quyết định hoãn rõ ràng
  khỏi acceptance hiện tại.
- Supabase linked migration ledger đã pass; chạy lại nếu có migration mới trước deploy.
- Provider/quota/free beta policy được chốt.
- Không phát hiện secret/token/key thật trong thay đổi chuẩn bị push.

## Anti-Self-Sabotage

- Không mở payment để “trông có doanh thu” khi core AI chưa có live evidence.
- Không coi safe smoke HTTP 200 là bằng chứng AI provider thật hoạt động.
- Không dùng TestSprite trạng thái queued làm bằng chứng pass.
- Không đổi provider chính và chạy beta rộng cùng lúc.
- Không chạy live mutation smoke âm thầm vì nó ghi Supabase production và gọi AI thật.
