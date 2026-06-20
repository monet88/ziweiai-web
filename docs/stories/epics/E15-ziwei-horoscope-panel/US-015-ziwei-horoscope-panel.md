# US-015 Panel vận hạn tương tác Tử Vi (đại vận → lưu niên → lưu nguyệt → lưu nhật)

## Status

planned

## Lane

high-risk

## Product Contract

Bổ sung **panel vận hạn tương tác** cạnh bàn 12 cung của Tử Vi, port từ taibu
`ZiweiHoroscopePanel.tsx`. Người dùng chọn theo 4 tầng phân cấp **đại vận → lưu niên →
lưu nguyệt → lưu nhật**: chọn tầng cao reset tầng thấp; mỗi lần đổi mốc, bàn 12 cung
highlight đa màu cung Mệnh vận của (các) tầng đang chọn (đại vận = vàng, lưu niên =
xanh, lưu nguyệt = tím, lưu nhật = hồng — khác hẳn lớp `inAspect` của US-011).

Toàn bộ phép tính vận hạn chạy ở `apps/api` qua endpoint `POST /charts/:id/horoscope`
(US-014 đã đặt nền). Web là tầng trình bày thuần: nhận `horoscopeFrameSchema`, lưu state
4 tầng bằng runes `$state`, gọi lại endpoint khi `asOf` đổi, render chip strip + tab
strip + overlay highlight. KHÔNG import `@ziweiai/core`/`iztro`/`lunar-javascript`
(giữ [[0007-web-server-boundary]]).

## Lane Justification

High-risk vì:

- Chạm public contract `horoscopeFrameSchema` (nếu cần extend) + tiêu thụ endpoint
  `POST /charts/:id/horoscope` (US-014). Sai shape ⇒ web vỡ runtime.
- Đụng bất biến CJK: tên đại vận / lưu niên / lưu nguyệt / lưu nhật mặc định là Hán
  trong snapshot taibu — phải qua `translateZiweiKey` fail-fast; không được rò Han.
- State machine 4 tầng + pattern reset xuống tầng dưới — rủi ro logic cao, cần unit
  test thuần (không cần QueryClient context) để lock invariant.
- Tăng số call API tới N round-trip khi user lướt nhanh các chip → cần TanStack Query
  cache + `staleTime` dài (vận hạn deterministic theo `chartId + asOf`).

## Relevant Product Docs

- `docs/decisions/0011-horoscope-engine-boundary.md` (engine vận hạn server-side, contract chung cho US-014/US-015/US-016)
- `docs/decisions/0007-web-server-boundary.md` (cấm import `@ziweiai/core` / iztro / lunar)
- `docs/product/api-contract.md` (`POST /charts/:id/horoscope` — nền tảng từ US-014)
- `docs/product/invariants.md` (§2 ngôn ngữ Vi, §3 reactive flow, CJK guard)
- `docs/stories/epics/E14-ziwei-flow-info/US-014-ziwei-flow-info.md` (tiền đề: contract + endpoint)
- `docs/stories/epics/E08-ziwei-visual-board/US-011-ziwei-aspect-lines.md` (nền `inAspect` overlay; story này thêm overlay khác)
- `.ref/taibu/src/components/ziwei/ZiweiHoroscopePanel.tsx` (pattern useReducer 4 tầng)

## Pre-conditions

US-014 đã merge: contract `horoscopeFrameSchema` (extend cho `monthly` + `daily`) +
endpoint `POST /charts/:id/horoscope` body `{ asOf, scopes }` đã sẵn ở `apps/api`,
`fetchChartHoroscope` đã có ở `apps/web/src/lib/api-client/index.ts`. Story này KHÔNG
được mở lại contract / endpoint của US-014; nếu phát hiện thiếu field → backlog +
decision riêng, không tự nhồi.

## Story Packet

| File | Nội dung |
| --- | --- |
| `overview.md` | hành vi hiện tại / đích / user / non-goal |
| `design.md` | state machine 4 tầng, application flow, UI/Platform, contract reuse từ US-014, observability |
| `execplan.md` | phạm vi, hard gate, work phase, stop condition |
| `validation.md` | proof strategy, test plan đa lớp, fixtures, command |

## Validation

`scripts\bin\harness-cli.exe story update --id US-015 --unit 1 --integration 1 --e2e 1 --platform 1`

| Layer | Expected proof |
| --- | --- |
| Unit | reducer 4 tầng (chọn cao reset thấp, toggle, default = decadal chứa năm hiện tại); helper highlight overlay; `translateZiweiKey` cho mọi `palaceNameKey` của 4 tầng |
| Integration | `POST /charts/:id/horoscope` body `{ asOf, scopes: ['decadal','yearly','monthly','daily'] }` trả `horoscopeFrameSchema` đầy đủ; ownership + 401/403 path |
| E2E | mở lá số → panel hiển thị 10 chip đại vận, đại vận chứa năm hiện tại preselected → click đại vận khác → 12 chip lưu niên render → click lưu niên → 12 chip lưu nguyệt → click lưu nguyệt → 28–31 chip lưu nhật → bàn 12 cung tô 4 màu khác nhau cho 4 cung Mệnh vận |
| Platform | `pnpm -F @ziweiai/web check` + `pnpm -F @ziweiai/web test` xanh; `pnpm lint` xanh; CJK scan trên build/ giữ 0 |
| Release | — |

## Harness Delta

Lane high-risk: **chạm contract + UX state machine + bất biến CJK + đường tốn API**.

- Bất biến CJK: chip hiển thị tên cung qua `translateZiweiKey` (fail-fast). Bổ sung
  case test: snapshot vận hạn chứa `palaceNameKey` lạ ⇒ throw, không silent fallback.
- Reset semantics: chọn tầng cao reset tầng thấp (giống taibu reducer). Lock bằng
  unit test trên reducer thuần — KHÔNG qua component.
- Cost: cache theo `['horoscope', chartId, asOf, scopesKey]`, `staleTime: Infinity`
  (vận hạn deterministic). Prefetch lưu niên/lưu nguyệt khi đại vận đổi (nếu API
  cho phép gộp `scopes`); nếu không → debounce 150ms khi user lướt chip nhanh.
- Stop condition: nếu phát hiện endpoint US-014 không trả đủ 4 tầng cùng 1 call,
  pause → backlog → decision (xem `0011`); KHÔNG tự thêm endpoint mới.

## Evidence

(điền sau khi implement)
