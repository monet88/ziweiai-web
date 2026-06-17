# US-017 Sáu hệ luận giải mới (Hợp Hôn / Manh Phái / Tarot / MBTI / Xem Tướng / Xem Tay) — dựng khung kiến trúc đa-endpoint + chartSystem mở rộng

## Status

planned

## Lane

high-risk

## Product Contract

Mở rộng `ziweiai` từ 6 hệ hiện có lên 12 hệ luận giải bằng cách port nhóm A từ
`.ref/taibu`: Hợp Hôn (`hepan`), Manh Phái (`mangpai`), Tarot (`tarot`), MBTI (`mbti`),
Xem Tướng (`face`), Xem Tay (`palm`). Story TỔNG này KHÔNG bật cả 6 hệ trong một
lần đẩy — nó chỉ dựng **khung kiến trúc + contract chung** để 6 epic con
(US-017a..f) cắm vào tuần tự, mỗi epic con là 1 PR riêng, mỗi cờ feature
riêng.

Khung gồm: `chartSystemSchema` mở rộng 12 giá trị, 4 schema kết quả mới trong
`@ziweiai/contracts` (`mbti-result`, `tarot-draw`, `vision-analysis`,
`pairing-snapshot`), 6 cờ env tách hệ (mặc định `false`), quota AI vision riêng,
Storage bucket `vision-uploads` + RLS + scheduled cleanup, và pattern endpoint
đa hình (`/pairings`, `/quizzes/mbti`, `/draws/tarot`, `/vision/{face|palm}`).

## Relevant Product Docs

- `docs/decisions/0012-extended-divination-systems.md` (quyết định gốc — chốt 4 endpoint nhóm + Storage + 6 cờ)
- `docs/decisions/0010-premium-ai-entitlement-flag.md` (gate AI dùng chung cho 12 hệ)
- `docs/decisions/0009-anonymous-auth-strategy.md` (face/palm CHẶN anon; bắt buộc email identity)
- `docs/decisions/0007-web-server-boundary.md` (web không tự tính, chỉ gọi API qua contracts)
- `docs/product/api-contract.md` (sẽ được mở rộng ở P4)
- `docs/product/invariants.md` (§2 ngôn ngữ — 6 hệ mới giữ nhãn Việt, không rò Hán)

## Acceptance Criteria

Story TỔNG đạt khi 4 điều kiện kiến trúc thoả mãn (KHÔNG yêu cầu cả 6 hệ chạy
luôn — đó là phạm vi 6 epic con):

- **Contract foundation (P0)**: `chartSystemSchema` chứa đủ 12 giá trị (6 cũ +
  `hepan|mangpai|tarot|mbti|face|palm`); thêm 4 file schema mới
  `pairing-snapshot.ts`, `mbti-result.ts`, `tarot-draw.ts`, `vision-analysis.ts`
  trong `packages/contracts/src/chart/` (hoặc thư mục con phù hợp); export qua
  `packages/contracts/src/index.ts`. Snapshot legacy (6 hệ cũ) parse OK
  (backward-compatible), không xoá / đổi nghĩa giá trị nào.
- **Env + 6 cờ + quota vision (P1)**: `apps/api/src/config/env.ts` thêm 6 cờ
  `EXTENDED_SYSTEM_<HEPAN|MANGPAI|TAROT|MBTI|FACE|PALM>_ENABLED` (mặc định
  `false`, parse `z.stringbool()`) và `API_VISION_REQUESTS_PER_DAY_PER_USER`
  (mặc định `5`). Test env + test boot xanh; cờ tắt = endpoint trả 404 hoặc
  phù hợp (xác định trong design).
- **Storage bucket + cleanup (P2)**: migration tạo bucket `vision-uploads`
  (private), RLS theo `owner_user_id`, và scheduled cleanup `pg_cron` xoá ảnh
  > 7 ngày. Bucket KHÔNG public. Test integration upload/download chạy được
  (dù cả 2 cờ FACE/PALM còn `false`).
- **Khung được chứng minh bằng 1 epic con (P3a — Tarot)**: epic Tarot (US-017a)
  merged vào main, cờ TAROT có thể bật trong test env và `/draws/tarot` trả
  `TarotDrawSchema` hợp lệ. Tarot được chọn vì không cần Storage / vision —
  chứng minh khung endpoint mới + contract mới mà không phụ thuộc P2.
- 5 epic con còn lại (US-017b..f) tracked trong execplan + harness backlog,
  KHÔNG yêu cầu hoàn thành trong phạm vi US-017.
