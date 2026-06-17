# Plan US-012 — Tô màu sao trong ô bàn Tử Vi

> Tham chiếu story packet: `docs/stories/epics/E12-ziwei-star-coloring/US-012-ziwei-star-coloring.md`.
> Lane: **normal**. Web-only. KHÔNG chạm contract / auth / DB / API.

## Goal

Tô màu nhãn brightness (7 cấp), mutagen (4 cấp tứ hóa) và hung tinh phụ trong từng
`PalaceCell` của bàn Tử Vi, khớp lá số giấy truyền thống — bằng helper thuần ánh xạ
key → CSS variable, KHÔNG đổi contract / builder hành vi.

## Pre-conditions (đọc trước khi code)

- [ ] Đã đọc `docs/stories/epics/E12-ziwei-star-coloring/US-012-ziwei-star-coloring.md`
      (story packet song hành).
- [ ] Đã đọc `docs/stories/epics/E08-ziwei-visual-board/US-008-ziwei-visual-board.md`
      và `US-011-ziwei-aspect-lines.md` (mẫu visual-only, không chạm contract).
- [ ] Đã đọc `docs/decisions/0007-web-server-boundary.md`
      (web chỉ import `@ziweiai/contracts`).
- [ ] Đã đọc `docs/product/invariants.md` (CJK guard, fail-fast).
- [ ] Đã đọc `apps/web/src/lib/features/chart/palace-view-builder.ts`
      và `apps/web/src/lib/features/chart/PalaceCell.svelte` để biết shape hiện tại.
- [ ] Đã đọc bảng tham chiếu `.ref/taibu/src/lib/divination/display-helpers.ts`
      và `.ref/taibu/src/components/ziwei/StarBadge.tsx`
      (lấy ý đồ map color, KHÔNG copy giá trị Hán).
- [ ] Đã chạy `scripts/bin/harness-cli.exe query matrix` để xem proof status.

## Phases

### Phase 1 — Research & intake

- [ ] `scripts/bin/harness-cli.exe intake --type spec-slice --summary "US-012 ziwei star coloring" --lane normal`
- [ ] `scripts/bin/harness-cli.exe story add --id US-012 --title "Ziwei star coloring (brightness/mutagen/group)" --lane normal --verify "pnpm -F @ziweiai/web check && pnpm -F @ziweiai/web test"`
- [ ] Đọc lại `packages/contracts/src/chart/chart-snapshot.ts` (l.97–135) để chốt:
      `brightnessKeySchema = ['miao','wang','de','li','ping','bu','xian']`,
      `mutagenKeySchema = ['lu','quyen','khoa','ky']`,
      `starGroupSchema = ['major','minor','adjective']`.
- [ ] Khảo sát danh sách hung tinh phụ trong taibu (`MINOR_MALEFIC_STARS` literal
      trong `.ref/taibu`) → mapping key web đã chuẩn: `qingyangMin`, `tuoluoMin`,
      `huoxingMin`, `lingxingMin`, `dikongMin`, `dijieMin` (chéo với
      `apps/web/src/lib/i18n/ziwei-star-terms-vi.ts` để xác nhận chính tả key).
      KHÔNG copy literal Hán vào file plan / source web (bất biến CJK guard).
- **Validation phase 1:** intake + story tồn tại trong harness DB; danh sách key
  brightness/mutagen/malefic chốt cứng trong notes phase 2.

### Phase 2 — Helper thuần `star-color.ts` + unit test

- [ ] Tạo `apps/web/src/lib/features/chart/star-color.ts`:
  - Type `StarColors = { nameVar: string | null; brightnessVar: string | null; mutagenVar: string | null; isMalefic: boolean }`.
  - Hằng số `MINOR_MALEFIC_KEYS: ReadonlySet<string>` chứa 6 key đã chốt phase 1.
  - Hàm thuần `getStarColors(input: { nameKey?: string; group?: 'major'|'minor'|'adjective'; brightnessKey?: BrightnessKey; mutagenKey?: MutagenKey }): StarColors`.
  - Trả `null` cho biến nào input thiếu / không khớp; tuyệt đối không throw.
  - Import type duy nhất từ `@ziweiai/contracts` (`BrightnessKey`, `MutagenKey`,
    `StarGroup`); không runtime import.
- [ ] Tạo `apps/web/src/lib/features/chart/star-color.test.ts`:
  - 7 case brightness → 7 var name khác nhau.
  - 4 case mutagen → 4 var name khác nhau.
  - 6 case minor malefic → `isMalefic: true`; cát tinh phụ (`lucunMin`, `wenchangMin`)
    → `isMalefic: false`.
  - Edge: cả `brightnessKey` & `mutagenKey` undefined → `{nameVar:null, brightnessVar:null, mutagenVar:null, isMalefic:false}` với cát tinh; `isMalefic:true` với key trong tập malefic.
  - Edge: `nameKey` undefined / legacy `legacy_xxx` → `isMalefic:false`, không throw.
  - Edge: `group` undefined → fallback an toàn.
