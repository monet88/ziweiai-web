# 0027 Tach mapper persistence thanh ham thuan; KHONG dung PGLite lam stand-in cho supabase-js

Date: 2026-06-27

## Status

Accepted

## Context

Backlog #38 de xuat "deepen" SupabasePersistenceGateway (~50 method) theo huong
testability / Ports & Adapters: dat mot seam de test service di qua adapter thay
vi mock `{} as Gateway`, va test rieng phan mapping cua gateway.

Khi grill (DEEPENING.md), dependency cua gateway duoc phan loai la
local-substitutable (loai 2). De xuat ban dau (B1) la dung PGLite lam stand-in
chay trong test suite.

Kiem chung tren code that: gateway goi `@supabase/supabase-js`, ma client nay
noi chuyen voi DB qua `@supabase/postgrest-js` — tuc PostgREST tren HTTP, KHONG
phai Postgres wire protocol. PGLite la Postgres nhung (WASM) noi SQL/wire, KHONG
noi PostgREST REST API. Vi vay PGLite KHONG cam thang vao supabase-js duoc; muon
dung phai dung mot lop PostgREST-shim truoc PGLite (nang, de vo, khong phai
devDependency thuan). Day dung la bay "mot adapter = seam gia dinh" ma DEEPENING.md
canh bao.

Mot nhan ra khi dao: thu that su dang test o gateway la phan MAPPING row<->record
(`toXxxRecord` + `schema.parse` + doi snake_case sang camelCase + normalize
timestamp + coerce provider_metadata + trim question). Phan do la ham THUAN theo
mot row (loai 1, in-process) — khong can DB hay stand-in gi ca. Phan can
substitution chi la khuc dung query `.from().eq().maybeSingle()`, va khuc do mong.

## Decision

1. Stage A (da lam): inject `SupabaseClient` qua DI token `SUPABASE_CLIENT`
   (database.module useFactory) thay vi `createClient` trong constructor gateway.
   Doi seam ra ranh gioi DI; test co the cap client thay the qua token.
2. B1' (da lam): tach 10 mapper `toXxxRecord` + `SupabaseRow` + `AnnualReportRecord`
   sang `database/persistence-mappers.ts` thanh ham thuan exported, test thang
   bang row fixtures (`persistence-mappers.test.ts`). Gateway import cac ham nay,
   chi con lo dung query.
3. KHONG dung PGLite lam stand-in cho supabase-js (ly do o Context). Neu sau nay
   can test I/O that cua gateway, dung integration test voi local Supabase
   (`pnpm env:local-supabase` + apps/api/supabase migrations), skip khi stack
   khong chay — KHONG phai unit.
4. KHONG dung port + in-memory fake ~50 method (B2): chi mot adapter gia dinh,
   ganh nang bao tri cao, de drift khoi adapter Supabase that. Chua du hai adapter
   that de bien thanh seam thuc.

## Consequences

- Phan behavior that cua gateway (mapping) gio co test truc tiep, in-process,
  khong phu thuoc DB. 11 test moi, deletion test qua ro.
- Gateway mong hon: chi dung query + uy mapper. Seam client da dat dung cho.
- Lan review kien truc sau KHONG de xuat lai PGLite-tren-supabase-js. Neu muon
  test I/O gateway, di huong integration, khong unit.
- Chia gateway theo aggregate (charts/explanations/conversations/vision) van la
  huong mo cho dieu huong, truc giao voi quyet dinh nay; chua lam.
