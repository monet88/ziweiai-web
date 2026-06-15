# Post-mortem: lịch sử lá số không thấy item mới khi tạo liên tiếp nhiều hệ

## Summary

Sau khi tạo lá số mới, luồng `createChart` không invalidate query `['history', ...]`. Vì
`QueryClient` mặc định `staleTime: 30_000`, người dùng quay lại `/history` (hoặc sidebar
dashboard) trong vòng 30s nhận **cache cũ** chưa chứa lá số vừa tạo. Lộ ra khi E2E US-007
tạo lá số liên tiếp 5 hệ: vòng 1 (Bát Tự) pass vì `/history` chưa từng cache; vòng 2
(Mai Hoa) fail vì cache `/history` còn tươi (<30s) và thiếu item mới. Fix: gọi
`queryClient.invalidateQueries({ queryKey: ['history'] })` trong `onSuccess` của mutation
tạo lá số (`dashboard-model.svelte.ts`). US-007, owner monet88.

## Symptom

E2E `us-007-other-systems-history.spec.ts` chạy thật (backend NestJS + Supabase local +
provider AI live):

- Vòng 1 — Bát Tự: pass toàn bộ (tạo → chi tiết VN không Hán → `/history` thấy item mới).
- Vòng 2 — Mai Hoa: fail ở bước history.

```
Error: Lịch sử phải có lá số Mai Hoa Dịch Số vừa tạo
Locator: getByRole('button').filter({ hasText: 'Mai Hoa Dịch Số' }).first()
Expected: visible — Timeout: 15000ms — element(s) not found
```

## Root cause

`createAppQueryClient` (`src/lib/query-client.ts`) đặt `staleTime: 30_000` cho mọi query,
gồm `['history', token, limit]` dùng ở `HistoryList.svelte` và `DashboardSidebar.svelte`.

Mutation tạo lá số ở `createDashboardModel` (`src/lib/features/dashboard/dashboard-model.svelte.ts`)
trong `onSuccess` chỉ `goto(/charts/<id>)` — **không** invalidate query `history`. Khi
người dùng mở lại `/history` trong khoảng staleTime, TanStack Query trả thẳng cache cũ,
không refetch. Cache đó được nạp ở lần mở `/history` trước (vòng 1) nên chỉ chứa các lá số
tới thời điểm đó, thiếu lá số tạo ở vòng 2.

## Why it produced the symptom

Bug nằm ở luồng tạo lá số (mutation onSuccess), nhưng triệu chứng hiện ở trang `/history`
mấy bước sau. Điều kiện kích hoạt là **mở `/history` lần hai trong vòng 30s sau khi tạo lá
số mới** — đúng kịch bản test lặp 5 hệ liên tiếp. Vòng 1 không dính vì query `history`
chưa từng được cache (lần fetch đầu luôn tươi từ network), nên item Bát Tự xuất hiện. Từ
vòng 2 trở đi cache đã tồn tại và còn trong staleTime → trả cache cũ → item mới không hiện.
Luồng một-lá-số đơn lẻ (US-005/US-006) không lộ bug vì người dùng hiếm khi quay lại lịch sử
trong 30s, và mỗi test trước đó chỉ tạo trong một phiên.

## Fix

`dashboard-model.svelte.ts`:
- Thêm option bắt buộc `queryClient: QueryClient` vào `DashboardModelOptions`.
- Trong `onSuccess`: `await queryClient.invalidateQueries({ queryKey: ['history'] })` trước
  khi điều hướng. Invalidate theo prefix `['history']` phủ mọi biến thể limit/token.

Hai nơi khởi tạo model truyền `queryClient` qua `useQueryClient()`:
- `src/routes/(app)/+page.svelte` (dashboard — đã có sẵn `useQueryClient`).
- `src/lib/features/dashboard/SystemChartScreen.svelte` (wrapper 5 hệ US-007).

Fix tấn công đúng gốc (cache lỗi thời sau ghi) thay vì hạ `staleTime` hay tắt cache — giữ
nguyên lợi ích cache cho điều hướng thông thường, chỉ ép refetch khi dữ liệu thực sự đổi.

## How it was found

Repro xác định ngay từ E2E US-007 lặp 5 hệ một worker (`fullyParallel: false`). Fail luôn
ở vòng 2, không flaky. Giả thuyết đầu: backend chưa ghi kịp lá số — loại, vì vòng 1 cùng
luồng thấy item ngay và chi tiết `/charts/<id>` vòng 2 mở được (record tồn tại). Giả thuyết
hai: cache `/history` lỗi thời — xác nhận bằng cách đọc `query-client.ts` (`staleTime: 30_000`)
+ `dashboard-model` onSuccess (không có invalidate). Khớp đúng vì sao vòng 1 pass (cache
chưa tồn tại) còn vòng 2 fail (cache tươi).

## Why it slipped through

Workload gap. Các story trước (US-005 tạo lá số, US-006 chi tiết Tử Vi) chỉ tạo một lá số
mỗi phiên và không quay lại lịch sử trong staleTime, nên đường đi "tạo → mở lại history
trong 30s" chưa từng được kích hoạt. US-007 là story đầu tiên dựng E2E tạo liên tiếp nhiều
hệ + kiểm tra history mỗi vòng, nên là workload đầu tiên chạm gate này.

## Validation

- E2E `us-007-other-systems-history.spec.ts` chạy thật (api + web preview + Supabase local +
  provider AI live): **pass 5/5 hệ** (Bát Tự, Mai Hoa, Lục Hào, Đại Lục Nhâm, Kỳ Môn),
  gồm bước `/history` thấy item mới mỗi vòng và quét `\p{Script=Han}` = 0 ở vùng chi tiết.
- Unit: 103 test xanh (`vitest run`), gồm `no-han-characters.test.ts` toàn hệ.
- `pnpm check` (svelte-check) 0 error 0 warning; `pnpm lint` sạch; `pnpm build` xanh.
- Chưa kiểm chứng riêng hành vi invalidate ở mức unit (chỉ qua E2E) — xem action item.

## Action items

- Unit test cho invalidate: mock `QueryClient`, xác nhận `onSuccess` gọi
  `invalidateQueries({ queryKey: ['history'] })`. (monet88, US-007 follow-up.)
- Cân nhắc invalidate `history` ở luồng tạo luận giải (`explanation-model`) nếu nó cũng đổi
  `hasExplanation` trong danh sách lịch sử — chưa xác nhận, ghi backlog để rà sau.
