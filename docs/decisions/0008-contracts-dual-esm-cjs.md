# 0008 @ziweiai/contracts dual-build ESM + CJS

Date: 2026-06-14

## Status

Accepted

## Context

`packages/contracts` ban đầu chỉ build CommonJS (`tsconfig.json` với
`module: "CommonJS"`); `dist/index.js` dùng `__exportStar(require(...))` qua chuỗi
`export *` lồng nhau (15 file src re-export lẫn nhau).

Khi `apps/web` (Vite/ESM) consume package này, dev mode vỡ:

```
SyntaxError: The requested module '.../packages/contracts/dist/index.js'
does not provide an export named 'healthResponseSchema'
```

Trang `/` trả `500 Internal Error` ở `pnpm -F @ziweiai/web dev`. Nguyên nhân: Vite dev
dùng cjs-module-lexer để trích named export từ module CJS, nhưng không lần được qua
chuỗi `export *` (re-export) nhiều tầng của CJS. Build production (Rollup) xử lý CJS
interop tốt hơn nên không vỡ — lỗi chỉ lộ ở dev runtime, qua được cả `tsc --noEmit`,
`build`, và parse trong sandbox Node (CJS `require`). Chỉ verify chạy app thật mới phát hiện.

Ràng buộc consumer:

- `apps/api` (NestJS) + `packages/astro-engine` đều CJS → cần giữ `require`.
- `apps/web` (Vite/ESM) → cần named `import` hoạt động ở cả dev và build.
- `contracts/src` dùng 35 relative import **extensionless** (`from './health'`) →
  chuyển ESM-only sẽ phải thêm đuôi `.js` cho cả 35 chỗ (rủi ro cao, dễ sót).

## Decision

Dual-build `@ziweiai/contracts`: giữ CJS ở `dist/`, thêm ESM ở `dist/esm/`, khai báo
conditional exports.

- `tsconfig.json` giữ nguyên CJS → `dist/*.js`.
- Thêm `tsconfig.esm.json` (`module: ESNext`, `moduleResolution: Bundler`,
  `declaration: false`, `outDir: dist/esm`) → `dist/esm/*.js`.
- `scripts/write-esm-pkg.cjs` sinh `dist/esm/package.json` = `{"type":"module"}` để
  Node/bundler hiểu `dist/esm/*.js` là ESM (extensionless import được Bundler resolution
  của Vite xử lý).
- `package.json` exports: `import` → `dist/esm/index.js`, `require` → `dist/index.js`,
  `types` chung `dist/index.d.ts`.
- Build script: `tsc -p tsconfig.json && tsc -p tsconfig.esm.json && node ./scripts/write-esm-pkg.cjs`.

Không sửa source (giữ 35 extensionless import nguyên trạng).

## Alternatives Considered

1. Chuyển contracts sang ESM-only. Bác: phải thêm `.js` cho 35 import + đổi api/astro-engine
   (CJS) sang ESM — blast radius lớn, chạm runtime backend đang xanh.
2. Đổi `apps/web` import qua deep path `dist/esm`. Bác: rò chi tiết build ra consumer,
   vỡ khi đổi layout dist.
3. Dùng tsup/unbuild để dual-build. Bác: thêm dependency build mới; hai lệnh `tsc` đã đủ,
   nhất quán với toolchain hiện có (cả workspace build bằng `tsc`).

## Consequences

Positive:

- `apps/web` dev + build đều resolve named export đúng (verify: trang `/` render health
  trên `pnpm -F @ziweiai/web dev`, port 5173).
- `apps/api` + `astro-engine` (CJS) không đổi, build + 81 test backend vẫn xanh.
- Không sửa source contracts → không rủi ro sót đuôi `.js`.

Tradeoffs:

- Build contracts chạy `tsc` hai lần (chậm hơn ~1s) + một bước script sinh sentinel.
- `dist/` có hai cây JS; phải nhớ ESM ở `dist/esm/`.

## Follow-Up

- Áp cùng pattern nếu package nội bộ khác (vd `@ziweiai/core`) cần consume từ ESM bundler.
- Cân nhắc test CI: smoke `pnpm -F @ziweiai/web dev` + curl `/` để chặn tái phát lỗi
  chỉ-lộ-ở-dev này (build prod che mất).
