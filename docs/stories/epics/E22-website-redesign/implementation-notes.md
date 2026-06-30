# E22 Website redesign implementation notes

## 2026-06-29

- Created branch `feat/website-redesign-luvsa`.
- Recorded harness intake `#88` and story `US-041`.
- Design read: product app redesign for astrology users, inspired by Luvsa's restrained black-and-white language, but preserving ziweiai's actual chart workflow instead of building a pure landing page.
- Initial slice scope: redesign the authenticated dashboard home, keep backend/API untouched, keep existing `BirthForm`, `DashboardSidebar`, `ExtendedSystemNav`, and auth/session behavior.
- Reference features mapped from Luvsa-style positioning into ziweiai surfaces:
  - daily/yearly clarity -> today/fortune and saved chart continuity;
  - natal chart insight -> Tử Vi 12-cung chart detail and AI explanation;
  - compatibility -> Hợp Hôn route;
  - calm monochrome design -> local dashboard composition using existing tokens.
- Implemented the first dashboard slice in `apps/web/src/routes/(app)/+page.svelte`: custom top nav, large monochrome hero, abstract chart preview, preserved birth form, system navigation, recent history, and feature promise blocks.
- Added Vietnamese copy keys under `viCopy.dashboard` instead of hardcoding visible route text.
- Validation:
  - `pnpm -F @ziweiai/web check` passed with 0 errors and 0 warnings.
  - `pnpm -F @ziweiai/web build` passed.
  - `scripts/bin/harness-cli.exe story verify US-041` passed.
  - Svelte MCP autofixer on `src/routes/(app)/+page.svelte` returned no issues.
  - Browser smoke against `http://localhost:5173/` returned HTTP 200 and produced `%TEMP%/ziweiai-dashboard-redesign.png`.
- Known smoke caveat: the local API/backend was not running, so browser console showed `ERR_CONNECTION_REFUSED` resource errors from network-backed history/auth requests. This does not block the visual shell slice but should be covered by a full-stack smoke later.
- Continued with the chart detail slice in `apps/web/src/lib/features/chart/ChartDetailScreen.svelte`.
  Scope stayed visual/document-only: added a page title, a route-local detail wrapper, quieter
  section dividers, stronger section hierarchy, and a surface-consistent AI result container.
  Existing chart detail model, horoscope model, explanation model, premium redirect, and assistant
  panel wiring are unchanged.
- Chart detail validation:
  - Svelte MCP autofixer on `ChartDetailScreen.svelte` returned no issues; it repeated the existing
    `$effect` caution around `horoscope.ensureDefault()`, left unchanged because the model owns its
    one-time default guard.
  - `pnpm -F @ziweiai/web check` passed with 0 errors and 0 warnings.
- Continued with the history slice:
  - `apps/web/src/routes/(app)/history/+page.svelte` now sets a route-specific document title.
  - `apps/web/src/lib/features/history/HistoryList.svelte` now uses a route-local wrapper and
    divider-based list rhythm for saved charts and vision entries.
  - Behavior preserved: `fetchHistory`, dedupe, `/charts/[id]` links, signed-image load handling,
    vision delete confirmation, and query invalidation are unchanged.
- History validation:
  - Svelte MCP autofixer on the history route and `HistoryList.svelte` returned no issues or suggestions.
  - `pnpm -F @ziweiai/web check` passed with 0 errors and 0 warnings.
- Continued with the shared app-shell slice:
  - `apps/web/src/lib/components/ui/AppScaffold.svelte` now carries the restrained document rhythm
    across secondary routes that already share this shell: supported chart-system forms, divination
    forms, MBTI, Hợp Hôn, vision, tarot/Lenormand/dream/stick/almanac, and pricing.
  - Scope stayed visual/layout-only: no route, API, model, auth, or form behavior changed.
  - The shell now uses a subtler white-to-paper canvas, stronger editorial title scale, a hairline
    header divider, wider desktop content columns, and mobile-safe `100dvh` sizing.
  - Svelte MCP autofixer on `AppScaffold.svelte` returned no issues or suggestions.
- Continued with the standalone sign-in slice:
  - `apps/web/src/routes/sign-in/+page.svelte` now uses the same restrained document rhythm as the
    redesigned app surfaces: editorial brand copy, a hairline-auth form, stronger focus states, and
    responsive one-column mobile layout.
  - Scope stayed visual/auth-shell-only: `getAuthStore`, `useQueryClient`, sign-in/sign-up submit,
    anonymous-session cache clearing, and redirects are unchanged.
  - Added route-specific `<title>` text for sign-in/sign-up mode.
  - Svelte MCP autofixer on the sign-in route returned no issues or suggestions.
- Full-stack validation after the app-shell + sign-in slices:
  - `pnpm -F @ziweiai/web check` passed with 0 errors and 0 warnings.
  - `pnpm -F @ziweiai/web build` passed.
  - `pnpm -F @ziweiai/web e2e` passed 46/46 default specs (`--grep-invert @live`).
  - Screenshot evidence refreshed in `apps/web/test-results/feature-tour/`, including
    `09-sign-in.png` and `10-sign-in-mobile.png`; both sign-in screenshots captured with no
    Playwright console warnings or errors.
