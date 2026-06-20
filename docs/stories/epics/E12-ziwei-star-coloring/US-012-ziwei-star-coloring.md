# US-012 Tô màu sao trong ô bàn Tử Vi (brightness / tứ hóa / loại sao)

## Status

planned

## Lane

normal

## Product Contract

Bổ sung lớp **tô màu sao** trong từng `PalaceCell` trên bàn Tử Vi để khớp lá số giấy
truyền thống (tham chiếu `.ref/taibu` `StarBadge.tsx` + `display-helpers.ts`):

- **Brightness 7 cấp** (theo `brightnessKey`): `miao` (Miếu) → `wang` (Vượng) → `de`
  (Đắc) → `li` (Lợi) → `ping` (Bình) → `bu` (Bất) → `xian` (Hãm). Mỗi cấp một màu cố
  định, gán cho phần nhãn brightness (và phụ trợ cho tên sao chủ tinh khi cần nhấn).
  Các cấp “mạnh” (miao/wang/de) ấm/sáng; “yếu” (bu/xian) lạnh/cảnh báo; ping trung
  tính.
- **Tứ hóa 4 màu** (theo `mutagen` key): `lu` (Lộc) / `quyen` (Quyền) / `khoa` (Khoa)
  / `ky` (Kỵ). Lộc/Quyền sắc ấm – nhấn cát; Khoa lạnh – ổn định; Kỵ tối – cảnh báo.
- **Loại sao (group)** quyết định trọng số trình bày — như US-008 đã làm — nhưng story
  này thêm tô màu hệ thống cho **hung tinh thuộc nhóm phụ (minor malefic)**:
  `huoxingMin`, `lingxingMin`, `qingyangMin`, `tuoluoMin`, `dikongMin`, `dijieMin`
  → tô tone đỏ-xám cảnh báo, khác hẳn cát tinh phụ (vẫn giữ tone gold-soft / muted).
- **Tooltip tiếng Việt:** hover/focus một sao có brightness hoặc mutagen → hiện
  tooltip mô tả ngắn (ví dụ: “Miếu — sáng nhất” / “Hóa Lộc — tài lộc, hanh thông”).
  Tooltip dùng `title` thuần hoặc helper text-only (không component nặng) để giữ a11y
  bằng bàn phím qua focus, không phụ thuộc hover.
- **A11y / motion:** hover/focus chỉ là tăng cường trực quan; mọi transition màu tôn
  trọng `prefers-reduced-motion`. Màu phải đạt độ tương phản WCAG AA so với nền
  `--color-bg-surface` / `--color-bg-elevated` (đặc biệt cấp `xian`/`bu` trên dark
  theme).

US-008 đã đặt nền tảng nhóm sao + nhãn brightness/mutagen tiếng Việt. Story này KHÔNG
đổi contract / builder — chỉ thêm lớp **map key → CSS color token** ở trình bày, tách
file `palace-view-builder.ts` thành chỗ phơi key gốc (`brightnessKey?` / `mutagenKey?`
trên `StarTokenView`) và helper thuần `star-color.ts` ánh xạ key → biến CSS đã định
nghĩa trong `tokens.css`.

## Relevant Product Docs

- `SPEC.md` Phần C — Phase 7 / 9 (chi tiết Tử Vi)
- `docs/product/invariants.md` (CJK guard, `translateZiweiKey` fail-fast, i18n Việt
  trên web)
- `docs/decisions/0007-web-server-boundary.md` (web chỉ import `@ziweiai/contracts`)
- `docs/stories/epics/E08-ziwei-visual-board/US-008-ziwei-visual-board.md` (nền tảng
  bàn vuông + phân nhóm sao)
- `docs/stories/epics/E08-ziwei-visual-board/US-011-ziwei-aspect-lines.md` (mẫu story
  visual-only, không chạm contract)

## Acceptance Criteria

