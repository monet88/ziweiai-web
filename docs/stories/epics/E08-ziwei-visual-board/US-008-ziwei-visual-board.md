# US-008 Lá số Tử Vi trực quan (bàn vuông kiểu truyền thống)

## Status

planned

## Lane

normal

## Product Contract

Nâng bàn 12 cung hiện có (`PalaceGrid`/`PalaceCell`) lên mức trực quan như lá số giấy
truyền thống (tham chiếu tuvi.vn + `.ref/taibu`): tách chủ tinh / phụ tinh / tạp diệu theo
vùng trong ô, hiển thị Trường Sinh + tuổi + đại vận, làm nổi tam phương tứ chính khi chọn
cung, và cho bàn vuông xuất hiện cả trên mobile. Mọi nhãn tiếng Việt, không rò chữ Hán.

## Relevant Product Docs

- `SPEC.md` Phần C — Phase 7 (chi tiết Tử Vi)
- `docs/product/invariants.md` (CJK guard, `translateZiweiKey` fail-fast)
- `docs/decisions/0007-web-server-boundary.md` (chỉ import `@ziweiai/contracts`)
- `.ref/taibu/src/components/ziwei/*` (tham chiếu render bàn vuông — KHÔNG import)

## Acceptance Criteria

- Mở 1 lá số Tử Vi → bàn vuông 4×4 hiển thị 12 cung viền + trung cung, kể cả trên mobile
  (bàn co giãn / cuộn được, không vỡ layout dưới 769px).
- Trong mỗi ô: chủ tinh nổi bật tách khỏi phụ tinh / tạp diệu; Trường Sinh + đại vận +
  tuổi hiển thị đúng khi snapshot có dữ liệu, degrade gọn khi thiếu.
- Chọn 1 cung → các cung tam phương tứ chính (`self`, `+6`, `+4`, `-4` mod 12) được làm nổi.
- Test quét `\p{Script=Han}` trên toàn bộ output bàn + ô + trung cung xanh.
- Snapshot legacy v1 (thiếu địa chi chuẩn) vẫn render được qua lưới responsive fallback,
  không throw, không rò Hán (fallback `"Thuật ngữ cũ"`).

## Design Notes

- KHÔNG làm contract: `palaceSchema` + `horoscopeSchema` + `ziweiSummarySchema` đã đủ dữ liệu.
- `palace-view-builder.ts`: bổ sung map `horoscope` (đại vận/lưu niên) + `ages`/`changsheng`
  vào `PalaceView` (hiện `changsheng`/`ages` đã build nhưng `PalaceCell` chưa render).
- `PalaceCell.svelte`: tách `<ul>` sao phẳng hiện tại thành vùng major/minor/adjective +
  góc metadata (Trường Sinh, đại vận, tuổi). Giữ là `<button>` (a11y, aria-pressed).
- `PalaceGrid.svelte`: bỏ chặn cứng ≥769px cho bàn vuông — cho phép bàn co giãn trên mobile
  (`aspect-ratio: 1` + cuộn ngang nếu cần). Tam phương tứ chính: tính từ `index` trong
  helper thuần mới (vd `palace-aspect.ts`), KHÔNG import core.
- Tam phương tứ chính dùng công thức `getTriangleSquare(index)` port logic từ taibu nhưng
  viết lại trên `index` số (không dùng chuỗi địa chi Hán).
- Mọi nhãn mới (đại vận/lưu niên `palaceNameKeys`, `mutagenStarKeys`) PHẢI có entry trong
  từ điển vi — `translateZiweiKey` fail-fast sẽ throw nếu thiếu key.

## Validation

`scripts\bin\harness-cli.exe story update --id US-008 --unit 1 --integration 0 --e2e 1 --platform 1`

| Layer | Expected proof |
| --- | --- |
| Unit | helper tam phương tứ chính (index→[self,+6,+4,-4]); quét Hán trên PalaceView mở rộng |
| Integration | — |
| E2E | mở lá số → bàn vuông trên cả desktop+mobile → chọn cung → tam phương tứ chính nổi |
| Platform | `pnpm -F @ziweiai/web check` + `tsc --noEmit` xanh |
| Release | — |

## Harness Delta

Lane normal: thuần `apps/web`, không chạm contract / auth / DB. Rủi ro chính là bất biến
ngôn ngữ (nhãn mới phải có trong từ điển vi) + không được import core/astro-engine khi
tính tam phương tứ chính. Nếu snapshot thật thiếu `changsheng12Key`/`decadalRange`/`ages`
trên đa số cung → ghi backlog (cell degrade nhiều).

## Evidence