- **Validation phase 2:** `pnpm -F @ziweiai/web test star-color` xanh.

### Phase 3 — Mở rộng `palace-view-builder` để forward key gốc

- [ ] Thêm vào `StarTokenView`:
  - `brightnessKey?: BrightnessKey` (forward `star.brightnessKey` thô).
  - `mutagenKey?: MutagenKey` (forward `star.mutagen` thô — schema field tên
    `mutagen` nhưng giá trị là `MutagenKey`).
- [ ] Cập nhật `buildStarToken`: gán `brightnessKey: star.brightnessKey`,
      `mutagenKey: star.mutagen` (giữ nguyên `brightness` / `mutagen` đã dịch tiếng
      Việt cho US-008/US-011). KHÔNG đổi tên field cũ.
- [ ] Chạy lại `apps/web/src/lib/features/chart/palace-view-cjk.test.ts` +
      `no-han-characters.test.ts` để chắc không hồi quy.
- **Validation phase 3:** `pnpm -F @ziweiai/web test palace-view-cjk`,
  `pnpm -F @ziweiai/web test no-han-characters` xanh.

### Phase 4 — CSS tokens cho 7 brightness + 4 mutagen + 1 cặp malefic

- [ ] Thêm vào `apps/web/src/lib/theme/tokens.css` (block `:root`) các biến:
  - `--color-star-brightness-miao`, `…-wang`, `…-de`, `…-li`, `…-ping`, `…-bu`,
    `…-xian` (7 biến). Tone gợi ý dựa taibu nhưng cân lại trên dark theme:
    miao/wang/de ấm sáng (gold/orange/lime); li/ping trung tính (blue/gray);
    bu/xian cảnh báo (đậm hơn).
  - `--color-star-mutagen-lu`, `…-quyen`, `…-khoa`, `…-ky` (4 biến).
  - `--color-star-malefic`, `--color-star-malefic-soft` (2 biến).
- [ ] Kiểm contrast tay vs. `--color-bg-surface` (`#1a1b1e`) và
      `--color-bg-elevated` (`#111214`) — mục tiêu WCAG AA (≥ 4.5:1 cho text 12px).
      Cấp `ping`/`bu` dễ đụng nhau → cách 0.15 hue / 8% lightness.
- **Validation phase 4:** mở `pnpm -F @ziweiai/web dev`, xem một bàn mock — mắt
  thường phân biệt được 7 cấp + 4 mutagen + malefic.

### Phase 5 — Cập nhật `PalaceCell.svelte`

- [ ] `<script>`: import `getStarColors` từ `./star-color`.
- [ ] Trong các vòng `{#each majorStars …}` / `minorStars` / `adjectiveStars`:
  - Tính `const colors = getStarColors(star)` (nên helper trả ổn định, không cần
    `$derived` riêng cho từng `<li>`).
  - Gắn `style={…}` mảng vào `<li>` chứa các biến CSS có giá trị từ
    `colors.nameVar` / `colors.brightnessVar` / `colors.mutagenVar`. Chỉ thêm biến
    nào không null (tránh `style="--x: null"`).
  - Class `class:malefic={colors.isMalefic}` (chỉ cho `minor-row`).
  - Thêm `title` cho `<li>`: ghép từ `star.brightness` + `star.mutagen` đã dịch
    (vd. `"Vượng · Hóa Lộc"`); để rỗng → bỏ attribute `title` để tránh empty
    tooltip.
- [ ] Block `<style>`:
  - Thêm rule `.star-meta { color: var(--star-brightness-color, var(--color-text-muted)); }`
    (fallback cũ vẫn dùng được).
  - Thêm rule `.star-mutagen { color: var(--star-mutagen-color, var(--color-accent-ai)); }`.
  - `.star.major { color: var(--star-name-color, var(--color-accent-gold-soft)); }`
    (cho phép brightness override màu tên chủ tinh nếu helper trả `nameVar`).
  - `.star.minor.malefic { color: var(--color-star-malefic); }` +
    `.star.minor.malefic .star-meta { color: var(--color-star-malefic-soft); }`.
  - Tôn trọng `@media (prefers-reduced-motion: reduce) { transition: none }` (đã có).
- [ ] Thủ công: mở 1 lá số dev, soi DevTools — kiểm `style` của `<li>` có biến
      đúng; toggle `selected` / `dimmed` / `in-aspect` thấy không xung đột màu.
- **Validation phase 5:** `pnpm -F @ziweiai/web check` (svelte-check + tsc) xanh.

### Phase 6 — E2E Playwright + scan Han