- Mở 1 lá số → mỗi sao có `brightnessKey` được tô màu theo cấp tương ứng (7 cấp,
  trùng key) ở phần nhãn brightness; cấp `xian`/`bu` rõ ràng khác cấp `miao`/`wang`
  bằng màu, không chỉ bằng chữ.
- Mỗi sao có `mutagen` (Lộc/Quyền/Khoa/Kỵ) được tô màu tứ hóa khác biệt với
  brightness; 4 cấp tứ hóa phân biệt rõ với nhau và với màu cát tinh thường.
- Hung tinh phụ (`huoxingMin`, `lingxingMin`, `qingyangMin`, `tuoluoMin`, `dikongMin`,
  `dijieMin`) trong hàng `minor-row` được tô tone cảnh báo (đỏ-xám) khác cát tinh
  cùng nhóm; danh sách hung tinh là hằng số tường minh trong `star-color.ts`.
- Hover hoặc focus bàn phím vào một sao có brightness/mutagen → hiện tooltip tiếng
  Việt mô tả ngắn (đọc từ bảng thuật ngữ; brightness null + mutagen null → không có
  tooltip). Tooltip không phụ thuộc hover thuần (focus bàn phím cũng kích hoạt).
- Helper `getStarColors(star)` là **hàm thuần**, nhận `StarTokenView` (kể cả khi
  `brightnessKey` / `mutagenKey` undefined hoặc snapshot legacy thiếu `group`) → trả
  object `{ nameColor, brightnessColor, mutagenColor, isMalefic }` với fallback an
  toàn (key không khớp → `null` thay vì throw).
- Lớp tô màu là trình bày thuần: KHÔNG import `@ziweiai/core` / `@ziweiai/astro-engine`
  / `iztro`; KHÔNG ghi tên sao Hán; mọi nhãn phải qua `translateZiweiKey` (đã có ở
  `palace-view-builder`).
- Mọi transition màu/opacity tôn trọng `prefers-reduced-motion: reduce` → không
  transition; màu nền/text không xung đột với highlight `selected`/`in-aspect`/
  `dimmed` của US-008/US-011 (có thể quan sát đồng thời).
- `pnpm -F @ziweiai/web check`, `pnpm -F @ziweiai/web test`, lint US-012 xanh; bài
  scan `\p{Script=Han}` (`no-han-characters.test.ts`) tiếp tục pass.

## Design Notes

- **Files chạm:**
  - `apps/web/src/lib/features/chart/star-color.ts` *(mới)* — hàm thuần ánh xạ
    `brightnessKey | mutagenKey | nameKey + group` → CSS var name (string). KHÔNG
    chứa logic UI, KHÔNG import contracts ngoài type. Hằng số `MINOR_MALEFIC_KEYS` ở
    đây.
  - `apps/web/src/lib/features/chart/star-color.test.ts` *(mới)* — unit test bảng
    đầy đủ 7 brightness × 4 mutagen × tập hung tinh + degrade null/legacy.
  - `apps/web/src/lib/features/chart/palace-view-builder.ts` — phơi
    `brightnessKey?: BrightnessKey` và `mutagenKey?: MutagenKey` trên `StarTokenView`
    (forward key gốc từ snapshot; bản dịch tiếng Việt vẫn giữ trong `brightness` /
    `mutagen` để US-008/US-011 không phải đổi). KHÔNG đổi shape `PalaceView`, KHÔNG
    chạm `buildPalaceView` business logic.
  - `apps/web/src/lib/features/chart/PalaceCell.svelte` — gọi `getStarColors(star)`
    trong `{#each}`; gắn `style="--star-name-color: …; --star-brightness-color: …"` ở
    `<li>` và dùng biến CSS trong block `<style>`. Thêm `title` text cho tooltip; class
    `malefic` cho hung tinh.
  - `apps/web/src/lib/theme/tokens.css` — bổ sung biến mới: 7 brightness color, 4
    mutagen color, 1 cặp malefic (foreground + soft). Tone cân chỉnh trên dark theme
    (`#0b0b0d` → `#1a1b1e`), giữ contrast WCAG AA cho cấp `xian`/`bu` (đỏ-xám không
    quá tối).
  - `apps/web/src/lib/i18n/ziwei-star-terms-vi.ts` *(read-only)* — đã có sẵn nhãn
    Việt cho key sao; tooltip chỉ tra qua `translateZiweiKey` cho brightness/mutagen
    (đã có).
  - `apps/web/tests/e2e/us-012-ziwei-star-coloring.spec.ts` *(mới)* — Playwright
    smoke: mở lá số → một sao chính tinh có `style` chứa `--star-brightness-color`
    khớp giá trị token brightness `wang`; một sao có mutagen `Hóa Lộc` có
    `--star-mutagen-color` khớp token `lu`; hover một sao → tooltip xuất hiện.
