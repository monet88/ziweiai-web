# Plan: Open All Extended Systems + Tarot Frontend + Tarot LLM

Status: DRAFT for review (no code written yet). Companion docs:
`plans/open-extended-systems-tarot-spec.md`,
`plans/extended-systems-backlog.md`.

Reference repos surveyed (read-only, in `.ref/`): `tarot-skill`,
`chatgpt-tarot-divination`, `bazi-ziwei-skill`, `zhouwenwang`,
`FateAtelier`, `mingyu`, `palmistry`, `kanxiang`.

## Pre-conditions

- [ ] User reviews this plan + spec + backlog (this step).
- [ ] Confirm `EXTENDED_SYSTEM_*_ENABLED` are the exact env keys on the
      server (verified in `apps/api/src/config/env.ts`: HEPAN, MANGPAI,
      TAROT, MBTI, FACE, PALM).
- [ ] Confirm `GET /features` currently returns all false (verified
      2026-06-23: all false).
- [ ] Confirm an LLM provider can produce the Tarot narrative
      (text-only is fine; DeepSeek/Gemini/OpenAI-compat all OK since
      Tarot input is text, not an image).
- [ ] Confirm 78 tarot images present in `.ref/taibu/public/tarot_cards/`
      (verified: 78 files; `.ref` is gitignored so they must be copied
      into `apps/web/static/tarot/`).
- [ ] Record harness decision(s) on approval.
- [ ] One branch + one PR into `main` (per repo PR-per-change convention).

## Phase ordering rationale

Flags-first is tempting but Tarot would 404 in the nav with no UI, so we
build the Tarot UI + LLM locally first, validate, then deploy and flip
flags last. Engine code for the 5 live systems is untouched.

## Phases

### P1 - Tarot card assets

- Copy 78 images from `.ref/taibu/public/tarot_cards/` to
  `apps/web/static/tarot/`.
- Rename to match backend `TAROT_DECK` ids: majors `major_00.jpg` ...
  `major_21.jpg` (mapped by name, e.g. `thefool.jpeg` -> `major_00`),
  minors `{suit}_{rank}.jpg` (e.g. `aceofcups.jpeg` -> `cups_ace`,
  `kingofwands.jpeg` -> `wands_king`). One mapping table, 78 entries.
- Optionally recompress the few heavy files (themagician 473KB,
  thehermit 290KB) to keep the bundle lean. Not blocking.

### P2 - api-client.drawTarot

- Add `drawTarot(token, { question, spread, seed? })` calling
  `POST /draws/tarot`, parsing `tarotDrawSchema` from
  `@ziweiai/contracts`. Flat function style like
  `createVisionAnalysis`.

### P3 - Tarot LLM narrative (backend)

- New `apps/api/src/modules/draws-tarot/tarot-prompts.ts`: a Vietnamese
  prompt builder that takes (question, spread, drawn cards w/ reversed)
  and produces a system+user prompt. Content distilled (not copied,
  translated to Vietnamese, 0 Han) from `tarot-skill/references/*`:
  card meanings (suit/element/number/court), card relations
  (cause/dialogue/progression/turn), classic combinations,
  anti-Barnum (concrete time/action), agency-first ending, safety
  boundary (no medical/legal/financial; self-harm -> pause + hotline).
- Wire `draws-tarot.service.drawTarot` to call the existing AI provider
  chain (reuse `AiProvidersModule`) for `narrative`, replacing the
  deterministic placeholder. Keep the deterministic draw (seed + cards)
  unchanged. Keep gate order: FEATURE_DISABLED 403 ->
  assertCanUseAiExplanation 402 -> quota 429. Free-for-all flag still
  bypasses the AI gate during beta.
- Unit test: prompt builder deterministic + Han-free; LLM mocked.

### P4 - Tarot frontend (web)

