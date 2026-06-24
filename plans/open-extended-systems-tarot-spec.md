# Spec: Open All Extended Systems + Tarot Frontend + Tarot LLM

Status: DRAFT for review (no code written yet). Companion docs:
`plans/open-extended-systems-tarot-plan.md` (phased plan + tasks),
`plans/extended-systems-backlog.md` (deferred items).

Harness intake: #36 (spec-slice, lane high-risk).

## 1. Objective

Make every extended divination system usable end to end for real users,
and ship the missing Tarot frontend with a polished AI reading.

Concretely:
- Turn on all 6 extended-system feature flags on production so the
  dashboard surfaces them and the gated endpoints stop returning 403.
- Build the Tarot frontend (route + screen + api-client + copy), which
  is the only one of the 6 systems with backend ready but no web UI.
- Wire a real LLM reading for Tarot (currently the backend returns a
  deterministic placeholder narrative), using a Vietnamese prompt
  framework distilled from the reference skills.
- Enrich the existing Face/Palm vision prompts with kanxiang domain
  knowledge (Vietnamese) - a prompt-only upgrade so the soon-to-be-public
  Face/Palm readings feel expert-grade.
- Rewrite the per-system hero subtitles so a first-time user instantly
  understands what each system does, and remove the stale "GIAI DOAN 6"
  phase marker from the UI copy.
- Add hepan and mbti (and tarot) to the dashboard extended-system nav so
  the systems that already have routes are reachable.

Out of scope this round (see backlog): bazi/ziwei LLM prompt upgrade,
bazi enrichment layer, palm-line drawing overlay (MediaPipe), tarot
spread expansion, and net-new features (dream, naming, fortune sticks,
life K-line, multiple personas).

Who is the user: anonymous-allowed visitors for Tarot; email-identity
users where the system requires it (Face/Palm). Success looks like:
open the dashboard, see all extended systems, read a clear subtitle,
draw Tarot with real card images and a Vietnamese AI reading, zero Han
characters anywhere.

## 2. Tech Stack

Unchanged. SvelteKit SPA (Svelte 5 runes) + NestJS + Zod contracts,
pnpm@10.17.1 + Turbo. Deploy: AWS Lightsail (54.255.81.117), API under
pm2 (`ziwei-api`), static web served by Caddy, single root `.env`.
LLM providers already wired for vision/explanations: Gemini /
OpenAI-compatible / DeepSeek (DeepSeek text-only).

## 3. Commands

```
Build:      pnpm turbo build
Web check:  pnpm -F @ziweiai/web check
Lint:       pnpm lint
API test:   pnpm -F @ziweiai/api test
Web build:  pnpm -F @ziweiai/web build
Harness:    scripts/bin/harness-cli.exe query matrix
Deploy:     cd ~/ziweiai-web && git pull && pnpm install && pnpm turbo build && pm2 restart ziwei-api
Verify:     curl https://api.tuvi.monet.uno/features
```

## 4. Project Structure (added / changed)

```
apps/web/static/tarot/                         (new) 78 card images, ids match backend
apps/web/src/routes/(app)/tarot/+page.svelte   (new) thin route wrapper
apps/web/src/lib/features/tarot/
  tarot-model.svelte.ts                         (new) runes model + createMutation
  TarotScreen.svelte                            (new) question + spread + card grid + reading
  tarot-copy-cjk.test.ts                        (new) Han-free copy assertion
apps/web/src/lib/api-client/index.ts            (edit) + drawTarot()
apps/web/src/lib/i18n/vi.ts                     (edit) + viCopy.tarot, subtitle rewrites, drop marker
apps/web/src/lib/features/dashboard/
  ExtendedSystemNav.svelte                      (edit) + hepan, mbti, tarot
apps/web/src/lib/features/system-registry/
  chart-system-registry.ts                      (edit) keep tarot render mode = unsupported (own route)
apps/api/src/modules/draws-tarot/
  draws-tarot.service.ts                        (edit) wire LLM narrative behind a provider call
  tarot-prompts.ts                              (new) VN prompt builder (card meanings + spread + relations)
apps/api/src/modules/vision-shared/
  vision-prompts.ts                             (edit) enrich Face/Palm prompts with kanxiang knowledge (VN)
docs/decisions/00NN-open-all-extended-systems.md (new, on approval) durable decision
docs/decisions/00NN-tarot-llm-reading.md         (new, on approval) durable decision
.env (server only, not committed)               (edit) 6 EXTENDED_SYSTEM_*_ENABLED=true
```

## 5. Code Style

Mirror the MBTI / Vision feature pattern: thin route wrapper imports a
screen; the screen uses `AppScaffold` + a runes model factory; copy comes
from `viCopy`; `createQuery`/`createMutation` wrap options in a function;
the access token is read fresh inside `mutationFn` (invariants section 3),
never snapshotted at mount. Scoped CSS + `var(--*)` tokens, no Tailwind.

