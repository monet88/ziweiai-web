# 0012 Sáu hệ luận giải mới (Hợp Hôn / Manh Phái / Tarot / MBTI / Xem Tướng / Xem Tay) — kiến trúc đa-input + chartSystem mở rộng + storage upload ảnh

Date: 2026-06-17

## Status

Accepted

## Context

Backlog #17 yêu cầu port 6 hệ mới từ `.ref/taibu` (xem
`.ref/taibu/src/app/api/{hepan,mangpai,face,palm,tarot,mbti,annual-report}/route.ts`):

| Hệ | Đầu vào | Tính chất | Khuôn |
|---|---|---|---|
| Hợp Hôn (`hepan`) | 2 lá số ziwei (chính + bạn đời) | tính bằng `iztro`, không LLM bắt buộc | "lập + AI" giống ziwei |
| Manh Phái (`mangpai`) | birth-input (giống bazi) | tính bazi mở rộng + LLM | "lập + AI" |
| Tarot (`tarot`) | seed/random + câu hỏi | rút bài + LLM | "lập + AI" |
| MBTI (`mbti`) | 60+ câu trắc nghiệm | scoring + LLM | "lập + AI" |
| Xem Tướng (`face`) | 1 ảnh chân dung | LLM **vision** + lưu trữ ảnh | "upload + AI vision" |
| Xem Tay (`palm`) | 1 ảnh lòng bàn tay | LLM **vision** + lưu trữ ảnh | "upload + AI vision" |

Khảo sát `packages/contracts/src/chart/chart-system.ts` ⇒ enum hiện chốt 6 hệ
`zi-wei-dou-shu | ba-zi | mei-hua-yi-shu | liu-yao | da-liu-ren | qi-men-dun-jia`,
KHÔNG có `hepan/mangpai/tarot/mbti/face/palm`. Pattern hiện có (US-007 +
`POST /charts`) **giả định 1 birth-input duy nhất** + chart engine deterministic
(không vision, không upload). Áp đè 6 hệ mới lên cùng endpoint sẽ phình
`birthInputSchema` (đã đa hình theo `chartSystem`) và lẫn các hệ "không cần birth"
(tarot/mbti) hoặc "cần ảnh" (face/palm).

Boundary [[0007-web-server-boundary]] vẫn áp: web không tự tính, chỉ gọi API.
Storage upload ảnh chưa tồn tại (`pnpm why @supabase/storage-js` = không có).

## Decision

- **6 hệ = 6 epic con triển khai TUẦN TỰ** (đặt thứ tự ưu tiên theo độ phức tạp
  hạ tầng + giá trị người dùng): Tarot (US-017a) → MBTI (US-017b) → Hợp Hôn
  (US-017c) → Manh Phái (US-017d) → Xem Tướng (US-017e) → Xem Tay (US-017f). Story
  packet US-017 mô tả TỔNG, không tự lock ngày triển khai từng tầng.
- Mở rộng `chartSystemSchema` thành 12 giá trị (6 hiện có + 6 mới). Đây là **mở
  rộng thuần thêm**, không xoá / đổi nghĩa giá trị nào — backward-compatible với
  snapshot legacy.
- **Đa hình endpoint** thay vì nhồi `POST /charts` thành catch-all:
  - `POST /charts` GIỮ NGUYÊN cho 7 hệ "1 birth-input" (6 hiện có + Manh Phái).
  - `POST /pairings` cho Hợp Hôn (`hepan`) — body `{ primary: birthInputSchema,
    partner: birthInputSchema }`. Snapshot output: 2 lá số ghép, có
    `chartSystem='hepan'`.
  - `POST /quizzes/mbti` cho MBTI — body `{ answers: [...] }` (60 câu); response
    là `MbtiResultSchema` (4 trục + diễn giải).
  - `POST /draws/tarot` cho Tarot — body `{ question, seed?, spread:
    'three-card'|'celtic-cross' }`; response là `TarotDrawSchema` (cards + LLM).
  - `POST /vision/face`, `POST /vision/palm` cho 2 hệ ảnh — body
    `multipart/form-data` (1 ảnh ≤ 4MB) + `{ question? }`. Response là
    `VisionAnalysisSchema`.
