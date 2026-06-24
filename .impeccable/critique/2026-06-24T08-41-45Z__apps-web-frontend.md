---
target: apps/web frontend
total_score: 25
p0_count: 0
p1_count: 2
timestamp: 2026-06-24T08-41-45Z
slug: apps-web-frontend
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Spinners over skeletons; loading is communicated but generic |
| 2 | Match System / Real World | 3 | Vietnamese throughout, domain-correct; solid |
| 3 | User Control and Freedom | 3 | Forms/modals have exits; no global undo (low stakes) |
| 4 | Consistency and Standards | 1 | Two design systems live at once; sign-in is a third orphan palette |
| 5 | Error Prevention | 3 | required + aria-invalid present |
| 6 | Recognition Rather Than Recall | 3 | Text-labeled nav, no icon-only traps |
| 7 | Flexibility and Efficiency | 2 | No keyboard accelerators; acceptable for a reading app |
| 8 | Aesthetic and Minimalist Design | 2 | Internally uncluttered but the surface is the declared anti-reference |
| 9 | Error Recovery | 3 | Plain Vietnamese errors, role="alert" |
| 10 | Help and Documentation | 2 | No contextual help; simple enough to mostly survive |
| **Total** | | **25/40** | **Acceptable — design-language conformance is the failure, not raw usability** |

## Anti-Patterns Verdict

The interface does not read as generic-AI slop in structure. It reads as a product caught mid-migration: a polished dark+gold theme that PRODUCT.md now names as the explicit anti-reference, plus a few screens on a third orphan palette. Measured against DESIGN.md (Notion paper-calm), the entire foundation is off-target.

