# Handover: Phase 11 Ticket 2 — UI/UX Glassmorphism & Animations

## 1. Mục Tiêu (Goal)
Đánh bóng UI/UX chart detail theo hướng **Mystical Premium Glass**:
- Glassmorphism (`backdrop-blur`) + viền gradient 1px
- Nền tối huyền bí (scoped, không lật cả app)
- Micro-animations GSAP trên Web
- Đồng bộ design trên Flutter `ChartDetailScreen`

## 2. Việc Đã Làm (Work Done)

### 2.1. Web (`apps/web`)
1. **Design tokens** (`src/lib/theme/tokens.css`):
   - Thêm glass tokens (`--glass-bg`, `--glass-blur`, `--glass-gradient`, …)
   - Scope `.theme-mystical` remap palette tối (ink + gold accent)
   - Utility global `.surface-glass` (frost + gradient border + reduced-transparency fallback)
2. **AppScaffold**: prop `tone="default" | "mystical"` + ambient glow background
3. **SummaryCard**: `variant="glass"` với glass surface + `data-reveal` / `data-reveal-line`
4. **ChartDetailScreen**: `tone="mystical"`, glass board shell, GSAP entrance
5. **Detail cards** (Bát Tự, Mai Hoa, Lục Hào, Đại Lục Nhâm, Kỳ Môn, Mạnh Phái) + fortune cards dùng glass
6. **GSAP**: dependency `gsap` + helpers `src/lib/motion/reveal.ts` (honors `prefers-reduced-motion`)
7. Unit tests: `reveal.test.ts` (3/3 PASS)

### 2.2. Mobile (`apps/mobile`)
1. **AppTheme**: thêm `mystical` theme + glass color constants
2. **GlassPanel** (`lib/ui/glass_panel.dart`): `BackdropFilter` + border + soft gradient
3. **ChartDetailScreen**: dark mystical scaffold, entrance fade/slide, glass board wrapper
4. **ZiweiBoard**: adapt colors theo light/dark theme

## 3. Verification
| Gate | Result |
|------|--------|
| `pnpm -F @ziweiai/web check` | 0 errors / 0 warnings |
| `pnpm -F @ziweiai/web lint` | PASS |
| `pnpm -F @ziweiai/web exec vitest run src/lib/motion/reveal.test.ts` | 3/3 PASS |
| `pnpm -F @ziweiai/web test` | 248/248 PASS |
| `flutter analyze` (touched files) | No issues |
| `flutter test` | 8/8 PASS |

## 4. Design Decisions
- **Scoped mystical, not global dark mode**: giữ monochrome light Luvsa cho phần lớn product (decision 0031); chỉ chart detail (và surface opt-in) dùng dark glass.
- **Gold accent** (`#D4AF37`) cho mystical CTA/edge — astrology heritage, không dùng AI-purple default.
- **GSAP only for entrance/line reveal** — không scroll-hijack; cleanup via `gsap.context`.
- Không Tailwind (repo dùng CSS variables thuần).

## 5. Next Steps (Session sau)
1. **[TICKET-3] SEO & Dynamic OG Image**
   - Meta title/description động theo lá số
   - Hoàn thiện `GET /share/charts/:chartId/og.png` (satori) theo style glass
2. Optional polish: visual regression Playwright snapshot cho `/charts/:id`
3. Optional: reduced-motion e2e assertion

## 6. Prompt Cho Session Mới

```markdown
Chào bạn, chúng ta tiếp tục dự án Tử Vi Toàn Tập ở session mới.
Xin hãy đọc `docs/handover/phase-11-ticket2-ui-polish-handoff.md` để nắm ngữ cảnh.

Mục tiêu session này: thực thi **Phase 11 - Ticket 3: SEO Chuyên sâu & Dynamic OG Image**.
Hãy xem lại plan Phase 11 trong antigravity brain implementation_plan và tiến hành dynamic meta + OG image endpoint.
```
