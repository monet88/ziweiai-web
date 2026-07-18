# AGENTS.md — Tử Vi Toàn Tập

## Phạm Vi

File này áp dụng cho toàn bộ repo. Các file `AGENTS.md` nằm gần thư mục làm
việc hơn luôn có quyền ưu tiên cao hơn, ví dụ:

- `apps/web/AGENTS.md` cho web SvelteKit.
- `apps/api/AGENTS.md` cho API NestJS.
- `packages/AGENTS.md` cho shared packages.
- `packages/astro-engine/AGENTS.md` cho engine server-only.

Trước khi thay đổi code, test, deploy hoặc tài liệu, phải đọc:

1. `spec.md`
2. `goal.md`
3. `README.md`
4. `docs/agents/commands.md`
5. `docs/agents/deploy.md` nếu có deploy hoặc production smoke
6. `AGENTS.md` gần nhất với file sẽ sửa

## Mục Tiêu Dự Án

Tử Vi Toàn Tập là web app tiếng Việt cho lập, lưu, xem lại và hỏi đáp AI về các
hệ thuật số/tử vi. App phải dùng được ngay qua anonymous Supabase session, đồng
thời hỗ trợ đăng nhập email/password để lưu lịch sử bền vững.

Demo chuẩn hiện tại:

- Domain: `https://tuvitoantap.vercel.app`
- Deploy: `pnpm deploy:vercel-demo`
- Token Vercel chuẩn: `VERCEL_GALAXY` từ `~/.zshrc`

## Ranh Giới Kiến Trúc

- `apps/web` chỉ chứa UI, auth client, API client và state phía browser.
- `apps/api` là nơi duy nhất gọi engine server-only, Supabase service logic và
  AI providers.
- `packages/contracts` là nguồn sự thật cho request/response schemas.
- `packages/astro-engine` là server-only, không được ship vào browser.
- Web không được import `@ziweiai/core`, `@ziweiai/astro-engine`, `iztro` hoặc
  `lunar-javascript`.
- Dữ liệu đi qua web/API boundary phải được parse bằng schema từ
  `@ziweiai/contracts`.

## Ngôn Ngữ Và UX

- UI user-facing dùng tiếng Việt.
- Không để raw Chinese/Han output lọt ra UI.
- Không hardcode copy dài trực tiếp trong component nếu repo đã có i18n/text
  helper phù hợp.
- Product workflow phải đi trước marketing copy: người dùng cần tạo chart/quẻ,
  xem detail, xem history và tạo luận giải nhanh.

## Workflow Làm Việc

Với thay đổi nhỏ, làm trực tiếp nhưng vẫn phải kiểm tra đúng phạm vi. Với thay
đổi ảnh hưởng core flow, API contract, auth, database, AI provider, deploy hoặc
3+ files, dùng workflow:

1. Scout: đọc code/docs liên quan và xác định invariant.
2. Plan: ghi ngắn phạm vi, rủi ro, file sẽ sửa và acceptance criteria.
3. Implement: sửa tối thiểu, đúng pattern hiện có.
4. Validate: chạy test/check hẹp trước, rồi mở rộng theo blast radius.
5. Harden: kiểm tra lỗi 5xx, bảo mật, edge cases, cost/quota, UX copy.
6. Document: cập nhật docs nếu behavior, setup, architecture, deploy hoặc
   maintainer decision thay đổi.

Không refactor ngoài phạm vi. Không thêm abstraction nếu chưa loại bỏ được phức
tạp thật.

## Checklist Hoàn Thành Mỗi Feature

Một feature chỉ được coi là xong khi trả lời được:

- Logic đúng chưa, có dùng dữ liệu thật từ snapshot/chart/quẻ không?
- Workflow người dùng có đi hết được từ entry đến kết quả không?
- API contract có đồng bộ giữa `contracts`, API và web không?
- Có chặn trường hợp `blocksExactReading=true` trước khi gọi AI không?
- Auth/ownership có tránh lộ dữ liệu user khác không?
- Có test hoặc smoke phù hợp với phần đã sửa không?
- UI có tiếng Việt rõ, không lộ raw technical/provider error không cần thiết?
- Có rủi ro cost/quota/provider timeout/serverless timeout không?
- Có cần cập nhật docs, report hoặc release checklist không?