Deterministic scan: 21 findings (17 advisory, 4 warning) — 16 color, 4 font, 1 radius. The color hits are literal hexes in .svelte files (#15120a gold-button text, #c0392b / #c0564a danger reds, sign-in #111827/#6b7280/#d1d5db/#b8860b). The 4 font warnings are Georgia serif in TarotScreen. The scan UNDERSTATES the gap: it skips CSS-only files, so the dark+gold token layer in tokens.css (the real anti-reference) never registered as a violation.

## Overall Impression

The build quality is genuinely good — token discipline, focus rings everywhere, reduced-motion guards, hairline elevation, Vietnamese-only with no Han. But it is built toward the wrong north star. DESIGN.md asks for a warm off-white document on Inter with one blue accent; the app ships near-black surfaces, gold/violet accents, and serif/glow flourishes on Tarot. The single biggest opportunity: re-point the token layer at DESIGN.md, and the majority of components inherit the fix for free because they already use var(--*).

## What's Working

1. Token-first discipline. Almost every component references var(--color-*/--space-*/--radius-*) instead of hardcoding. Re-skinning is a token-layer job, not a 40-file rewrite.
2. Accessibility hygiene. Consistent :focus-visible rings, prefers-reduced-motion alternatives, sr-only/visually-hidden helpers, aria-hidden on decorative SVG overlays.
3. Elevation restraint in the core app. Most surfaces lean on hairline borders, which is exactly Notion's model — only Tarot breaks it.

## Priority Issues

### [P1] Theme foundation is the declared anti-reference
tokens.css sets --color-bg-primary #0b0b0d, cream text, gold/violet accents. DESIGN.md wants canvas-soft #f6f5f4, near-black ink, one blue (#0075de). This is the dark-and-mystical cliche PRODUCT.md explicitly bans. Every screen inherits it.
Why it matters: the product's whole stated identity (paper-calm, content-over-chrome) is contradicted by the first pixel.
Fix: rebuild the token layer to the Notion palette (light canvas, white surfaces, blue structural accent, gold/violet demoted to decorative-only). Keep token names so consumers don't change.
Suggested command: $impeccable colorize

### [P1] Sign-in and the app-shell loader run a third orphan palette
sign-in/+page.svelte and (app)/+layout.svelte bypass tokens entirely: system-ui, #111827 button, #6b7280 text, #d1d5db borders, #b8860b gold eyebrow, rem-based spacing. They match neither the dark theme nor Notion.
Why it matters: the entry screen looks like a different product, then the app flips to dark gold on first navigation — a jarring identity break at the highest-traffic moment.
Fix: move both onto the token system; delete hardcoded hexes and rem spacing.
Suggested command: $impeccable polish

### [P2] Radius scale is systematically rounder than Notion; inputs aren't tight
Web tokens: md 14 / lg 18 / xl 24. DESIGN.md: md 8 / lg 12 / xl 16, inputs at xs 4. Inputs currently use radius-md (14px) where Notion mandates 4px, and 24px cards exceed the 12-16px ceiling.
Why it matters: over-rounding is a recognizable tell and softens the document-like precision the brand wants.
Fix: re-map the radius tokens to the DESIGN.md scale; add xs 4 and route inputs to it.
Suggested command: $impeccable polish

### [P2] No Inter loaded; system-ui fallback; display headings under-tracked
No @font-face / fontsource anywhere; headings fall back to system-ui. DESIGN.md is Inter with explicit negative tracking at display sizes (-2.125px at 64px). Most headings here carry 0 tracking; the 34px hero uses only -1px.
Why it matters: typography is the brand's primary expressive lever and the user named tracking discipline a hard requirement.
Fix: self-host Inter, set it as the body font, apply the DESIGN.md tracking table to heading roles.
Suggested command: $impeccable typeset

### [P2] Eyebrow-on-every-section + Tarot serif/glow = slop tells and mysticism
Uppercase tracked eyebrows recur on sign-in, dashboard, tarot, mbti, vision. TarotScreen uses Georgia serif (banned for product UI) plus radial-glow box-shadows (0 0 36px) and drop-shadow on hover — the neon-glow mysticism PRODUCT.md rejects.
Why it matters: both the eyebrow reflex and the glow/serif lean toward the cheap-spiritual look the brand is defined against.
Fix: drop the eyebrow cadence to a single deliberate placement; remove Georgia and glow, fold Tarot into the calm system with hairline + restrained shadow.
Suggested command: $impeccable quieter

### [P3] Spacing scale drifts from DESIGN.md
Web: lg 20, no xxs 4, no xl 28. DESIGN.md: lg 24, xxs 4, xl 28. Sign-in also uses raw rem (1rem/0.65rem) off-scale.
Why it matters: minor rhythm inconsistency; cheap to align while the token layer is open.
Fix: align the spacing tokens to DESIGN.md and remove the rem one-offs.
Suggested command: $impeccable layout

## Persona Red Flags

Sam (Accessibility-Dependent): Strong baseline — focus rings, reduced-motion, no Han for VN screen readers. Risk: contrast must be re-verified after the light re-theme; today's cream-on-dark ratios won't transfer, and the orphan #6b7280 muted text on white is borderline.

Jordan (First-Timer): sign-in is clean but the eyebrow "ZIWEIAI" over "Đăng nhập" assumes brand knowledge; then the surface jumps from light sign-in to dark app — a confusing identity shift at step one.

Riley (Stress-Tester): EmptyStateCard exists (good), but the dual-theme means a stray screen on the orphan palette will look broken next to the dark app; the migration seam is visible.

## Minor Observations

- Danger color is hardcoded three ways (#c0392b, #c0564a, --color-accent-danger). Consolidate to one token.
- ui-sandbox uses system-ui too; fine for a sandbox but it shouldn't seed copy-paste.
- Tarot 4px literal radius flagged by detector is a calc() offset, effectively a false positive, but it still bypasses the scale.

## Questions to Consider

- If the token layer is re-pointed at Notion, which screens still need hand-touching versus inheriting the fix for free?
- Does Tarot earn bespoke treatment, or should it read identically calm to the rest?
- Is gold retained at all as a decorative-only accent, or fully replaced by Notion's sticker palette?