- [ ] Tạo `apps/web/tests/e2e/us-012-ziwei-star-coloring.spec.ts`:
  - Login mock + mở 1 lá số đã có (tận dụng fixture US-008/US-011).
  - Locator một `<li class="star major">` chứa text “Tử Vi” (hoặc một chính tinh
    đã biết) → assert `getAttribute('style')` chứa `--star-brightness-color:`
    (không cần khớp hex chính xác — chỉ cần biến tồn tại).
  - Locator một `<li>` có nhãn “Hóa Lộc” → assert `style` chứa
    `--star-mutagen-color:`.
  - Locator một `<li class="star minor malefic">` (vd. Kình Dương / Hỏa Tinh) →
    assert có class `malefic`.
  - Hover một `<li>` có brightness → assert thấy `title` attribute không rỗng.
- [ ] Chạy lại `apps/web/src/lib/features/chart/no-han-characters.test.ts` để
      đảm bảo chưa có Han slip vào helper / token / spec.
- **Validation phase 6:** `pnpm -F @ziweiai/web test:e2e -- us-012` xanh +
  `pnpm -F @ziweiai/web test no-han-characters` xanh.

### Phase 7 — Lint, full test, harness update + trace

- [ ] `pnpm -F @ziweiai/web check`
- [ ] `pnpm -F @ziweiai/web test`
- [ ] `pnpm -F @ziweiai/web lint --max-warnings=0` (lint phạm vi US-012 sạch)
- [ ] `scripts/bin/harness-cli.exe story update --id US-012 --unit 1 --integration 0 --e2e 1 --platform 1`
- [ ] `scripts/bin/harness-cli.exe trace --intake <n> --story US-012 --summary "Tô màu sao theo brightness/mutagen/malefic" --outcome completed --agent claude --actions "Add star-color helper, extend StarTokenView, tokens, PalaceCell wiring, e2e" --read "PalaceCell.svelte palace-view-builder.ts taibu/StarBadge.tsx" --changed "star-color.ts star-color.test.ts palace-view-builder.ts PalaceCell.svelte tokens.css us-012-*.spec.ts" --friction "—"`
- [ ] Nếu phát hiện friction (contrast không đạt / contract zod thiếu key) →
      `scripts/bin/harness-cli.exe backlog add --title <…> --pain <…> --risk normal`.
- [ ] Cập nhật `Evidence` block trong story packet US-012.

## Risk + Rollback

| Rủi ro | Khả năng | Hậu quả | Giảm thiểu / Rollback |
|---|---|---|---|
| Contrast 7 cấp brightness không phân biệt nổi trên dark theme | trung bình | UX không cải thiện | Cân lại lightness trong `tokens.css`; nếu không xong trong scope → ghi backlog “điều chỉnh contrast US-012”, vẫn merge vì hành vi đúng |
| Han slip qua bảng màu (copy nguyên `BRIGHTNESS_COLORS` taibu key Hán) | thấp | `no-han-characters.test.ts` đỏ | Helper nhận key ASCII của contracts là chốt chặn; review code phải bắt |
| Contract zod thiếu key brightness/mutagen mới | rất thấp | type error ở helper | Bảng key đã đóng (l.99–100 `chart-snapshot.ts`); nếu cần mở rộng → đẩy story riêng cho contract |
| Rò rỉ Tailwind / class taibu vào `PalaceCell.svelte` | thấp | style không apply | Web không dùng Tailwind; review chỉ dùng scoped CSS + var |
| Tương tác với `selected` / `in-aspect` / `dimmed` | thấp | màu sao biến mất khi cell mờ | E2E phase 6 kiểm tra một cell `dimmed` + một cell `selected` vẫn đủ biến CSS |

**Rollback đơn giản:** revert 5 file `star-color.ts`, `star-color.test.ts`,
`palace-view-builder.ts` (chỉ patch field), `PalaceCell.svelte`, `tokens.css` +
1 file e2e. Không có migration / DB / API → rollback an toàn ở mọi phase.

## Done Criteria (match story AC)

- [ ] Mở lá số → mỗi sao có `brightnessKey` tô màu đúng cấp (7 cấp khớp bảng).
- [ ] Mỗi sao có `mutagen` tô màu đúng tứ hóa (4 cấp khớp bảng), khác brightness.
- [ ] 6 hung tinh phụ nhận class `malefic` + tone đỏ-xám rõ rệt.
- [ ] Hover/focus một sao có brightness/mutagen → tooltip Việt xuất hiện
      (`title` attribute không rỗng).
- [ ] Helper `getStarColors` thuần, fallback an toàn (test phase 2 phủ).
- [ ] Không import `@ziweiai/core` / `astro-engine` / `iztro` /
      `lunar-javascript` ở web (`no-restricted-imports` xanh).
- [ ] `\p{Script=Han}` scan xanh (không Han ở web).
- [ ] `pnpm -F @ziweiai/web check`, `pnpm -F @ziweiai/web test`,
      `pnpm -F @ziweiai/web test:e2e -- us-012` xanh.
- [ ] Harness `story update` US-012 với `--unit 1 --e2e 1 --platform 1`.
- [ ] Trace cuối task ghi nhận trong harness DB; backlog ghi friction nếu có.