- **Storage ảnh**: dùng Supabase Storage bucket riêng `vision-uploads` (private,
  RLS theo `owner_user_id`). Ảnh xoá tự động sau 7 ngày qua scheduled function
  (chạy `pg_cron` của Supabase) — chỉ giữ kết quả LLM, không giữ ảnh gốc lâu dài
  (giảm rủi ro PII/sinh trắc + dung lượng). Ràng buộc: anon-user (decision 0009)
  KHÔNG được dùng face/palm (tránh ảnh vô danh không thu hồi được + lạm dụng
  vision tốn token); guard server: `assertEmailIdentityRequired(user)`.
- **Quota riêng cho hệ AI vision**: thêm `API_VISION_REQUESTS_PER_DAY_PER_USER`
  vào `apps/api/src/config/env.ts` — mặc định bảo thủ (`5`), gate fail-closed
  khi vượt. Token cost LLM vision cao hơn text 5–10× → quota tách bạch.
- **Cờ feature-flag tách hệ** trong `apps/api/src/config/env.ts`: 6 cờ
  `EXTENDED_SYSTEM_<HEPAN|MANGPAI|TAROT|MBTI|FACE|PALM>_ENABLED` (mặc định
  `false`). Chỉ bật từng cờ khi epic con tương ứng đạt acceptance. Tất cả cờ
  được parse bằng `z.stringbool()` (giống decision 0010, tránh bug `Boolean`).
- **Gate AI gắn vào [[0010-premium-ai-entitlement-flag]]**: 6 hệ này gọi LLM,
  PHẢI đi qua cùng `assertCanUseAiExplanation` ở service layer — khi tích hợp
  thanh toán, mọi hệ AI đều bị gate đồng nhất.
- **Web boundary nguyên vẹn**: web nhập kết quả qua `@ziweiai/contracts`
  (thêm `mbti-result.ts`, `tarot-draw.ts`, `vision-analysis.ts`,
  `pairing-snapshot.ts`); KHÔNG import core/astro-engine/iztro.

## Alternatives Considered

1. **Một endpoint vạn năng `POST /charts` cho 12 hệ** — `birthInputSchema` vốn
   đã rẽ nhánh theo `chartSystem`, thêm 6 nữa làm schema phình + sai nghĩa
   (tarot/mbti không có birth, face/palm là multipart). Loại.
2. **Lưu ảnh dài hạn** — rủi ro PII (chân dung/khuôn tay = sinh trắc) + dung
   lượng + GDPR. 7 ngày auto-delete đủ cho UX (xem lại lần gần nhất). Loại.
3. **Cho anon-user dùng face/palm** — vision tốn token gấp 5–10× text +
   anon-user reset trắng quota dễ dàng (mở incognito). Quota daily-per-IP của
   decision 0009 là in-memory + sẽ bền theo Redis (US-013) — vẫn không đủ rào.
   Bắt buộc email identity là rào ổn nhất. Loại.
4. **Đặt 6 hệ thành 6 chartSystem trên cùng `POST /charts` + multipart upcast cho
   face/palm** — controller phình + lẫn nhiều mối quan tâm + khó test. Tách
   endpoint dễ kiểm thử + dễ rate-limit riêng.

## Consequences

Positive:

- Mở rộng có quy luật: mỗi hệ AI có flag riêng + quota riêng (vision) + endpoint
  riêng → tắt nhanh khi sự cố.
- Web boundary nguyên vẹn, contracts là điểm duy nhất cập nhật để 12 hệ chạy
  đồng bộ.
- Khi tích hợp thanh toán thật (sau decision 0010 follow-up), 1 chỗ gate cho cả
  12 hệ AI.

Tradeoffs:

- 4 endpoint mới + 1 bucket Storage mới + 1 scheduled cleanup → mặt API + ops
  phình. Phải thêm test integration cho mỗi endpoint trước khi bật cờ.
- Auto-delete ảnh sau 7 ngày = user phải lưu kết quả lại nếu cần xem lâu dài —
  ghi rõ trên UI Việt ngữ.
- 6 epic con tăng backlog story đáng kể, cần ưu tiên và sẵn sàng cắt phạm vi
  (ví dụ chỉ làm 4 hệ "không cần vision" trước).

## Follow-Up

- US-017 (parent): `docs/stories/epics/E17-extended-divination-systems/US-017-extended-divination-systems.md`
  định nghĩa contract chung + thứ tự 6 epic con.
- 6 epic con (US-017a..f): mỗi hệ 1 story packet riêng khi đến lượt triển khai.
- Khi bật `FACE/PALM`, cần test PII compliance trước (audit Storage policy +
  scheduled cleanup chạy thật).
