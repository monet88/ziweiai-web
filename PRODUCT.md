# Product

## Register

product

## Users

People interested in Vietnamese astrology (Tu Vi / Zi Wei Dou Shu) and related
divination systems (BaZi, Mai Hoa, Liu Yao, Da Liu Ren, Qi Men, plus Tarot, MBTI,
palm and face reading). They sign in with Supabase, generate a chart from their
birth details, save it, and return to read it carefully over time.

Their context is personal and contemplative: a single reader studying one chart
on their own device, reading palace by palace and aspect by aspect, often
re-opening a saved chart to reflect rather than to finish a quick transaction. The
primary job on any screen is reading and understanding the chart and its AI
explanation, not data entry or dashboard scanning.

## Product Purpose

A signed-in web client (SvelteKit SPA) that lets a user create and view astrology
charts and read AI explanations organized by palace and aspect. The Tu Vi
12-palace board also reflects a time slice of "today" across four horoscope layers
(decadal / yearly / monthly / daily), computed server-side; the web only renders.

All chart calculation lives in the backend engine. The web never runs calculation
logic: it calls the API, validates responses against shared contracts, and
displays. Success looks like a reader who can open a saved chart and absorb its
meaning calmly, with the interface staying out of the way of the content.

## Brand Personality

Three words: calm, clear, trustworthy.

The interface should feel like reading a well-set document or a printed book in
good daylight (paper-calm), not like a flashy app or a mystical ritual. The voice
is quiet and confident: it presents the chart and the reading plainly and lets the
content carry the depth. Personality and any moments of color come from small,
deliberate decorative touches, never from loud structural color. The product is in
Vietnamese throughout and contains no Han characters anywhere in the UI.

## Anti-references

- Cheap, flashy fortune-telling or spiritual apps: garish gradients, glitter, and
  loud saturated color used as structure.
- The "dark and mystical" cliche: dark-plus-gold occult chrome, neon glow, and
  talisman/amulet ornamentation. The current legacy dark+gold theme in
  apps/web/src/lib/theme/tokens.css is an anti-reference, not the target.
- Heavy drop-shadows and dramatic elevation. Depth should come from hairlines and
  barely-there layered shadow.
- Bright accent colors used as structural fills or CTAs. Vivid colors belong only
  in small decorative accents, never in the chrome.
- Western pastel astrology styling, or any look that reads as decorative rather
  than as a calm reading surface.

## Design Principles

1. Content over chrome. The chart and its reading are the product; the UI recedes
   so the reader can concentrate. No decoration competes with the content.
2. Paper-calm by default. Light, document-like surfaces and generous whitespace;
   grouping by space and hairlines, not by boxes and heavy shadows.
3. One quiet accent. A single structural accent for actions, links, and focus; any
   other color is decorative only and never structural.
4. Readability is non-negotiable. Strict typographic discipline (tight negative
   tracking on headings, comfortable line-height on body) and verified contrast so
   long readings stay easy on the eyes.
5. Vietnamese, fully and correctly. Every label is Vietnamese with zero Han
   fallback, so a Vietnamese screen reader reads the product 100% correctly.

## Accessibility & Inclusion

- Target WCAG 2.x AA: body text >= 4.5:1, large text >= 3:1, placeholder text held
  to the same body ratio. Verify contrast on the actual reading surfaces.
- Visible, clear focus rings for full keyboard navigation; focus is never
  suppressed for aesthetics.
- Respect prefers-reduced-motion: every animation has a reduced or instant
  alternative.
- Language correctness as accessibility: the UI must contain no Han /
  Sino-Vietnamese fallback characters (an automated \p{Script=Han} scan over the
  build guards this), so a Vietnamese screen reader pronounces every label
  correctly.
- Typographic legibility as accessibility: negative heading tracking kept above
  the cramped floor, and body line-height tuned for long-form reading.
