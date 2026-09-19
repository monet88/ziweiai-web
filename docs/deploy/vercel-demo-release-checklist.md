# Vercel Demo Release Checklist

Ngày tạo: 2026-07-12  
Demo domain: `https://tuvitoantap.vercel.app`  
Account/team: `galaxypro710-7060` / `galaxypro710-7060s-projects`

## Mục Đích

Checklist này là đường release chuẩn cho demo public Vercel. Mục tiêu là tránh
deploy nhầm account, tránh mất SPA fallback `/charts/<uuid>`, và có bằng chứng
smoke test tối thiểu sau mỗi lần release.

## Pre-Check

1. Repo không có thay đổi ngoài ý muốn:

```bash
git status --short
```

2. Token đúng account đã set trong `~/.zshrc`:

```bash
source ~/.zshrc >/dev/null 2>&1
npx --yes vercel@latest whoami --token "$VERCEL_GALAXY"
```

Kết quả phải là:

```text
galaxypro710-7060
```

Không dùng `VERCEL_TOKEN` cho demo này vì biến đó có thể thuộc account khác.

3. Kiểm tra domain hiện tại:

```bash
npx --yes vercel@latest inspect https://tuvitoantap.vercel.app --token "$VERCEL_GALAXY"
```

## Build / Deploy

Deploy bằng script chuẩn:

```bash
pnpm deploy:vercel-demo
```

Script sẽ:

- source `~/.zshrc`;
- kiểm tra `VERCEL_GALAXY`;
- unset `VERCEL_TOKEN`;
- xác nhận account là `galaxypro710-7060`;
- deploy production;
- alias `tuvitoantap.vercel.app` sang deployment mới;
- inspect lại domain.

## Smoke Test Bắt Buộc

Chạy smoke tự động trước:

```bash
pnpm smoke:vercel-demo
```

Script này sẽ:

- source `~/.zshrc`;
- kiểm tra `VERCEL_GALAXY`;
- unset `VERCEL_TOKEN`;
- xác nhận account là `galaxypro710-7060`;
- inspect alias `https://tuvitoantap.vercel.app`;
- kiểm tra root page, `/api/health`, `/api/features`;
- kiểm tra SPA fallback cho `/charts/<uuid>` trả `index.html`.

Script không tạo dữ liệu Supabase và không gọi AI provider.

## Live Mutation Smoke Có Kiểm Soát

Chỉ chạy bước này khi đã được xác nhận vì nó tạo anonymous Supabase user, tạo
bản ghi Lục Hào và gọi AI provider thật:

```bash
LIVE_MUTATION_SMOKE=1 LIVE_MUTATION_SMOKE_CONFIRM=tuvitoantap.vercel.app pnpm smoke:vercel-live-mutation
```

Nếu môi trường có `SUPABASE_SERVICE_ROLE_KEY` và muốn xoá anonymous user sau
smoke:

```bash
LIVE_MUTATION_SMOKE_CLEANUP=1 LIVE_MUTATION_SMOKE=1 LIVE_MUTATION_SMOKE_CONFIRM=tuvitoantap.vercel.app pnpm smoke:vercel-live-mutation
```

Mặc định `pnpm smoke:vercel-live-mutation` chỉ in hướng dẫn và không ghi dữ liệu.
Sau khi chạy thật, lưu report ngắn vào `docs/reports/` với chart id, provider,
HTTP status và trạng thái cleanup.

## Observability Sau Deploy

Sau smoke, theo dõi tối thiểu trong `docs/deploy/observability-minimum.md`:

- API 5xx trên `/api/*`, đặc biệt `502`, `503`, `504`;
- `PROVIDER_TIMEOUT` và `PROVIDER_UNAVAILABLE`;
- `RATE_LIMITED` và `quota-store.unavailable`;
- `providerName`, `tokensIn`, `tokensOut` để ước lượng AI spend;
- Supabase migration drift nếu deploy có đổi schema/RLS.

Nếu có sự cố, lưu report ngắn vào `docs/reports/` và không ghi secret, full
prompt, ảnh người dùng hoặc dữ liệu cá nhân không cần thiết.

Smoke thủ công bổ sung khi cần:

1. SPA fallback cho route detail:

```bash
curl -I https://tuvitoantap.vercel.app/charts/0391944a-50dd-44ae-ba2b-3d784c8b757e
```

Kỳ vọng:

```text
HTTP/2 200
content-disposition: inline; filename="index.html"
```

2. API public:

```bash
curl -sS https://tuvitoantap.vercel.app/api/health
curl -sS https://tuvitoantap.vercel.app/api/features
```

3. Browser smoke:

- mở `https://tuvitoantap.vercel.app`;
- xác nhận vào được dashboard ẩn danh;
- lập một lá số Tử Vi;
- xác nhận URL chuyển sang `/charts/<uuid>`;
- refresh trang detail;
- không thấy `Không tải được chi tiết lá số`;
- DevTools không có `404` cho `/api/charts/<uuid>`.

## TestSprite

TestSprite project:

```text
7d0a9fac-140a-4076-8d40-c16a0db46f81
```

Plan local:

```text
.testsprite/plans/tuvitoantap-chart-detail.plan.json
```

Rerun khi cần:

```bash
source ~/.zshrc >/dev/null 2>&1
npx --yes @testsprite/testsprite-cli --output json test rerun dffe35d9-2ded-4d2b-be83-61881bdae468 --wait --timeout 900
```

Nếu TestSprite bị `queued` lâu, dùng browser smoke ở trên làm gate tạm thời và
ghi lại trong report.

## Rollback

Nếu deployment mới lỗi:

1. Inspect deployment trước đó trong Vercel dashboard hoặc CLI.
2. Alias lại domain:

```bash
npx --yes vercel@latest alias set <previous-deployment-url> tuvitoantap.vercel.app --token "$VERCEL_GALAXY"
```

3. Chạy lại smoke test bắt buộc.

## Rủi Ro Cần Theo Dõi

- Vercel serverless có cold start và timeout; các luồng AI dài cần đo thực tế.
- `PUBLIC_*` được bake lúc build, đổi env phải deploy lại.
- `VERCEL_TOKEN` khác account vẫn có thể tồn tại trong shell; script deploy đã
  `unset` biến này để giảm rủi ro.
