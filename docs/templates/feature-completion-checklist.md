# Checklist Hoàn Thành Feature

Ngày: YYYY-MM-DD

## Phạm Vi

- Feature hoặc nhóm:
- Ticket/story/plan:
- Người thực hiện:
- File hoặc module chính:
- Hành vi người dùng thay đổi:

## Quyết Định Phạm Vi

| Câu hỏi | Trả lời |
| --- | --- |
| Feature này thuộc hàng nào trong `docs/feature-validation-hardening-matrix.md`? | |
| Có chạm auth, owner data, Supabase, AI provider, quota, deploy hoặc payment không? | |
| Có cần cập nhật docs/API contract/env/deploy checklist không? | |
| Có quyết định PM/CEO nào cần chốt trước khi merge/deploy không? | |

## Logic

| Invariant | Kết quả | Bằng chứng |
| --- | --- | --- |
| Dùng dữ liệu thật từ snapshot/chart/quẻ, không dùng dữ liệu rỗng/mock ngoài test | pending | |
| Request/response parse bằng schema từ `@ziweiai/contracts` nếu qua API boundary | pending | |
| `blocksExactReading=true` bị chặn trước khi gọi AI nếu feature gọi AI | pending | |
| Không import engine server-only vào `apps/web` | pending | |
| Output UI tiếng Việt, không raw Chinese/Han | pending | |

## Workflow

| Luồng | Kết quả | Bằng chứng |
| --- | --- | --- |
| Entry chính vào feature hoạt động | pending | |
| Happy path đi tới kết quả cuối | pending | |
| Loading/empty/error state rõ bằng tiếng Việt | pending | |
| Refresh/deep link không 404 nếu feature có route | pending | |
| History/detail/ownership đúng nếu feature lưu dữ liệu | pending | |

## Validation Đã Chạy

```text
# Dán command thật đã chạy, không ghi “pass” nếu chưa chạy.
```

| Gate | Kết quả | Ghi chú |
| --- | --- | --- |
| Typecheck/check | not run | |
| Unit | not run | |
| Integration/API | not run | |
| E2E/UI | not run | |
| Build | not run | |
| Safe smoke | not run | |
| Live mutation smoke | not run | Chỉ chạy khi được duyệt vì có thể ghi production/gọi AI thật. |
| Secret/ignore scan | not run | |

## Hardening Đã Kiểm

| Rủi ro | Kết quả | Bằng chứng hoặc quyết định |
| --- | --- | --- |
| Input xấu/thiếu field | pending | |
| Sai owner/user khác truy cập record | pending | |
| Quota/cost/rate limit | pending | |
| Provider timeout/unavailable/fallback | pending | |
| Serverless timeout/cold start | pending | |
| Không log secret/token/full prompt/ảnh hoặc dữ liệu nhạy cảm | pending | |
| Rollback hoặc disable path rõ | pending | |
| Mobile/responsive hoặc layout chính không vỡ | pending | |

## Kết Luận

- Trạng thái: `done | done-with-risk | blocked | not-done`
- Lý do:
- Rủi ro còn lại:
- Việc tiếp theo:
- Report/evidence liên quan:

## Quy Tắc Không Được Claim Done

Không đổi trạng thái thành `done` nếu:

- Chỉ đọc code mà chưa chạy gate phù hợp.
- Feature production-facing nhưng chưa có smoke đúng phạm vi hoặc quyết định
  chấp nhận rủi ro rõ.
- Có thể ghi/chạm production data nhưng chưa được chủ dự án duyệt.
- Có lỗi test/lint/type/build/smoke chưa được giải thích và chấp nhận.
- Có khả năng leak owner data, secret, raw provider error hoặc chữ Hán ra UI.