- `features/tarot/tarot-model.svelte.ts`: runes model; state for
  question, spread (default three-card), seed; `createMutation` calling
  `drawTarot`; token read fresh in `mutationFn`.
- `features/tarot/TarotScreen.svelte`: `AppScaffold`; question textarea;
  segmented control for spread (three-card / celtic-cross); submit;
  result = card grid (image per card, rotate 180deg if reversed,
  position + Vietnamese name caption) + `MarkdownView` for narrative;
  retake button.
- `routes/(app)/tarot/+page.svelte`: thin wrapper.
- `tarot-copy-cjk.test.ts`: assert Han-free copy + card labels.
- `chart-system-registry.ts`: keep tarot render mode = `unsupported`
  (DECIDED). Tarot has a distinct UX flow (question -> spread -> draw ->
  flip -> read) fully handled by its own `/tarot` route + `TarotScreen`;
  do not force it into the shared chart-detail layout (built for chart
  systems like ziwei/bazi). `unsupported` keeps the separation clean and
  safe.

### P3B - Kanxiang prompt enrichment for Face/Palm (backend)

- Enrich the EXISTING vision prompts (`vision-prompts.ts` already ported
  the core from taibu) with domain knowledge translated to Vietnamese
  from `kanxiang/references/shouxiang.md` (palm) and `mianxiang.md`
  (face): three-court / five-features detail for face; principal lines /
  finger shapes / palm mounts for palm.
- Prompt-only change: extend `FACE_PERSONA/FACE_STRUCTURE` and
  `PALM_PERSONA/PALM_STRUCTURE`. No frontend change, no new library, no
  new endpoint. Keep 0 Han (provider CJK guard + EXPLANATION system
  prompt already enforce Vietnamese).
- Rationale: low effort, high value. Face/Palm are about to go public
  (flags flipped in P9); richer domain rules make the reading feel like
  an expert immediately. The multimodal LLM already sees the raw image,
  so this sharpens interpretation without any image pipeline.
- Verify: vision prompt builder unit test stays Han-free + deterministic
  (LLM mocked); live Face/Palm read shows richer structured output.
- Files: `apps/api/src/modules/vision-shared/vision-prompts.ts`
  (+ its existing test).

### P5 - Copy rewrite + phase-marker removal (vi.ts)

- Add `viCopy.tarot` (heroEyebrow/title/subtitle, question label +
  placeholder, spread labels, submit, result title, retake, navOpen,
  safety notice) - all Vietnamese.
- Rewrite hero subtitles for the 5 core systems + mangpai + the
  extended systems, replacing the technical
  "Dung cung luong nhap du lieu sinh hien co..." with short,
  user-facing descriptions of what each system does.
- Remove the "GIAI DOAN 6" eyebrow (line ~236) and the
  "Giai doan 6 uu tien the tom tat..." subtitle (line ~158).

### P6 - Dashboard nav

- Add `hepan`, `mbti`, `tarot` entries to `EXTENDED_LINKS` in
  `ExtendedSystemNav.svelte` (currently only mangpai/face/palm). They
  stay fail-closed: only shown when the matching flag is true.

### P7 - Decision records + harness

- `docs/decisions/00NN-open-all-extended-systems.md` and
  `00NN-tarot-llm-reading.md` from `docs/templates/decision.md`.
- `harness-cli decision add` + `story add`/`story update` for the Tarot
  frontend slice; record `trace` at the end.

### P8 - Validate (local)

- `pnpm -F @ziweiai/web check` (0 errors), `pnpm lint` (max-warnings=0),
  `pnpm -F @ziweiai/api test`, `pnpm -F @ziweiai/web build`.

### P9 - Branch + PR + deploy

- Branch `feat/open-extended-systems-tarot`, commit, push `-u`,
  open PR into `main` with summary + test plan.
- SSH Lightsail: set 6 `EXTENDED_SYSTEM_*_ENABLED=true` in root `.env`,
  `git pull && pnpm install && pnpm turbo build && pm2 restart ziwei-api`.