- **KHÔNG làm:** không chạm contract zod (đã có `brightnessKeySchema` /
  `mutagenKeySchema`); không đổi `palace-aspect.ts`; không đổi component khác (chart
  detail / dashboard); không thêm dep mới; không thêm component tooltip nặng (giữ
  `title` thuần đến khi có US tooltip riêng nếu cần).
- **Tham chiếu taibu:** `getBrightnessColor` / `getMutagenColor` /
  `MINOR_MALEFIC_STARS` ở `.ref/taibu/src/lib/divination/display-helpers.ts` +
  `StarBadge.tsx`. Bản port web chỉ giữ ý đồ ánh xạ; KHÔNG copy mã hex thô vào TS —
  giá trị màu sống ở `tokens.css` để dễ tinh chỉnh contrast theo theme.
- **Boundary:** chỉ import `@ziweiai/contracts` (lấy type `BrightnessKey` /
  `MutagenKey` / `StarGroup`); không nhập runtime nào ngoài đó. ESLint
  `no-restricted-imports` tiếp tục bảo vệ tự động.
- **Tương thích trạng thái khác:** `selected` / `in-aspect` chỉnh viền + nền cell;
  `dimmed` chỉnh `opacity`. Màu sao là `color` text trong cell → KHÔNG xung đột.
  Test smoke phải kiểm 1 cell `selected` + 1 cell `dimmed` vẫn giữ màu sao đúng.

## Validation

`scripts\bin\harness-cli.exe story update --id US-012 --unit 1 --integration 0 --e2e 1 --platform 1`

| Layer | Expected proof |
| --- | --- |
| Unit | `star-color.test.ts` phủ 7 brightness × 4 mutagen × tập hung tinh + null/legacy → object màu khớp bảng |
| Integration | — (không API/DB) |
| E2E | `us-012-ziwei-star-coloring.spec.ts`: mở lá số → kiểm `style` cell có biến `--star-brightness-color` / `--star-mutagen-color` đúng token; tooltip xuất hiện khi hover |
| Platform | `pnpm -F @ziweiai/web check` (svelte-check + tsc) + `pnpm -F @ziweiai/web test` xanh |
| Release | — |

## Harness Delta

Lane normal: thuần `apps/web` (UI + token + helper thuần). Không chạm contract / auth
/ DB / API. Rủi ro chính:

1. **Contrast trên dark theme**: 7 màu brightness phải phân biệt rõ trên cả
   `--color-bg-surface` (`#1a1b1e`) lẫn `--color-bg-elevated` (`#111214`). Nếu cấp
   `ping`/`bu` đụng nhau → ghi backlog “điều chỉnh contrast brightness”.
2. **Nguy cơ Han slip**: nếu có ai vô tình copy bảng `BRIGHTNESS_COLORS` từ taibu
   (key Hán) → fail `no-han-characters.test.ts`. Giữ helper thuần nhận key ASCII là
   chốt chặn.

Không thay đổi quy trình harness; không decision mới (boundary US-012 nằm trong
0007).

## Evidence

Add commands, reports, screenshots, or links after validation exists.
