# Luvsa-Inspired Web Redesign Direction

Date: 2026-06-29

## Status

Accepted

## Context

The requested redesign changes the web product from a plain Notion paper-calm dashboard
toward a full-site astrology product experience similar in feature framing to `https://luvsa.app/`.
The existing app is already a working SvelteKit SPA with anonymous access, chart creation,
extended divination routes, history, and AI explanations. A hard reset of routes, API contracts,
auth, or backend behavior would create avoidable risk.

## Decision

Adopt a restrained monochrome astrology product direction for the web redesign, starting with
the dashboard home and expanding route by route. The redesign should preserve the real ziweiai
workflow rather than become a marketing-only landing page:

- create a chart from birth data;
- choose supported systems and extended divination surfaces;
- reopen saved history;
- continue into chart detail, fortune layers, compatibility, and AI explanation.

Use Luvsa as visual and product-framing inspiration only. Do not copy Luvsa branding, content,
or proprietary behavior. Keep the existing Svelte 5 SPA architecture, `@ziweiai/contracts`
boundary, Supabase auth behavior, and backend API contracts unchanged unless a later story
explicitly changes them.

## Alternatives Considered

1. Replace the whole web app with a marketing landing page first.
2. Replace global tokens immediately across all routes.
3. Redesign one product slice first while documenting the durable direction.

## Consequences

Positive:

- The first viewport becomes a product workflow, not a static landing page.
- The redesign can proceed in validated slices without breaking existing chart and auth flows.
- Later agents have a durable decision to follow when extending the redesign.

Tradeoffs:

- Some routes will temporarily retain older paper-calm styling until their redesign slices land.
- `DESIGN.md` remains the legacy token source until a later story replaces or supersedes it.

## Follow-Up

- Extend the monochrome redesign to chart detail, history, divination routes, pricing, and sign-in.
- Refresh `DESIGN.md` when the route-by-route direction is broad enough to replace the legacy analysis.
- Add visual regression or Playwright coverage once the redesign stabilizes beyond the dashboard slice.
