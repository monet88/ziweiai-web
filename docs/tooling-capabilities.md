# Năng Lực Công Cụ Cho Tử Vi Toàn Tập

## Mục Đích

Tài liệu này ghi lại các công cụ/skill/plugin có thể dùng cho repo
`ziweiai-web` sau khi đã kiểm tra bằng `tool_search` và đọc skill liên quan.
Mục tiêu là chọn đúng công cụ cho từng việc phát triển web app, deploy, test và
debug, thay vì mặc định dùng sai kênh.

## Kết Luận Ngắn

- Deploy demo hiện tại dùng **Vercel CLI + script repo**, không có Vercel plugin
callable riêng trong phiên này.
- **Build Web Apps** hữu ích nhất cho frontend testing/debugging hoặc redesign,
nhưng vẫn phải tôn trọng SvelteKit, Playwright và contract của repo.
- **Sites** là hosting plugin thay thế, chỉ dùng khi repo có
`.openai/hosting.json` hoặc khi đã có quyết định chuyển khỏi Vercel.
- **Browser/Chrome/node_repl** dùng cho kiểm chứng UI thật, console, screenshot
và interaction; không thay thế unit/API tests.
- **Figma** dùng khi cần đưa UI vào Figma hoặc thiết kế lại có file Figma.

Tool discovery được kiểm tra lại ngày 2026-07-13: phiên hiện tại expose Sites
connector, Figma connector, GitHub connector, Codex thread tools và multi-agent
tools, nhưng vẫn không expose Vercel connector riêng. Build Web Apps hiện là
nhóm skill/hướng dẫn trong môi trường này, không phải connector deploy riêng.
Repo có `vercel.json` và không có `.openai/hosting.json`, nên Vercel CLI vẫn là
đường triển khai demo đúng cho `tuvitoantap.vercel.app`.

## Capability Map

| Nhu cầu | Công cụ chính | Khi dùng | Không dùng khi |
| --- | --- | --- | --- |
| Deploy demo public | `pnpm deploy:vercel-demo`, Vercel CLI | Cần release `https://tuvitoantap.vercel.app` | Chưa được xác nhận deploy hoặc token/account chưa đúng. |
| Safe production smoke | `pnpm smoke:vercel-demo` | Sau deploy, cần kiểm tra alias/API public/fallback không ghi dữ liệu | Cần chứng minh provider AI thật hoặc ghi Supabase. |
| Live mutation smoke | `pnpm smoke:vercel-live-mutation` | Đã được xác nhận ghi Supabase production và gọi AI provider thật | Chưa có approval; thiếu cleanup/service-role path nếu cần dọn dữ liệu. |
| Local web E2E | Playwright repo | Sửa web flow hoặc core UI | Chỉ nhìn code rồi kết luận pass. |
| Frontend rendered debug | Build Web Apps `frontend-testing-debugging` skill + Browser/Playwright | Debug console, responsive, interaction, layout | Bug nằm ở API/database thuần. |
| Redesign/polish lớn | Build Web Apps `frontend-app-builder` skill | Có yêu cầu redesign hoặc concept UI mới | Sửa bug nhỏ trong design system hiện có. |
| Sites hosting | Sites connector/plugin | Có `.openai/hosting.json` hoặc user quyết định đổi hosting | Repo vẫn ưu tiên Vercel demo. |
| Figma design sync | Figma connector/plugin | Có Figma file hoặc yêu cầu tạo/sync design | Chỉ cần deploy/test code. |
| Supabase migration sanity | `pnpm check:supabase-migrations` | Trước deploy hoặc khi đổi migration/RLS | Cloud ledger đã verify 2026-07-13 10:23 +07; cần rerun sau migration mới. |
| External regression | TestSprite | Cần bằng chứng smoke ngoài Playwright | TestSprite đang `queued`; queued không tính là pass. |

## Vercel

Tool discovery không trả về một Vercel connector/plugin callable riêng. Vì vậy
đường chuẩn là:

```bash
pnpm deploy:vercel-demo
pnpm smoke:vercel-demo
```

Nguyên tắc:

