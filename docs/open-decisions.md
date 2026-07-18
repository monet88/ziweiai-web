# Open Decisions

Ngày cập nhật: 2026-07-13  
Phạm vi: các quyết định đang block completion của goal hiện hành.

## Cách Dùng

Tài liệu này gom các quyết định cần user chốt. Mỗi quyết định có khuyến nghị
CEO/PM mặc định để giảm vòng lặp. Nếu không có phản hồi khác, hướng thực thi nên
đi theo khuyến nghị mặc định nhưng **không tự chạm production data, secrets,
payment hoặc live AI spend** khi chưa được xác nhận rõ.

Nếu cần trả lời nhanh, dùng bản rút gọn tại
`docs/remaining-decision-brief.md`.

## OD-001 — Ưu Tiên 30 Ngày

| Trường | Nội dung |
| --- | --- |
| Câu hỏi | Ưu tiên 30 ngày tới là demo public ổn định hay production thương mại có payment/XU? |
| Khuyến nghị | Chọn **demo public ổn định**. |
| Lý do | Core flow và AI data quality cần bằng chứng mạnh trước khi thêm tiền. Payment khi flow còn 5xx hoặc AI luận sai sẽ tăng support/refund và làm mất niềm tin. |
| Metric | Activation: user mới tạo được chart/quẻ; Reliability: live mutation smoke pass; Quality: AI dùng snapshot thật; Cost: quota không vượt budget beta. |
| Việc cần làm nếu chốt | Chạy live mutation smoke, chốt provider/quota, ghi report. Supabase ledger đã verify 2026-07-13 10:23 +07. |
| Không làm | Không triển khai payment/XU trước khi core reliability pass bằng chứng mới. |
| Trạng thái | Recommended, awaiting user confirmation. |

## OD-002 — AI Provider Chính

| Trường | Nội dung |
| --- | --- |
| Câu hỏi | Provider chính là DeepSeek hay OpenRouter/OpenAI-compatible? |
| Khuyến nghị | Giữ **DeepSeek làm chính**, giữ **OpenRouter/OpenAI-compatible làm fallback/vision-compatible** cho demo. |
| Lý do | DeepSeek đã là provider đang vận hành trong repo; router/failover đã có tests. Đổi provider chính trước khi có live mutation smoke mới sẽ trộn hai rủi ro: provider config và product reliability. |
| Điều kiện đổi | Chỉ chuyển OpenRouter làm chính nếu DeepSeek timeout/unavailable hoặc chất lượng thấp trong live smoke/report. |
| Validation | Provider router tests pass; live mutation smoke phải ghi providerName và HTTP status. |
| Rủi ro | OpenRouter model/provider routing có thể đổi hành vi; cần theo dõi cost, latency, CJK guard và provider unavailable. |
| Trạng thái | Recommended, awaiting user confirmation. |

## OD-003 — Public Beta AI/Quota Policy

| Trường | Nội dung |
| --- | --- |
| Câu hỏi | AI explanation mở miễn phí cho public beta hay siết quota/cost gate trước? |
| Khuyến nghị | Mở **free beta có quota chặt**, không mở “free unlimited”. |
| Lý do | Cần giảm friction để test activation nhưng vẫn tránh burn cost. Quota/error mapping đã được harden; nên dùng nó thay vì khóa toàn bộ AI. |
| Baseline đề xuất | Anonymous: quota thấp theo IP/ngày; signed-in: quota cao hơn; vision/annual tách quota; provider timeout/unavailable hiện message Việt rõ. |
| Metric | Requests/day, `RATE_LIMITED`, `PROVIDER_TIMEOUT`, `PROVIDER_UNAVAILABLE`, token spend/day. |
| Điều kiện mở rộng | Sau 3-7 ngày không có 5xx/cost spike, tăng quota hoặc mở thêm paid waitlist. |
| Trạng thái | Recommended, awaiting user confirmation. |

## OD-004 — Lục Hào Runtime/Fallback

