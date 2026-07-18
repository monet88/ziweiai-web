# Chỉ Mục Báo Cáo

## Mục Đích

Thư mục này lưu report theo mốc thời gian. Report là bằng chứng vận hành tại
thời điểm chạy, không phải cam kết trạng thái hiện tại nếu đã có deploy, env,
schema hoặc code thay đổi sau đó.

Khi cần kết luận trạng thái hiện tại, đọc theo thứ tự:

1. `docs/project-execution-dashboard.md`
2. `plans/260713-0838-complete-tuvitoantap-remaining-work/plan.md`
3. Report mới nhất trong thư mục này
4. Code/tests/smoke hiện tại

## Report Hiện Có

| Report | Vai trò | Trạng thái sử dụng |
| --- | --- | --- |
| `20260617-1504-us010-premium-ai-gating-review.md` | Review nhánh US-010 premium AI gating | Bằng chứng lịch sử. Dùng để hiểu quyết định gate AI; không dùng làm bằng chứng production hiện tại. |
| `20260710-tuvitoantap-vercel-testsprite-deploy.md` | Debug Vercel/TestSprite, deploy demo, phụ lục audit 2026-07-12/13 | Bằng chứng lịch sử còn hữu ích. Một số phần đã được thay bằng checklist/script/report mới hơn. |
| `20260713-vercel-safe-smoke.md` | Safe smoke Vercel không ghi dữ liệu | Smoke không ghi dữ liệu mới nhất. Không chứng minh live mutation flow hay provider thật. |
| `20260713-1019-pm-goal-status.md` | Báo cáo PM trạng thái goal hiện hành | Trạng thái PM mới nhất. Dùng để biết phần đã xong, blocker còn lại và câu hỏi cần chủ dự án chốt. |
| `20260713-1029-goal-continuation.md` | Báo cáo tiếp tục goal, tool discovery và đồng bộ docs điều hành | Cập nhật docs/tooling mới nhất, bao gồm phiếu chốt quyết định A/B. Không thay thế live mutation smoke production. |

## Quy Tắc Đọc Evidence

- `safe smoke` chỉ chứng minh domain, public API và SPA fallback.
- `live mutation smoke` mới chứng minh luồng tạo chart/quẻ, lưu Supabase và gọi
AI provider thật.
- Script live mutation hiện hành là `pnpm smoke:vercel-live-mutation`; mặc định
skip, chỉ chạy thật khi có `LIVE_MUTATION_SMOKE=1` và
`LIVE_MUTATION_SMOKE_CONFIRM=tuvitoantap.vercel.app`.
- TestSprite `queued` không tính là pass.
- Report cũ có thể chứa deployment id đúng tại thời điểm đó; sau deploy mới,
phải chạy lại inspect/smoke.
- Không đưa secret, full prompt, ảnh người dùng hoặc dữ liệu cá nhân vào report.

## Khoảng Trống Hiện Tại

- Chưa có report live mutation mới chứng minh `POST /api/explanations` hiện tại
vẫn pass với provider thật.
- Nếu cần chốt completion cho demo public, phải chạy hoặc chấp nhận một live
mutation smoke mới và lưu report riêng.
