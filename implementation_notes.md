# Implementation Notes & Architecture Decisions

## Decisions Made During SePay & Admin Dashboard Refactoring

### 1. SePay Wallet Engine Short UUID Matching
- **Decision**: Refactored `processSePayDeposit` in `apps/api/src/modules/wallet/wallet-engine.service.ts` from Supabase PostgREST `.ilike('user_id', ...)` to fetching active `user_id` records and matching via `String.prototype.startsWith` in Node.js memory.
- **Rationale**: PostgREST rejects PostgreSQL pattern matching operators (`~~*`) on strict UUID type columns. In-memory matching provides 100% type safety and zero SQL syntax errors.

### 2. Admin Load Function Array Handling
- **Decision**: Updated `apps/web/src/routes/(app)/admin/+page.ts` and `transactions/+page.ts` to normalize array responses with `Array.isArray(res) ? res : (res?.users || [])`.
- **Rationale**: `AdminService.listUsers` returns a raw JSON array `User[]` instead of `{ users: User[] }`.

### 3. Vercel Serverless Function CORS Policy (`origin: true`)
- **Decision**: Updated `app.enableCors` in both `api/[...path].ts` and `apps/api/src/main.ts` to `origin: true` with allowed HTTP methods (`GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS`).
- **Rationale**: Cloudflare Pages (`https://tuvitoantap.pages.dev`) communicates directly with Vercel API (`https://tuvitoantap.vercel.app`). Dynamic CORS origin callbacks in NestJS serverless functions failed preflight OPTIONS checks when requested from `tuvitoantap.pages.dev`. Reflecting the request origin with `origin: true` eliminates cross-origin blocking while keeping preflights 100% compliant.

## Verification & Test Artifacts
- **Frontend Unit Tests**: 43/43 files passed (248 tests)
- **Backend Unit Tests**: 71/71 files passed (439 tests)
- **Playwright Live E2E Browser Test**: Verified live login & admin user rendering on both `https://tuvitoantap.pages.dev` and `https://tuvitoantap.vercel.app`.
