# US-011 Đường nối tam phương tứ chính trên bàn Tử Vi

## Status

implemented

## Lane

normal

## Product Contract

Bổ sung lớp vẽ **đường nối tam phương tứ chính** trên bàn vuông (`PalaceGrid`), khớp lá
số giấy truyền thống (tham chiếu tuvi.vn):

- **Mặc định (chưa tương tác):** auto-chọn cung **Mệnh** như taibu — vẽ sẵn các đường nối
  tam giác (chính cung → đối cung `+6`, hai cung tam hợp `+4`/`-4`) cho cung Mệnh ngay khi
  mở lá số, không cần tương tác. Nếu không xác định được cung Mệnh → không chọn cung nào,
  không vẽ đường.
- **Click chọn (chốt):** bấm vào một cung → chốt cung đó làm cung đang chọn (`selectedPalaceKey`),
  đường nối + làm nổi tam phương tứ chính cập nhật theo cung vừa chọn và **giữ nguyên** sau
  khi rời chuột (trạng thái bền, như taibu).
- **Hover (preview tạm):** rê vào một cung → preview tam phương tứ chính của cung đó: các cung
  **không** thuộc tam phương tứ chính mờ đi (giảm nổi bật), cung thuộc tam phương tứ chính giữ
  rõ, đường nối của cung đang hover được nhấn mạnh. Rời chuột → quay về trạng thái cung đang
  **chọn** (không phải mất hết).

US-008 đã làm nổi tam phương tứ chính bằng viền/nền ô (`inAspect`); story này thêm lớp
**đường nối SVG** + hành vi click-chốt + hover-preview dim, là phần nặng hơn được tách ra
khỏi US-008. Cơ chế click-select + auto-chọn Mệnh port từ `.ref/taibu`
`ZiweiChartGrid.tsx`; hover-dim là bổ sung mới (taibu không có).

## Relevant Product Docs

- `SPEC.md` Phần C — Phase 7 (chi tiết Tử Vi)
- `docs/product/invariants.md` (CJK guard, `translateZiweiKey` fail-fast)
- `docs/decisions/0007-web-server-boundary.md` (chỉ import `@ziweiai/contracts`)
- `docs/stories/epics/E08-ziwei-visual-board/US-008-ziwei-visual-board.md` (nền tảng bàn vuông)

## Acceptance Criteria

- Mở 1 lá số → đường nối tam phương tứ chính của cung Mệnh hiển thị sẵn dưới dạng tam giác
  nối tâm các ô liên quan, không cần tương tác (auto-chọn Mệnh; nếu thiếu Mệnh → không vẽ).
- Click vào một cung → chốt cung đó làm cung đang chọn; đường nối + làm nổi cập nhật theo
  cung vừa chọn và giữ nguyên sau khi rời chuột.
- Hover vào một cung bất kỳ → preview: các cung ngoài tam phương tứ chính của cung đó mờ đi,
  cung trong tam phương tứ chính giữ rõ, đường nối của cung hover được nhấn mạnh; rời chuột →
  về trạng thái cung đang chọn (không mất đường nối).
- Đường nối là lớp trình bày thuần (SVG overlay theo tọa độ ô), KHÔNG import core/astro-engine;
  tập cung liên quan tiếp tục lấy từ helper thuần `palace-aspect` (`getPalaceAspectIndices`).
- Chỉ vẽ đường nối ở bố cục bàn vuông; bố cục lưới responsive fallback (legacy) không vẽ
  đường (degrade gọn, không throw).
- A11y: hover là tăng cường trực quan; chọn cung bằng bàn phím vẫn hoạt động như US-008,
  trạng thái dim không khoá tương tác bàn phím và không dựa hover làm phương tiện duy nhất.

## Design Notes

- KHÔNG làm contract; KHÔNG đổi `palace-view-builder` (đã đủ `index` + địa chi để định vị).
- Tập cung liên quan: dùng lại `getPalaceAspectIndices(index)` từ `palace-aspect.ts`.
- Ba trạng thái (theo taibu + yêu cầu hover):
  - **Mặc định:** auto-chọn cung Mệnh làm `selectedPalaceKey` khi mở lá số (giống taibu:
    `selectedPalace` khởi tạo `undefined`, fallback về index Mệnh). Đường nối + làm nổi vẽ
    theo cung này ngay, không cần tương tác. Thiếu Mệnh → `null` → không vẽ.
  - **Click:** click một cung → set `selectedPalaceKey` = cung đó; trạng thái này bền (giữ
    sau khi rời chuột) cho tới lần click kế.
  - **Hover:** lưu cung hover bằng `$state` riêng (`hoveredPalaceKey`), tách khỏi
    `selectedPalaceKey`. Khi có hover → preview theo cung hover; rời chuột (`hoveredPalaceKey`
    = null) → render lại theo `selectedPalaceKey`.