- Dùng `VERCEL_GALAXY`, không dùng `VERCEL_TOKEN` generic.
- Script deploy phải xác nhận account `galaxypro710-7060`.
- Sau deploy phải inspect alias và chạy smoke.
- Không ghi secret/env vào docs hoặc log.

## Build Web Apps

Trong phiên hiện tại, tool discovery không expose một MCP connector riêng tên
Build Web Apps. Các hướng dẫn Build Web Apps nằm ở skill
`build-web-apps:frontend-testing-debugging` và
`build-web-apps:frontend-app-builder`. Vì vậy khi cần kiểm chứng frontend, dùng
skill để định hướng cách test/debug; bằng chứng vận hành vẫn phải đến từ
Playwright, Browser/Chrome nếu cần, và các gate repo.

### `frontend-testing-debugging`

Dùng khi cần test/debug frontend đã render:

- app load đúng route;
- không blank page;
- không framework error overlay;
- không console error/warn liên quan;
- screenshot chứng minh UI;
- interaction thật có state change.

Trong repo này, nếu Browser plugin không khả dụng hoặc không phù hợp, fallback
đúng là Playwright theo cấu hình sẵn của `apps/web`.

Điểm áp dụng cụ thể cho repo này:

- định nghĩa target flow trước khi QA;
- dùng Browser/IAB khi khả dụng để kiểm tra URL, title, DOM, console và
  screenshot;
- nếu fallback Playwright, ghi rõ lý do;
- build/check không đủ để claim UI đã hoạt động nếu lỗi nằm ở rendered flow.

### `frontend-app-builder`

Dùng cho redesign, dashboard mới hoặc UI concept lớn. Skill này yêu cầu thiết kế
concept trước rồi implement đúng fidelity. Với repo hiện tại, chỉ dùng khi có
scope redesign rõ vì sản phẩm đang ưu tiên core flow và reliability hơn polish.

Không dùng skill này cho bugfix nhỏ hoặc deploy; nó phù hợp khi cần concept UI,
thiết kế hệ thống giao diện, so sánh screenshot và fidelity review.

## Sites

Sites connector có callable tools cho site/version/deploy/domain, nhưng repo này
không có `.openai/hosting.json`. Do đó:

- không gọi `create_site` cho repo này nếu chưa có quyết định đổi hosting;
- không deploy Sites thay Vercel chỉ để “có demo”;
- nếu sau này chuyển sang Sites, phải tạo strategy riêng, push đúng source state,
lưu version, rồi deploy production theo quy trình Sites.

## Browser / Chrome / Node REPL

Dùng cho các việc có UI/live evidence:

- mở domain hoặc local preview;
- đọc URL/title/DOM/screenshot;
- kiểm tra console;
- chạy interaction như click, submit, refresh;
- xác minh mobile/desktop layout.

Không dùng Browser làm bằng chứng duy nhất cho API contract, RLS, quota hoặc
provider fallback; các phần đó vẫn cần unit/integration/API smoke.

## Figma

Figma plugin hữu ích khi:

- user có file Figma và muốn sync/capture UI;
- cần tạo thiết kế, design system hoặc mockup;
- cần review visual polish trong Figma.

Không dùng Figma cho deploy hoặc smoke production.

## Quy Tắc Chọn Công Cụ

1. Nếu mục tiêu là demo public `tuvitoantap.vercel.app`, dùng Vercel CLI/script.
2. Nếu mục tiêu là kiểm chứng UI render, dùng Browser/Build Web Apps/Playwright.
3. Nếu mục tiêu là database/auth/ownership, dùng API tests + Supabase migration
checks.
4. Nếu mục tiêu là production AI flow, dùng guarded live mutation smoke sau khi
được xác nhận.
5. Nếu mục tiêu là redesign lớn, dùng Build Web Apps `frontend-app-builder` và
không trộn với deploy production trong cùng một bước rủi ro.

## Gaps Còn Lại

- Không có Vercel plugin callable riêng trong phiên này; dùng CLI là nguồn sự
thật vận hành.
- Sites chưa phù hợp cho repo này vì chưa có `.openai/hosting.json`.
- Live mutation smoke script đã có nhưng chưa chạy thật sau khi thêm guard vì
bước đó ghi Supabase production và gọi AI provider thật.
