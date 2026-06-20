# Spec — Rút gọn BirthForm cho bản Việt Nam

> Change-request (intake #29). KHÔNG ghi đè `SPEC.md` gốc. Spec này chỉ phủ phần
> `apps/web` form nhập thông tin sinh. Lane: normal.

## 1. Mục tiêu

Giảm số trường người dùng phải nhập ở `BirthForm` cho bản Việt Nam: ẩn nhóm
toạ độ + múi giờ + ô nơi sinh, mặc định Việt Nam, và thay 3 ô số ngày/tháng/năm
bằng dropdown dễ chọn — mà **không** làm lá số rơi vào `level: 'blocked'`.

### Người dùng đích
Người dùng VN tạo lá số; sinh trong nước là mặc định. Sinh ngoài VN là trường
hợp hiếm, đẩy xuống mục "Nâng cao" tuỳ chọn mở.

## 2. Bối cảnh kỹ thuật (vì sao trường nào cần)

- Engine `normalizeBirthInput` (`packages/astro-engine`) chỉ dùng `timezone` để
  quy giờ sinh → mốc UTC (`Temporal.ZonedDateTime` → `.toInstant()`).
- `latitude`/`longitude` **hiện chưa được dùng** để tính: `trueSolarTime.status`
  đang `'deferred'`. Toạ độ chỉ là metadata + thoả schema.
- `manualCoordinatesSchema` (`packages/contracts`) bắt buộc `latitude` +
  `longitude` + `timezone` (không nullable). `place.manual = null` → cờ
  `PLACE_UNRESOLVED` → `level: 'blocked'` → `blocksExactReading: true`.
- Kết luận: để không `blocked` mà KHÔNG đụng contract (high-risk), web phải gửi
  `place.manual` với toạ độ mặc định VN. → **Hướng A: hardcode mặc định ở web**.

## 3. Phạm vi & quyết định đã chốt

| Hạng mục | Quyết định | Lý do |
|---|---|---|
| Toạ độ + múi giờ | Ẩn hẳn khỏi form (không có mục "Nâng cao"); mặc định `Asia/Ho_Chi_Minh` + toạ độ HCMC `(10.8231, 106.6297)` điền sẵn trong draft | Engine chưa dùng toạ độ; bản VN không cần nhập. Khi làm geocoding sẽ mở lại (decision 0015 Follow-Up) |
| Ô "Nơi sinh" | Ẩn; gắn nhãn cố định `"Việt Nam"` | Bản VN không cần chọn quốc gia |
| Picker ngày sinh | Dropdown Ngày (1–31) / Tháng (1–12) / Năm | Dễ bấm mobile; chạy cho cả Dương & Âm lịch |

### Ngoài phạm vi (KHÔNG làm)
- KHÔNG đổi `manualCoordinatesSchema` / contract / backend (sẽ là high-risk +
  cần decision riêng).
- KHÔNG bỏ `place.manual` (sẽ gây `blocked`).
- KHÔNG geocoding theo địa điểm thực (việc tương lai; mặc định HCMC chỉ là mồi).
- KHÔNG đổi luồng giờ sinh (known/unknown), giới tính, hệ lá số, lịch nhuận.

## 4. Hằng số mặc định VN (thêm vào `birth-profile-draft.ts`)

```ts
// Toạ độ trung tâm TP.HCM — giá trị mồi để thoả manualCoordinatesSchema và
// tránh level 'blocked'. Engine CHƯA dùng toạ độ (trueSolarTime deferred), nên
// đây không ảnh hưởng kết quả; chỉ timezone tác động (quy giờ → UTC).
const VN_DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';
const VN_DEFAULT_LATITUDE = '10.8231';
const VN_DEFAULT_LONGITUDE = '106.6297';
const VN_DEFAULT_PLACE_LABEL = 'Việt Nam';
```

`createBirthFormDraft` điền sẵn các giá trị này thay vì chuỗi rỗng.

## 5. Tiêu chí chấp nhận (Acceptance Criteria)

1. **AC-1 — Form gọn mặc định:** Khi mở form, KHÔNG thấy ô nơi sinh, vĩ độ,
   kinh độ, múi giờ. Thay vào đó có nút/disclosure "Nâng cao" (đóng sẵn).
2. **AC-2 — Submit không nhập toạ độ:** Người dùng chỉ nhập ngày/giờ/giới tính
   rồi "Lập lá số" → request gửi `place.manual` đầy đủ (timezone + toạ độ VN),
   `place.label = "Việt Nam"`, và lá số KHÔNG `blocked` vì lý do địa điểm.
3. **AC-3 — Mục Nâng cao:** Mở "Nâng cao" hiện lại múi giờ + vĩ độ + kinh độ,
   điền sẵn mặc định VN, cho phép chỉnh tay (giữ validate cũ). Đóng lại vẫn dùng
   giá trị đã chỉnh.
4. **AC-4 — Dropdown ngày sinh:** Ngày/Tháng/Năm là `<select>` (Ngày 1–31,
   Tháng 1–12, Năm từ **1900 → 2026 (năm hiện tại), xếp giảm dần** để năm gần
   đây nằm đầu danh sách). Chọn xong submit ra đúng `date.year/month/day`. Chạy
   cho cả Dương & Âm lịch (kể cả tháng nhuận).
5. **AC-5 — Bất biến ngôn ngữ:** Mọi nhãn tiếng Việt; không lọt ký tự Han
   (`\p{Script=Han}`). Nhãn "Việt Nam" là tiếng Việt hợp lệ.
6. **AC-6 — Không hồi quy validate:** `validateBirthFormDraft` vẫn báo lỗi đúng
   khi toạ độ/múi giờ bị xoá rỗng trong mục Nâng cao.

## 6. Cấu trúc thay đổi (file dự kiến)

- `apps/web/src/lib/features/birth-profile/birth-profile-draft.ts` — thêm hằng
  số mặc định VN; `createBirthFormDraft` điền sẵn.
- `apps/web/src/lib/features/dashboard/BirthForm.svelte` — ẩn nơi sinh; nhóm
  toạ độ/múi giờ vào `<details>`/disclosure "Nâng cao"; đổi 3 ô number ngày sinh
  → `SelectField` (hoặc component dropdown ngày mới nếu cần).
- `apps/web/src/lib/i18n/vi.ts` — thêm khoá: `advancedSection`,
  `vnDefaultPlaceLabel`(="Việt Nam") nếu cần; có thể bỏ `locationPlaceholder`.
- Tests:
  - `birth-profile-draft.test.ts` — cập nhật default draft + thêm test mặc định
    VN sinh ra request hợp lệ, không `blocked`.
  - (nếu tách component picker) test render dropdown.

## 7. Chiến lược kiểm thử

- **Unit (Vitest):** `pnpm -F @ziweiai/web test` — draft mặc định VN →
  `buildCreateChartRequest` ra `place.manual` đủ field; validate vẫn bắt lỗi khi
  xoá toạ độ.
- **Typecheck:** `pnpm -F @ziweiai/web check` (0 lỗi).
- **Lint:** `pnpm lint` (max-warnings=0; gồm guard no-restricted-imports + Han).
- **Smoke trình duyệt (thủ công/Playwright):** mở dashboard → form gọn → submit
  → vào `/charts/:id` không có cảnh báo địa điểm.
- Cập nhật proof matrix qua `story update` chỉ với số thật đã chạy xanh.

## 8. Ranh giới (Boundaries)

- **Luôn làm:** giữ web chỉ import `@ziweiai/contracts`; nhãn tiếng Việt;
  immutable `setField`; lỗi field chỉ hiện sau submit.
- **Hỏi trước:** bất kỳ thay đổi nào chạm `manualCoordinatesSchema`, backend,
  hay nới lỏng validate.
- **Không bao giờ:** import core/astro-engine vào web; bỏ `place.manual`; tắt
  test Han; commit `.env`.