## Validation Gates

Chạy gate hẹp nhất trước, sau đó mở rộng theo phạm vi thay đổi.

Web:

```bash
pnpm -F @ziweiai/web check
pnpm -F @ziweiai/web test
pnpm -F @ziweiai/web exec playwright test smoke.spec.ts --workers=1
```

API:

```bash
pnpm -F @ziweiai/api typecheck
pnpm -F @ziweiai/api test
pnpm -F @ziweiai/api build
```

Packages/contracts/engine:

```bash
pnpm -F @ziweiai/contracts build
pnpm -F @ziweiai/astro-engine test
pnpm -F @ziweiai/astro-engine build
```

Toàn repo khi thay đổi shared behavior hoặc trước deploy quan trọng:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm exec turbo run build --force
pnpm -F @ziweiai/web exec playwright test smoke.spec.ts --workers=1
```

Nếu môi trường không chạy được gate nào, phải nêu rõ lý do và rủi ro còn lại.
Không được báo xong chỉ dựa trên suy luận.

## Deploy Và Live Smoke

Deploy demo Vercel chỉ dùng đường chuẩn:

```bash
pnpm deploy:vercel-demo
```

Sau deploy, kiểm tra:

```bash
npx --yes vercel@latest inspect https://tuvitoantap.vercel.app --token "$VERCEL_GALAXY"
curl -sS https://tuvitoantap.vercel.app/api/health
curl -sS https://tuvitoantap.vercel.app/api/features
```

Smoke tối thiểu:

1. Mở demo public.
2. Tạo anonymous session.
3. Tạo chart/quẻ.
4. Vào `/charts/<uuid>`.
5. Refresh detail route.
6. Tạo AI explanation nếu snapshot không bị blocked.
7. Kiểm tra không có 404/5xx trong core flow.

Nếu smoke tạo dữ liệu test trên Supabase production, phải dọn dữ liệu khi có
script/service-role verification phù hợp.

## Công Cụ Nên Dùng

- Vercel CLI là kênh deploy demo hiện hành.
- Playwright là gate web/e2e chính; không bỏ qua vì config đã tự start API và
  web preview.
- TestSprite dùng cho regression/demo smoke khi cần bằng chứng ngoài Playwright.
- Sites plugin chỉ dùng nếu repo có `.openai/hosting.json` hoặc user quyết định
  chuyển sang Sites deployment. Repo hiện ưu tiên Vercel.
- Browser/Chrome automation chỉ dùng để kiểm chứng UI thật hoặc debug live flow.
- Figma/design plugin chỉ dùng khi có yêu cầu thiết kế hoặc file Figma cụ thể.

## Bảo Mật

Không commit hoặc in ra log:

- `.env`, `.env.local`, env thật
- Supabase service role key
- JWT secret
- AI provider key
- Vercel token
- Firebase/Google credentials
- private key/cert
- build output
- `.agent`, `.agents`, `.claude`, `.gemini`
- `apk`, `aab`, `ipa`, `mp4` và release media artifacts

Trước khi push/deploy, kiểm tra nhanh:

```bash
git status --short
git check-ignore .env .env.local .agents .claude .gemini || true
```

Không sửa production config, secrets, payment, auth hoặc user-data flow nếu
phạm vi yêu cầu không nói rõ.

## Ưu Tiên Sản Phẩm

Thứ tự ưu tiên:

1. Core flow demo ổn định: anonymous auth -> create -> detail -> AI explanation.
2. Data quality: AI chỉ chạy trên snapshot đủ tin cậy.
3. Security/ownership/quota.
4. Observability và release checklist.
5. Monetization: credit/XU/payment/premium report.
6. Mở rộng hệ thuật số hoặc UI polish.

Khi có mâu thuẫn giữa mở rộng tính năng và ổn định demo public, ưu tiên ổn
định demo public.