- 6 cờ giữ `false` ở prod sau khi merge — bật từng cờ là quyết định triển khai
  riêng của từng epic con.

## Design Notes

Xem `design.md` cùng thư mục để biết chi tiết. Tóm tắt:

- **Đa hình endpoint**: KHÔNG nhồi 12 hệ vào `POST /charts`. Giữ `POST /charts`
  cho 7 hệ "1 birth-input" (6 cũ + Manh Phái); thêm 4 endpoint mới cho 5 hệ
  còn lại (Hợp Hôn / MBTI / Tarot / Xem Tướng / Xem Tay).
- **Mỗi hệ = 1 service module** dưới `apps/api/src/modules/` (`pairings/`,
  `quizzes-mbti/`, `draws-tarot/`, `vision-face/`, `vision-palm/`,
  `mangpai/`); KHÔNG nhồi logic vào `charts/` hoặc `explanations/`.
- **AI gate dùng chung**: cả 6 hệ mới (đều gọi LLM) chạy qua
  `assertCanUseAiExplanation` — khi billing thật bật, 12 hệ AI bị gate đồng
  nhất.
- **Web boundary nguyên vẹn**: web tiêu thụ kết quả qua contracts; KHÔNG import
  core/astro-engine/iztro. UI từng hệ là phạm vi epic con tương ứng.
- **Anon-user bị chặn cho face/palm** (decision 0009 + 0012): guard server
  `assertEmailIdentityRequired(user)` ở 2 endpoint vision; UI ẩn nút khi
  `isAnonymous`.

## Validation

`scripts\bin\harness-cli.exe story update --id US-017 --unit 1 --integration 1 --e2e 1 --platform 1`

| Layer | Expected proof |
| --- | --- |
| Unit | `chartSystemSchema` parse 12 giá trị + reject unknown; 4 schema mới có test parse OK + reject; env parse 6 cờ + quota vision; Tarot service rút bài deterministic theo seed |
| Integration | `POST /draws/tarot` (cờ TAROT on) trả `TarotDrawSchema`; cờ TAROT off → 404/disabled; Storage bucket tạo OK (P2 migration chạy được trên Supabase local); RLS chặn cross-user select |
| E2E | Tarot UI: nhập câu hỏi → rút bài → hiển thị diễn giải Việt; cờ TAROT off → CTA ẩn |
| Platform | `pnpm -F @ziweiai/api test` + `pnpm -F @ziweiai/web check` xanh; `pnpm why zod` vẫn đơn nhất |
| Release | 6 cờ giữ `false` ở prod; chỉ TAROT có thể bật trong stg để smoke |

## Harness Delta

Lane high-risk: chạm public contract (`chartSystemSchema` + 4 schema mới +
`apiErrorCodeSchema` có thể thêm mã `IDENTITY_REQUIRED` cho face/palm), đường
tiền tệ (LLM cost — vision đắt 5–10× text), PII (ảnh chân dung/khuôn tay là
sinh trắc), và mặt API phình (4 endpoint + 1 bucket + 1 cleanup job).

Bất biến phải giữ:

- Nhãn Việt cho 6 hệ mới; thêm key vào `viCopy`/`translateZiweiKey` theo cùng
  pattern fail-fast.
- `PUBLIC_*` trên web; secret LLM/Supabase chỉ ở `apps/api`.
- 6 cờ default `false` ở prod; mỗi epic con chỉ bật cờ tương ứng.
- Web boundary: KHÔNG import core/astro-engine/iztro từ `apps/web`.

Rủi ro:

- Quên tắt 1 cờ ở prod → 1 hệ chưa thử lửa rò ra user → cost LLM tăng đột biến.
  Mitigate: gate fail-CLOSED khi cờ off (404/disabled), có log cảnh báo khi cờ
  on ở prod.
- Storage bucket cấu hình sai RLS → ảnh chéo giữa user. Mitigate: integration
  test cross-user select bắt buộc xanh trước khi merge P2.
- Auto-delete 7 ngày chưa chạy → bucket phình. Mitigate: P2 migration phải
  bao gồm `pg_cron` schedule + smoke test trên Supabase local.
- 6 epic con tăng backlog đáng kể; sẵn sàng cắt phạm vi (chỉ 4 hệ
  không-vision trước) nếu PII/Storage chưa sẵn sàng.

## Evidence

- Decision `0012` accepted (2026-06-17).
- 6 epic con (US-017a..f) tracked trong `execplan.md`; mỗi epic 1 packet riêng
  khi đến lượt.
- P0+P1+P2 merged + Tarot (P3a) merged = story TỔNG đóng.