- Verify `GET /features` returns all true.

### P10 - Verify (live)

- Playwright smoke (animations disabled): nav shows all 6 systems;
  each route loads; Tarot draw 200 with images + Vietnamese narrative +
  0 Han; screenshots to `docs/deploy/test-evidence/`.

## Tasks

- [ ] P1 Copy + rename 78 tarot images to `static/tarot/`.
  - Acceptance: 78 files named to backend ids; spot-check 3 majors +
    3 minors resolve.
  - Verify: list dir, count 78; load 2 in browser.
  - Files: `apps/web/static/tarot/*`.
- [ ] P2 Add `drawTarot` to api-client.
  - Acceptance: typed function, parses `tarotDrawSchema`.
  - Verify: tsc clean; mocked unit call.
  - Files: `apps/web/src/lib/api-client/index.ts`.
- [ ] P3 Tarot LLM prompt + wire narrative.
  - Acceptance: VN prompt builder; service uses provider chain; gates
    intact; deterministic draw unchanged.
  - Verify: api unit tests (prompt Han-free + deterministic, LLM mocked).
  - Files: `draws-tarot/tarot-prompts.ts`, `draws-tarot.service.ts`,
    `draws-tarot.service.test.ts`.
- [ ] P3B Enrich Face/Palm vision prompts with kanxiang knowledge (VN).
  - Acceptance: face/palm personas + structures extended with
    three-court/five-features (face) and principal-lines/mounts (palm);
    0 Han.
  - Verify: vision prompt unit test green (Han-free + deterministic).
  - Files: `vision-shared/vision-prompts.ts` (+ test).
- [ ] P4 Tarot model + screen + route + copy test.
  - Acceptance: draw renders images (reversed rotated) + narrative;
    anon allowed.
  - Verify: web check; tarot-copy-cjk test green.
  - Acceptance also: tarot render mode stays `unsupported` in registry.
  - Files: `features/tarot/*`, `routes/(app)/tarot/+page.svelte`,
    `system-registry/chart-system-registry.ts`.
- [ ] P5 vi.ts copy rewrite + drop "GIAI DOAN 6".
  - Acceptance: subtitles concise + user-facing; marker gone; 0 Han.
  - Verify: grep "GIAI DOAN 6" returns nothing; no-han test green.
  - Files: `apps/web/src/lib/i18n/vi.ts`.
- [ ] P6 Add hepan/mbti/tarot to ExtendedSystemNav.
  - Acceptance: 3 new links present, fail-closed by flag.
  - Verify: web check; visual after flags on.
  - Files: `features/dashboard/ExtendedSystemNav.svelte`.
- [ ] P7 Decision records + harness entries.
  - Acceptance: 2 decision md files; decision/story/trace recorded.
  - Verify: `harness-cli query matrix` shows entry.
  - Files: `docs/decisions/00NN-*.md`.
- [ ] P8 Local validation gate.
  - Acceptance: check + lint + api test + web build all green.
  - Verify: run the 4 commands.
- [ ] P9 Branch + PR + flip flags + restart + verify.
  - Acceptance: PR open; `/features` all true.
  - Verify: curl `/features`.
- [ ] P10 Live smoke + screenshots.
  - Acceptance: all systems reachable; Tarot reads with images + VN +
    0 Han.
  - Verify: screenshots in `docs/deploy/test-evidence/`.

## Risks

- Card image id mapping mistakes (majors named by title) -> mitigate with
  an explicit 78-row map + spot check.
- Tarot LLM latency / cost -> reuse existing provider chain + quota gate;
  keep narrative length bounded in the prompt.
- Lightsail 1.9 GB RAM build pressure -> already mitigated by 2 GB swap;
  no new heavy runtime added.
- Flipping flags exposes Face/Palm AI cost on prod -> acceptable; gated
  by identity + vision quota; free-for-all beta flag still applies.
