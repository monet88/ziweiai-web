# Security closeout — Supabase PAT leak via ziweiai-demo.zip (2026-07-24)

## Cause
Public GitHub commit packaged `.env*` inside `ziweiai-demo.zip`. Supabase scanners
found PAT `sbp_f618…` (token name `nh`) and revoked it.

## Actions completed (galaxypro710-stack only — not monet88)
1. Repo set to **private**.
2. Merged PR hardening `.gitignore` and removing zip from the tree.
3. **History purge** of `ziweiai-demo.zip`, `apps/mobile/logcat.txt`,
   `apps/mobile/window_dump.xml` via `git filter-repo`, then force-pushed to
   `origin` = `galaxypro710-stack/ziweiai-web` only.
4. Removed `upstream` remote pointing at `monet88/ziweiai-web`.
5. Added `.githooks/pre-commit` + `pnpm prepare` → `scripts/install-git-hooks.sh`
   to block env/keys/zip/apk/aab/ipa/mp4 and secret-like staged content.
6. Scrubbed local backup env copies that still held the revoked PAT.

## Rollback
Offline bundle (local machine only, not in git):
`~/Documents/bydone/tuvinew/ziweiai-pre-secret-purge-2026-07-24.bundle`

## Remaining owner tasks
- Rotate `GITHUB_GALAXY` if it was ever printed in terminal logs.
- Confirm Supabase audit logs; rotate any other secrets that lived in the zip
  if they are still valid on the active project.
- GitHub may keep unreachable blobs until GC; private repo blocks anonymous
  access. If a raw CDN URL still serves briefly, wait or open a GitHub support
  ticket to purge cached blobs.
