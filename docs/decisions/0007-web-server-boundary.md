# 0007 Web ↔ Server Boundary (apps/web chỉ import @ziweiai/contracts)

Date: 2026-06-14

## Status

Accepted

## Context

Trong monorepo mới, `apps/web` (SvelteKit, client bundle) sống cạnh
`packages/core` và `packages/astro-engine`. Hai package này là **server-only**:
chúng kéo `iztro` + `lunar-javascript` + ephemeris + hàng trăm literal chữ Hán,
và là engine tính lá số có giá trị nghiệp vụ.

Nếu `apps/web` vô tình `import` một trong hai (kể cả gián tiếp qua một util tưởng
là thuần), client bundle sẽ:

1. Phình to vì kéo theo iztro/lunar/ephemeris.
2. Vỡ **bất biến ngôn ngữ**: literal chữ Hán lọt vào bundle frontend.
3. Vỡ **bất biến bảo mật**: logic engine server rò ra client.

Đây là rủi ro #1 ghi trong `PROJECT_SUMMARY.md`.

## Decision

`apps/web` **chỉ** được import `@ziweiai/contracts` (pure TS + Zod) từ workspace
nội bộ. Cấm tuyệt đối import `@ziweiai/core`, `@ziweiai/astro-engine`, `iztro`,
`lunar-javascript`.

Thực thi bằng nhiều lớp:

- **Dependency**: `apps/web/package.json` không khai báo các package đó.
- **Lint**: ESLint `no-restricted-imports` trong `apps/web` fail khi gặp import bị cấm.
- **Env**: chỉ `PUBLIC_*` (`PUBLIC_API_BASE_URL`, `PUBLIC_SUPABASE_URL`,
  `PUBLIC_SUPABASE_ANON_KEY`) lộ ra client; secret server-only chỉ sống ở `apps/api`.
- **Test (phase sau)**: quét `\p{Script=Han}` trên `apps/web/build/` để chặn rò chữ Hán.

Nếu web cần một hằng/regex nhỏ từ core (vd `CJK_TEXT_PATTERN`), **copy giá trị**
vào `apps/web/src/lib/text/cjk.ts`, KHÔNG import core.

## Alternatives Considered

1. Tin vào kỷ luật review thủ công. Bác: rò gián tiếp khó thấy bằng mắt, lint rẻ hơn.
2. Tách core/astro-engine ra repo riêng. Bác: phá mục tiêu monorepo + tái lập drift.
3. Cho web import contracts subset bằng deep import. Bác: contracts đã là biên giới đúng.

## Consequences

Positive:

- Boundary được máy kiểm (lint + sau này test CJK), không phụ thuộc trí nhớ agent.
- Client bundle gọn, không chữ Hán, không secret.

Tradeoffs:

- Cần lặp lại rule `no-restricted-imports` ở `apps/web` (đã có nền eslint base Phase 1).
- Một vài hằng nhỏ phải copy thay vì import (chấp nhận được, có chú thích nguồn).

## Follow-Up

- US-001: áp guard ESLint trong `apps/web`.
- Phase 4: thêm `lib/text/cjk.ts` + test quét `\p{Script=Han}` trên `build/`.