- `PalaceGrid.svelte`: thêm lớp `<svg>` overlay tuyệt đối phủ bàn vuông; tính tâm mỗi ô từ
  vị trí `BRANCH_GRID_POSITION` (4×4) → vẽ `polygon`/`line` nối các cung tam phương tứ chính
  của cung đang hiệu lực (`hoveredPalaceKey ?? selectedPalaceKey`).
- Dim: thêm class `dimmed` cho ô không thuộc aspect của cung đang hiệu lực. Cung hiệu lực =
  `hoveredPalaceKey ?? selectedPalaceKey`; khi cả hai null (thiếu Mệnh) → không dim, không vẽ.
- Đường nối chỉ render khi `shouldUseSquareBoard` = true.
- Cân nhắc `prefers-reduced-motion` cho mọi transition mờ/hiện.

## Validation

`scripts\bin\harness-cli.exe story update --id US-011 --unit 1 --integration 0 --e2e 1 --platform 1`

| Layer | Expected proof |
| --- | --- |
| Unit | helper tính tâm ô / tập điểm đường nối từ index (thuần, nếu tách được) |
| Integration | — |
| E2E | mở lá số → đường nối hiển thị sẵn → hover cung → dim cung ngoài + nhấn đường nối |
| Platform | `pnpm -F @ziweiai/web check` + `tsc --noEmit` xanh |
| Release | — |

## Harness Delta

Lane normal: thuần `apps/web`, không chạm contract / auth / DB. Rủi ro chính là độ phức tạp
trình bày (SVG overlay căn theo grid co giãn + cuộn ngang trên mobile) và a11y (không để hover
là phương tiện duy nhất). Nếu căn tọa độ SVG theo grid co giãn quá khó ổn định → ghi backlog.

## Evidence

- `palace-board-geometry.ts` + `palace-board-geometry.test.ts`: helper hình học thuần (port
  `getAnchorPoint` của taibu) — `getAnchorPoint` (ô góc → góc trong, ô cạnh → trung điểm cạnh
  trong) + `buildAspectLines`. 7 unit test xanh.
- `PalaceGrid.svelte`: lớp `<svg>` overlay (viewBox 0–100, `preserveAspectRatio="none"`,
  `aria-hidden` + `pointer-events:none`) vẽ đường nối từ cung hiệu lực tới tam phương tứ chính;
  cung hiệu lực = `hoveredPalaceKey ?? selectedPalaceKey ?? soulPalaceKey` (auto-Mệnh là trạng
  thái trình bày cục bộ của bàn, KHÔNG ghi vào `selectedPalaceKey` model → giữ mặc định luận
  giải overview của US-006). Chỉ vẽ khi `shouldUseSquareBoard`; thiếu Mệnh → không vẽ.
- `PalaceCell.svelte`: thêm prop `dimmed` (mờ cung ngoài tam phương tứ chính khi hover) +
  `onHover` (mouseenter/leave); transition opacity tôn trọng `prefers-reduced-motion`.
- Validate: `pnpm -F @ziweiai/web check` (svelte-check 0 lỗi/0 cảnh báo) + `pnpm -F @ziweiai/web
  test` (20 file, 122 test xanh). Lint các file US-011 sạch (lỗi lint còn lại chỉ ở
  `templates/ui-reference/server.js` — không thuộc story này).
- `tests/e2e/us-011-ziwei-aspect-lines.spec.ts`: E2E Playwright — mở lá số → đường nối auto-Mệnh
  vẽ sẵn (3 đoạn `svg.aspect-overlay line`) + không dim ô nào → hover cung → có ô `.cell.dimmed`,
  đường nối vẫn vẽ → rời chuột → hết dim, đường nối còn nguyên. 1 test xanh (backlog #16 đóng).