Example route wrapper (matches face/palm/mbti):

```svelte
<script lang="ts">
  import TarotScreen from '$lib/features/tarot/TarotScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<TarotScreen copy={viCopy.tarot} />
```

Tarot card render: image tile per card, rotate 180deg via CSS when
`reversed`, caption = Vietnamese card name + position. No fabricated card
art; use the real Rider-Waite images shipped to `static/tarot/`.

## 6. Testing Strategy

- Unit (Vitest): tarot model state transitions; a CJK-scan test that
  fails if any `viCopy.tarot` string or card label contains
  `\p{Script=Han}`. Backend: tarot prompt builder is deterministic and
  Han-free; LLM call is mocked.
- Static: `pnpm -F @ziweiai/web check` (svelte-check + tsc) zero errors,
  `pnpm lint` max-warnings=0, `pnpm -F @ziweiai/web build`.
- Live smoke (Playwright via in-app browser, `animations: 'disabled'`):
  `GET /features` returns all true; each extended system route loads;
  Tarot draw returns 200 with images + Vietnamese narrative + 0 Han;
  screenshots saved to `docs/deploy/test-evidence/`.
- Update test matrix proof for the relevant story via `story update`.

## 7. Boundaries

- Always: keep `translateZiweiKey` fail-fast; keep the Han-scan test;
  Vietnamese-only UI; web imports only `@ziweiai/contracts`; run
  check + lint + test green before deploy.
- Ask first: editing the production root `.env` to flip flags; deploying
  live; recording the durable decision; any change that alters the
  Tarot contract shape.
- Never: commit a real `.env`; weaken identity/quota gates; hardcode a
  chart system; copy Han text into the frontend; port a heavy ML model
  onto the 1.9 GB Lightsail box.

## 8. Success Criteria

1. `GET https://api.tuvi.monet.uno/features` returns
   `{hepan:true, mangpai:true, tarot:true, mbti:true, face:true, palm:true}`.
2. Dashboard shows reachable entries for all 6 extended systems
   (hepan, mangpai, tarot, mbti, face, palm).
3. Every system hero subtitle is short and self-explanatory; the string
   "GIAI DOAN 6" no longer appears anywhere in the UI.
4. `/tarot` draws cards (POST 200), renders real card images (reversed
   rotated), and shows a Vietnamese AI narrative with 0 Han characters.
5. Face/Palm vision readings show richer kanxiang-based structure
   (three-court/five-features for face; principal-lines/mounts for palm),
   still 0 Han.
6. Tarot chart-detail render mode stays `unsupported` in the registry
   (Tarot lives on its own `/tarot` route, not the shared chart-detail
   layout).
7. web check / lint / unit tests green; per-system screenshots captured.

## 9. Assumptions

1. "Open everything" = flip all 6 flags permanently on prod (edit root
   `.env`, restart), not a temporary test toggle.
2. Tarot uses real card images from `.ref/taibu/public/tarot_cards/`
   (78 files confirmed) copied into `apps/web/static/tarot/` with an
   id->filename map; no card art is generated.
3. Tarot allows anonymous accounts (per backend), unlike Face/Palm.
4. Tarot LLM reading reuses the existing AI provider chain
   (Gemini / OpenAI-compatible / DeepSeek) already used by vision /
   explanations. Reading is generated server-side; the deterministic
   draw (seed + cards) stays deterministic, only the narrative becomes
   LLM-generated.
5. Tarot card meanings + reading prompt are written in Vietnamese,
   distilled (not copied) from `tarot-skill/references/*` and the card
   meaning data in mingyu / FateAtelier; the Han-scan test guards this.
6. This is a behavior/boundary change (opening feature gates + adding an
   LLM call), so it warrants a durable decision record on approval.

## 10. Open Questions (resolved with user)

- Card art: real images. RESOLVED.
- Spreads: both three-card and celtic-cross. RESOLVED.
- Deploy: agent SSHes, flips flags, builds, restarts, verifies. RESOLVED.
- VCS: branch + PR (not push to main). RESOLVED.
- Tarot LLM: yes, wire it this round (option 2). RESOLVED.
- Tarot chart-detail render mode: keep `unsupported` (own route).
  RESOLVED.
- Kanxiang prompt enrichment for Face/Palm: pulled INTO this round
  (low effort, high value, prompt-only). RESOLVED.
- Palm-line drawing (MediaPipe) + bazi/ziwei prompt upgrade + bazi
  enrichment + net-new features: deferred to backlog. RESOLVED.
- Language: all Vietnamese, 0 Han across all of the above. RESOLVED.
