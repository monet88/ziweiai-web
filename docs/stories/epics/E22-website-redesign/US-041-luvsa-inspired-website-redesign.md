# US-041 Luvsa-inspired full website redesign foundation

## Status

in_progress

## Lane

normal

## Product Contract

The web app should move from the current plain dashboard treatment toward a restrained
black-and-white astrology product experience inspired by Luvsa, while preserving the real
ziweiai workflow: create a chart, choose a supported system, view saved history, and continue
into chart detail or AI explanation.

This story is the foundation slice for the full website redesign. It does not change backend
contracts, auth semantics, chart generation, quota, or paid gating.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/invariants.md`
- `apps/web/AGENTS.md`
- `DESIGN.md`
- `docs/decisions/0031-luvsa-inspired-web-redesign-direction.md`

## Acceptance Criteria

- Dashboard first viewport presents the actual product workflow, not a marketing-only landing page.
- Chart detail remains the real reading workflow: palace board, fortune layers, AI explanation, and
  assistant stay reachable without route or API changes.
- History remains a real saved-workflow screen: saved charts, divination questions, vision entries,
  and vision delete confirmation stay intact.
- Shared app-shell routes that use `AppScaffold` inherit the redesign direction without changing
  their domain logic or route contracts.
- The standalone sign-in route follows the same visual direction without changing auth flow,
  anonymous-session cache clearing, or redirects.
- Visual direction uses a calm monochrome product language with one structural action color from existing tokens.
- Dashboard keeps anonymous/session controls, chart creation, extended system navigation, and recent history.
- UI copy remains Vietnamese and contains no Han characters.
- Implementation notes are updated as work proceeds.

## Design Notes

- Reference: `https://luvsa.app/` for restrained black-and-white astrology positioning, app feature blocks, and birth-chart focus.
- Preserve routes and data flow: no new routes, no API changes, no new dependencies.
- Use existing Svelte 5 runes, scoped CSS, shared `BirthForm`, `DashboardSidebar`, `ExtendedSystemNav`, `PrimaryButton`, and `viCopy`.
- Avoid global token replacement in this foundation slice; local dashboard composition can prove the direction before migrating every route.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli.exe story update --id US-041 --unit 0 --integration 0 --e2e 0 --platform 1`.

| Layer | Expected proof |
| --- | --- |
| Unit | n/a for this foundation slice unless pure helpers are added |
| Integration | n/a, no API contract or backend flow changes |
| E2E | deferred until the redesigned full flow stabilizes |
| Platform | `pnpm -F @ziweiai/web check && pnpm -F @ziweiai/web build` |
| Release | browser smoke screenshot of `/` after dev server is running |

## Harness Delta

- Intake `#88` recorded as a normal new initiative.
- Durable story `US-041` added with verify command.
- Implementation notes live in `docs/stories/epics/E22-website-redesign/implementation-notes.md`.
- Decision `0031-luvsa-inspired-web-redesign-direction` captures the durable visual direction.

## Evidence

- `pnpm -F @ziweiai/web check` -> `svelte-check found 0 errors and 0 warnings`.
- `pnpm -F @ziweiai/web build` -> Vite/SvelteKit static build completed and wrote `build/`.
- `scripts/bin/harness-cli.exe story verify US-041` -> pass.
- Svelte MCP autofixer for `src/routes/(app)/+page.svelte` -> no issues or suggestions.
- Chart detail visual slice in `apps/web/src/lib/features/chart/ChartDetailScreen.svelte` adds a
  descriptive document title and quieter section rhythm while preserving existing chart/detail,
  fortune, explanation, premium gate, and assistant model calls.
- `pnpm -F @ziweiai/web check` after chart detail slice -> `svelte-check found 0 errors and 0 warnings`.
- `pnpm -F @ziweiai/web build` after chart detail slice -> Vite/SvelteKit static build completed and wrote `build/`.
- `scripts/bin/harness-cli.exe story verify US-041` after chart detail slice -> pass.
- Svelte MCP autofixer for `ChartDetailScreen.svelte` -> no issues; one existing `$effect`
  suggestion left unchanged because the horoscope model already guards the default selection.
- History visual slice in `apps/web/src/routes/(app)/history/+page.svelte` and
  `apps/web/src/lib/features/history/HistoryList.svelte` adds a document title and calmer
  divider-based list rhythm while preserving history query, chart links, vision signed-image
  handling, and delete confirmation flow.
- Svelte MCP autofixer for history route and `HistoryList.svelte` -> no issues or suggestions.
- `pnpm -F @ziweiai/web check` after history slice -> `svelte-check found 0 errors and 0 warnings`.
- `pnpm -F @ziweiai/web build` after history slice -> Vite/SvelteKit static build completed and wrote `build/`.
- `scripts/bin/harness-cli.exe story verify US-041` after history slice -> pass.
- Shared app-shell slice in `apps/web/src/lib/components/ui/AppScaffold.svelte` expands the visual
  direction to secondary feature routes that already use the shared scaffold, while preserving their
  existing child components and behavior.
- Svelte MCP autofixer for `AppScaffold.svelte` -> no issues or suggestions.
- Standalone sign-in visual slice in `apps/web/src/routes/sign-in/+page.svelte` adds the redesigned
  auth shell, route-specific document title, responsive mobile layout, and form focus states while
  preserving existing auth store/query cache/redirect behavior.
- Svelte MCP autofixer for sign-in route -> no issues or suggestions.
- `pnpm -F @ziweiai/web check` after shared shell + sign-in slices -> `svelte-check found 0 errors and 0 warnings`.
- `pnpm -F @ziweiai/web build` after shared shell + sign-in slices -> Vite/SvelteKit static build completed and wrote `build/`.
- `pnpm -F @ziweiai/web e2e` after shared shell + sign-in slices -> 46/46 default specs passed (`--grep-invert @live`).
- Screenshot evidence refreshed under `apps/web/test-results/feature-tour/`, including `09-sign-in.png`
  and `10-sign-in-mobile.png`; both were captured from `vite preview` with no Playwright console
  warnings or errors.
- Browser smoke at `http://localhost:5173/` -> HTTP 200, title `Một không gian xem lá số tinh gọn - ziweiai`, H1 visible, `#create-chart` visible, `#systems` visible. Screenshot: `%TEMP%/ziweiai-dashboard-redesign.png`.
- Browser console had `ERR_CONNECTION_REFUSED` resource errors because the web dev server was running without the API/backend service for history/auth network calls; visual shell still rendered.
