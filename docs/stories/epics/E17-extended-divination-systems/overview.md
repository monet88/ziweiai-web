# Overview

## Current Behavior

`ziweiai-web` hiện hỗ trợ 6 hệ luận giải (`chartSystemSchema`):

- `zi-wei-dou-shu` (Tử Vi Đẩu Số) — đầy đủ engine + AI
- `ba-zi`, `mei-hua-yi-shu`, `liu-yao`, `da-liu-ren`, `qi-men-dun-jia` —
  engine + AI tuỳ trạng thái US-007.

Cả 6 hệ chia sẻ chung mô hình "1 birth-input → engine deterministic → snapshot
→ luận giải AI". Endpoint `POST /charts` xử lý mọi hệ; `POST /explanations`
sinh diễn giải. Không có upload, không có vision, không có quiz, không có
ghép 2 lá số.

Web boundary (decision 0007): `apps/web` chỉ import `@ziweiai/contracts`,
KHÔNG import `core` / `astro-engine` / `iztro`. Mọi response đều `parse()` qua
schema từ `@ziweiai/contracts`.

Auth: anonymous Supabase sign-in (decision 0009) + AI gate qua cờ
`AI_EXPLANATION_FREE_FOR_ALL` (decision 0010). Anon user dùng được mọi tính
năng hiện có.

## Target Behavior

Mở rộng từ 6 → **12 hệ luận giải** bằng cách port 6 hệ nhóm A từ
`.ref/taibu`:

| Hệ | Đầu vào | Endpoint | Đặc thù |
|---|---|---|---|
| Hợp Hôn (`hepan`) | 2 birth-input | `POST /pairings` | Ghép 2 lá số ziwei |
| Manh Phái (`mangpai`) | 1 birth-input | `POST /charts` | Bazi mở rộng + LLM |
| Tarot (`tarot`) | seed + câu hỏi | `POST /draws/tarot` | Rút bài + LLM |
| MBTI (`mbti`) | mảng câu trả lời | `POST /quizzes/mbti` | Scoring + LLM |
| Xem Tướng (`face`) | 1 ảnh chân dung | `POST /vision/face` | LLM vision + Storage |
| Xem Tay (`palm`) | 1 ảnh lòng bàn tay | `POST /vision/palm` | LLM vision + Storage |

Khung kiến trúc đa-endpoint + Storage + 6 cờ feature-flag được dựng trong
US-017; 6 hệ thực thi cụ thể nằm ở 6 epic con US-017a..f (mỗi epic 1 PR riêng,
mỗi cờ riêng).

Trạng thái mong muốn sau khi US-017 đóng:

- `chartSystemSchema` chứa 12 giá trị; 4 schema kết quả mới
  (`pairing-snapshot`, `mbti-result`, `tarot-draw`, `vision-analysis`) đã có
  trong `@ziweiai/contracts`.
- 6 cờ env tách hệ (default `false`) + 1 quota vision riêng
  (`API_VISION_REQUESTS_PER_DAY_PER_USER`, default `5`) đã được apply.
- Storage bucket `vision-uploads` (private, RLS theo `owner_user_id`,
  scheduled cleanup 7 ngày) đã tồn tại trong Supabase migration.
- Tarot (US-017a) merged để chứng minh khung endpoint mới chạy thật;
  5 epic còn lại tracked riêng.

## Affected Users

- **Người dùng cuối**: sau khi từng epic con merged + cờ bật, người dùng có
  thêm hệ luận giải tương ứng trong dashboard. Trong phạm vi US-017, chỉ
  Tarot khả dụng.
- **Anon-user**: bị chặn KHÔNG dùng được Xem Tướng / Xem Tay (PII + lạm dụng
  vision). 4 hệ còn lại (Hợp Hôn, Manh Phái, Tarot, MBTI) anon-user dùng
  được như bình thường.
- **Operator**: có 6 cờ feature-flag để bật/tắt từng hệ độc lập + quota
  vision tách bạch.

## Affected Product Docs

- `docs/product/api-contract.md` — thêm 4 endpoint nhóm + 6 chartSystem mới
  (P4).
- `docs/product/invariants.md` — bổ sung quy tắc 12 hệ giữ nhãn Việt; ảnh
  vision lưu ≤ 7 ngày; anon bị chặn face/palm.
- `SPEC.md` — cập nhật roadmap: US-017 phase + sub-stories US-017a..f.
- `docs/decisions/0012-extended-divination-systems.md` — đã viết, story này
  hiện thực.

## Non-Goals

- **KHÔNG port mọi tính năng `taibu`**: chỉ luận giải cốt lõi mỗi hệ. Các
  tính năng phụ (`annual-report` của taibu, lịch sử nâng cao, share card,
  ...) nằm ngoài phạm vi.
- **KHÔNG bật 6 cờ ở prod trong story này**: chỉ TAROT có thể bật ở stg
  để smoke. 5 cờ còn lại giữ `false` cho tới khi epic con tương ứng merged.
- **KHÔNG đụng billing thật**: AI gate dùng chung cờ
  `AI_EXPLANATION_FREE_FOR_ALL` (decision 0010); billing thật là decision +
  story riêng.
- **KHÔNG đổi mô hình `POST /charts` cho 6 hệ cũ**: chỉ thêm `mangpai` vào
  endpoint hiện có. 5 endpoint mới hoàn toàn tách bạch.
- **KHÔNG sửa RLS / schema của 5 bảng cũ** (`birth_profiles`,
  `chart_snapshots`, `explanation_requests`, `explanation_results`,
  `history_views`); P2 chỉ THÊM bucket mới + bảng phụ cho vision nếu cần.
- **KHÔNG nâng cấp anon → email**: hướng dẫn user nâng cấp khi cần
  face/palm là phạm vi UI nhỏ trong epic con tương ứng (US-017e/f).
- **KHÔNG đổi pattern auth/quota hiện có**: tái sử dụng
  `SupabaseAuthGuard`, `assertCanCreateExplanation`,
  `assertCanUseAiExplanation`. Chỉ THÊM
  `assertCanUseAiVisionExplanation` (quota vision) và
  `assertEmailIdentityRequired` (chặn anon ở face/palm).