| Trường | Nội dung |
| --- | --- |
| Câu hỏi | Giữ Lục Hào fallback cho demo hay phải harden `xuanshu` runtime thật trước khi coi xong? |
| Khuyến nghị | **Giữ fallback cho demo**, ghi rõ confidence `medium`; harden `xuanshu` runtime trước production thương mại. |
| Lý do | Fallback giúp demo không bị blocked/rỗng dữ liệu trên Vercel serverless. Nhưng bản canonical cần runtime bridge ổn định hơn hoặc backend dài hạn. |
| Validation | Unit tests `astro-engine`; live mutation smoke Lục Hào phải có `snapshot.liuyao` và `blocksExactReading=false`. |
| Rủi ro | Fallback có thể kém chuẩn hơn runtime gốc; không nên marketing như kết quả chuyên sâu trả phí. |
| Trạng thái | Recommended, awaiting user confirmation. |

## OD-005 — Live Mutation Smoke Production

| Trường | Nội dung |
| --- | --- |
| Câu hỏi | Có cho phép chạy live smoke tạo dữ liệu thật trên Supabase production và gọi AI provider thật không? |
| Khuyến nghị | **Cho phép chạy một lần có kiểm soát**, dùng guarded script và cleanup nếu service role có sẵn. |
| Lý do | Đây là bằng chứng còn thiếu lớn nhất để chứng minh core flow hiện tại, không chỉ safe smoke. |
| Lệnh | `LIVE_MUTATION_SMOKE=1 LIVE_MUTATION_SMOKE_CONFIRM=tuvitoantap.vercel.app pnpm smoke:vercel-live-mutation` |
| Cleanup | Nếu có `SUPABASE_SERVICE_ROLE_KEY`: thêm `LIVE_MUTATION_SMOKE_CLEANUP=1`. |
| Report cần ghi | Chart id, owner user id, provider, HTTP status, cleanup status, lỗi 5xx/quota/provider nếu có. |
| Trạng thái | Awaiting explicit approval because it writes production data and calls AI. |

## OD-006 — Supabase Linked Migration Ledger

| Trường | Nội dung |
| --- | --- |
| Câu hỏi | Có cho phép link Supabase project hoặc cung cấp context để verify migration ledger không? |
| Khuyến nghị | **Verify linked ledger trước khi mở beta rộng**. |
| Lý do | Local migration sanity pass chưa chứng minh production DB đã apply đủ RLS/table/index. |
| Lệnh | `SUPABASE_VERIFY_LINKED=1 pnpm check:supabase-migrations` |
| Kết quả | Pass 2026-07-13 10:23 +07 cho project ref `ttvqrukctlebkggsylun`; local/remote cùng versions `000001`, `000002`, `000004`-`000010`. |
| Rủi ro còn lại | Không `supabase config push` bừa bãi vì auth/rate-limit cloud có thể khác local `config.toml`. |
| Trạng thái | Verified. Không còn blocker hiện tại. |

## OD-007 — Monetization / Payment / XU

| Trường | Nội dung |
| --- | --- |
| Câu hỏi | Payment/VietQR/XU làm ngay hay để sau core reliability? |
| Khuyến nghị | **Để sau core reliability**, chỉ chuẩn bị spec/backlog. |
| Lý do | Xử lý tiền cần ledger idempotent, audit, refund/privacy/terms. Làm sớm khi AI/reliability chưa khóa sẽ tăng rủi ro business. |
| Điều kiện bắt đầu | Live mutation smoke pass, provider/quota policy chốt, observability tối thiểu có report. Supabase ledger đã verified. |
| Validation khi làm | Unit test ledger/idempotency; integration webhook; E2E paid gate; audit path. |
| Trạng thái | Deferred by recommendation. |

## Anti-Self-Sabotage

- Không mở payment chỉ vì demo home/API public pass.
- Không đổi provider chính và deploy production cùng lúc nếu chưa có smoke report.
- Không tăng quota beta khi chưa có token spend visibility.
- Không coi historical live smoke là bằng chứng hiện tại sau deploy/env/schema mới.
- Không chạy live mutation smoke nếu chưa có xác nhận rõ từ user.
