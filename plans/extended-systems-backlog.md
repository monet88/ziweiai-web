# Backlog: Extended Systems - Deferred Items

Status: DRAFT for review (no code written yet). Companion docs:
`plans/open-extended-systems-tarot-spec.md`,
`plans/open-extended-systems-tarot-plan.md`.

These are intentionally out of scope for the current round (which is:
open all 6 flags + Tarot frontend + Tarot LLM reading). Each item below
is a candidate future story. All carry the same hard invariant: 0 Han
characters, Vietnamese-only UI. Reference repos live read-only in
`.ref/`; we port data / algorithms / prompts only (translated), never
UI components (different stacks: React / Vue / Python).

## B1 - Bazi/Ziwei LLM prompt upgrade (HIGH value)

Today the bazi/ziwei explanations and the mangpai reading lean on
template/deterministic narrative. Port the prompt frameworks from
`bazi-ziwei-skill/prompts/*` and `mingyu/src/services/prompts` +
`mingyu/src/lib/ziwei-prompts` (the "structured data -> human summary ->
LLM prompt" pattern) to raise reading quality.
- Source: `bazi-ziwei-skill`, `mingyu`.
- Effort: medium. Risk: low (prompt only; translate to VN).
- Note: keep using our iztro engine; do not swap engines.

## B2 - Bazi enrichment layer (MEDIUM value)

Port the bazi enrichment from `mingyu/src/utils/bazi/*`
(shen-sha / 神煞, tiao-hou / 調候 climate rules per stem, yong-shen /
用神, ge-ju / 格局, rule matcher) and/or `bazi-ziwei-skill/calculator/
bazi-enrich/*` to deepen Bazi + Mangpai output.
- Source: `mingyu`, `bazi-ziwei-skill`.
- Effort: medium. Risk: medium (overlaps iztro; must translate all
  labels and verify no double-calculation).

## B3 - Kanxiang prompt enhancement for Face/Palm (PROMOTED to current round)

DECIDED: pulled into the current round as phase P3B (low effort, high
value, prompt-only). See `plans/open-extended-systems-tarot-plan.md`.
Kept here for traceability only.
Translate `kanxiang/references/shouxiang.md` (palm) and `mianxiang.md`
(face) into Vietnamese and enrich the existing Face/Palm vision prompts
(`vision-prompts.ts`). No new pipeline; the multimodal LLM already reads
the raw image.
- Source: `kanxiang`.

## B4 - Palm-line drawing overlay (MEDIUM value, UX) [STAYS in backlog]

DECIDED: stays deferred. Reasons: MediaPipe WASM/JS canvas overlay is
medium effort / medium risk and grows the frontend bundle; the current
round's goal is Tarot + flag opening, so adding canvas drawing would
expand scope and slow P1-P10. The LLM already sees the raw image, so the
overlay is decorative UX, not core value, and does not block the flow.

Draw approximate heart/head/life lines on the uploaded palm for a more
convincing UX. Recommended approach: MediaPipe Hand Landmarker
(JS/WASM) client-side -> 21 landmarks -> canvas overlay. Do NOT port the
`palmistry` PyTorch pipeline (54 MB model, Python, opencv) onto the
1.9 GB Lightsail box; the multimodal LLM already "reads" the palm, so
the heavy detector is largely redundant for the reading itself.
- Source: `palmistry` (reference only; use MediaPipe JS instead).
- Effort: medium. Risk: medium (landmark-based lines are approximate,
  not exact crease detection).

## B5 - Tarot spread expansion (LOW-MEDIUM value)

Add more spreads beyond three-card / celtic-cross: single, diamond,
moon, horseshoe (positions + weighting in
`tarot-skill/scripts/draw.py`; also in `mingyu` tarot tool). Requires
backend spread additions + matching positions in the UI.
- Source: `tarot-skill`, `mingyu`.
- Effort: small-medium. Risk: low.

## B6 - Net-new feature systems (FUTURE, separate phases)

Inspiration from the surveyed apps; each is a sizable product addition
and should be its own spec/story, likely aligned with the post-US-017
roadmap (US-018+):
- Dream interpretation (周公解梦): `chatgpt-tarot-divination`,
  `FateAtelier/src/data/dreamSymbols.ts`, `zhouwenwang`.
- Naming / auspicious naming: `FateAtelier` (strokeCount), `mingyu`,
  `chatgpt-tarot-divination`.
- Fortune sticks (求签): `FateAtelier/src/data/divinationSticks.ts`,
  `mingyu` ssgw.
- Lenormand cards: `mingyu` lenormand tool.
- Almanac / date selection (黄历择日): `FateAtelier`, `mingyu`.
- Life K-line chart (人生K线图, 100-year scored fortune curve):
  `zhouwenwang`.
- Multiple reader personas (9 "masters"): `zhouwenwang`.
- HTML poster export for shareable readings: `bazi-ziwei-skill/templates`.

## Constraints applying to all backlog items

- Vietnamese-only, 0 Han (guarded by the no-han scan test).
- Port data / algorithms / prompts, not UI (stack mismatch).
- Do not replace engines that already work (5 live systems via
  xuanshu-runtime; ziwei via iztro/astro-engine).
- No heavy ML runtime on the production box.
- Each becomes a harness story with its own intake/decision/trace.
