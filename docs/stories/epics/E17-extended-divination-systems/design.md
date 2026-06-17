# Design

## Domain Model

Mở rộng từ 6 → 12 `chartSystem`. Thêm 6 giá trị enum mới — KHÔNG xoá / đổi
nghĩa giá trị cũ:

```
chartSystems = [
  // 6 giá trị hiện có (giữ nguyên thứ tự — không reorder để snapshot legacy
  // còn parse OK):
  'zi-wei-dou-shu',
  'ba-zi',
  'mei-hua-yi-shu',
  'liu-yao',
  'da-liu-ren',
  'qi-men-dun-jia',
  // 6 giá trị mới (decision 0012):
  'hepan',
  'mangpai',
  'tarot',
  'mbti',
  'face',
  'palm',
]
```

Mỗi hệ mới có domain shape riêng (KHÔNG ép chung `chartSnapshotSchema`):

- `pairingSnapshotSchema` — Hợp Hôn: 2 ziwei snapshot lồng vào (primary +
  partner) + tóm tắt ghép (compatibility scores theo cung).
- `mbtiResultSchema` — kết quả MBTI: 4 trục (E/I, S/N, T/F, J/P) — mỗi trục
  có điểm tuyến tính + nhãn 4 chữ + diễn giải.
- `tarotDrawSchema` — bộ bài rút: spread (`three-card`/`celtic-cross`),
  cards[] (id + reversed?), question, seed, narrative.
- `visionAnalysisSchema` — chung cho face/palm: `kind: 'face'|'palm'`,
  `imagePath` (Storage path), narrative + traits[] (cấu trúc traits tự
  do JSON đơn giản, không cứng hoá).

Manh Phái (`mangpai`) tái dùng `chartSnapshotSchema` hiện có (vì input vẫn
là 1 birth-input + output là snapshot dạng cung/sao mở rộng); chỉ thêm
`chartSystem='mangpai'`.

## Application Flow

Mỗi hệ = 1 service module riêng dưới `apps/api/src/modules/`:

```
apps/api/src/modules/
├── charts/                # GIỮ NGUYÊN — phục vụ 6 hệ cũ + thêm `mangpai`
├── explanations/          # GIỮ NGUYÊN — gate AI dùng chung
├── pairings/              # MỚI — Hợp Hôn (US-017c)
│   ├── pairings.controller.ts   # POST /pairings
│   ├── pairings.service.ts      # ghép 2 ziwei chart qua iztro
│   └── pairings.module.ts
├── quizzes-mbti/          # MỚI — MBTI (US-017b)
│   ├── quizzes-mbti.controller.ts  # POST /quizzes/mbti
│   ├── quizzes-mbti.service.ts     # scoring + LLM diễn giải
│   ├── mbti-questions.ts           # bộ 60 câu (i18n Việt)
│   └── quizzes-mbti.module.ts
├── draws-tarot/           # MỚI — Tarot (US-017a)
│   ├── draws-tarot.controller.ts   # POST /draws/tarot
│   ├── draws-tarot.service.ts      # rút bài deterministic theo seed + LLM
│   ├── tarot-deck.ts               # 78 lá Major+Minor (i18n Việt)
│   └── draws-tarot.module.ts
├── vision-face/           # MỚI — Xem Tướng (US-017e)
│   ├── vision-face.controller.ts   # POST /vision/face (multipart)
│   ├── vision-face.service.ts      # upload Storage + Vision LLM
│   └── vision-face.module.ts
└── vision-palm/           # MỚI — Xem Tay (US-017f)
    ├── ...                          # tương tự vision-face
```

Pattern chung mỗi service mới (theo trật tự bắt buộc):

1. `SupabaseAuthGuard` xác thực user (anon hoặc email).
2. `assertEmailIdentityRequired(user)` (CHỈ ở face/palm — chặn anon).
3. Đọc cờ env tương ứng — nếu `false` → ném `404 NOT_FOUND` hoặc
   `503 FEATURE_DISABLED` (xác định trong P0/P1; ưu tiên 404 để không lộ
   hệ chưa bật).
4. Validate input qua schema từ `@ziweiai/contracts`.
5. `assertCanCreateExplanation(user)` — quota text dùng chung; với vision
   thay bằng `assertCanUseAiVisionExplanation(user)`.
6. `assertCanUseAiExplanation(user)` — gate AI premium (decision 0010).
7. Tính toán deterministic (rút bài / scoring / ghép lá số) → upload
   Storage (chỉ vision).
8. Gọi LLM (text hoặc vision tuỳ hệ).
9. Lưu kết quả + trả response qua schema.

## Interface Contract

### Mở rộng schema

`packages/contracts/src/chart/chart-system.ts`:

- `chartSystems` thêm 6 giá trị: `hepan|mangpai|tarot|mbti|face|palm`.
- `implementedChartSystems` chỉ thêm `mangpai` ngay khi epic con tương ứng
  merged (các hệ còn lại để ngoài cho tới khi epic con đẩy bật cờ).

### File schema mới (P0)

```
packages/contracts/src/chart/
├── pairing-snapshot.ts    # pairingSnapshotSchema (Hợp Hôn)
├── tarot-draw.ts          # tarotDrawSchema (Tarot)
├── vision-analysis.ts     # visionAnalysisSchema (Face + Palm dùng chung)
└── ...
packages/contracts/src/quizzes/    # MỚI — namespace cho hệ không phải chart
└── mbti-result.ts          # mbtiResultSchema, mbtiAnswerSchema
```

(Hoặc gom hết vào `chart/` nếu phù hợp — quyết định ở P0 dựa trên file
hiện có; ưu tiên cấu trúc đã có.)

Mỗi file phải:

- Export schema + type inferred (`z.infer`).
- Có test parse OK + reject (theo pattern `chart-contracts.test.ts`).
- Export qua `packages/contracts/src/index.ts`.

### 4 endpoint nhóm mới

| Endpoint | Body | Response | Auth | Cờ |
|---|---|---|---|---|
| `POST /pairings` | `{ primary, partner: birthInputSchema }` | `pairingSnapshotSchema` | Bearer | `EXTENDED_SYSTEM_HEPAN_ENABLED` |
| `POST /quizzes/mbti` | `{ answers: mbtiAnswer[] }` | `mbtiResultSchema` | Bearer | `EXTENDED_SYSTEM_MBTI_ENABLED` |
| `POST /draws/tarot` | `{ question, seed?, spread }` | `tarotDrawSchema` | Bearer | `EXTENDED_SYSTEM_TAROT_ENABLED` |
| `POST /vision/face` | multipart `{ image, question? }` | `visionAnalysisSchema` | Bearer + email | `EXTENDED_SYSTEM_FACE_ENABLED` |
| `POST /vision/palm` | multipart `{ image, question? }` | `visionAnalysisSchema` | Bearer + email | `EXTENDED_SYSTEM_PALM_ENABLED` |

`POST /charts` GIỮ NGUYÊN, chỉ thêm xử lý `chartSystem='mangpai'` (không
endpoint mới) — gate qua `EXTENDED_SYSTEM_MANGPAI_ENABLED`.

### Mã lỗi mới

`packages/contracts/src/api/error.ts` (`apiErrorCodeSchema`) — bổ sung:

- `IDENTITY_REQUIRED` (403) — anon-user chạm face/palm.
- `FEATURE_DISABLED` (404 hoặc 503 — chốt P1) — cờ tương ứng off.
- `VISION_QUOTA_EXCEEDED` (429) — vượt quota vision.

Web parse mọi lỗi qua contracts → các mã mới phải có message Việt.

## Data Model

### Migration mới (P2)

```sql
-- 000002_vision-uploads-bucket.up.sql
-- Storage bucket private cho ảnh face/palm
insert into storage.buckets (id, name, public)
values ('vision-uploads', 'vision-uploads', false)
on conflict do nothing;

-- RLS: chỉ owner đọc/ghi ảnh của mình
create policy "vision_uploads_owner_select" on storage.objects
  for select using (
    bucket_id = 'vision-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "vision_uploads_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'vision-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "vision_uploads_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'vision-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- pg_cron: xoá ảnh > 7 ngày mỗi đêm 03:00 UTC
select cron.schedule(
  'vision-uploads-cleanup',
  '0 3 * * *',
  $$ delete from storage.objects
     where bucket_id = 'vision-uploads'
       and created_at < now() - interval '7 days'; $$
);
```

(Cấu trúc trên là pattern; chi tiết SQL được P2 finalize.)

Object naming: `vision-uploads/{user_id}/{snapshot_id}.{ext}`. RLS
`storage.foldername(name)[1] = auth.uid()::text` ép user_id phải nằm ở
folder đầu tiên — chéo user là không thể.

### Bảng phụ (cân nhắc P2)

Có thể thêm `public.vision_analyses` lưu narrative + image_path để cleanup
ảnh không xoá kết quả. Quyết định dứt khoát ở P2 dựa trên việc
`explanation_results` đã đủ chứa narrative chưa.

### 6 cờ env (P1)

`apps/api/src/config/env.ts` thêm (parse `z.stringbool()`, default `false`):

```
EXTENDED_SYSTEM_HEPAN_ENABLED:    z.stringbool().default(false),
EXTENDED_SYSTEM_MANGPAI_ENABLED:  z.stringbool().default(false),
EXTENDED_SYSTEM_TAROT_ENABLED:    z.stringbool().default(false),
EXTENDED_SYSTEM_MBTI_ENABLED:     z.stringbool().default(false),
EXTENDED_SYSTEM_FACE_ENABLED:     z.stringbool().default(false),
EXTENDED_SYSTEM_PALM_ENABLED:     z.stringbool().default(false),
API_VISION_REQUESTS_PER_DAY_PER_USER: z.coerce.number().int().positive().default(5),
```

`z.stringbool()` (KHÔNG `z.coerce.boolean()`) — giống decision 0010, tránh
bug `Boolean('false')===true`.

## UI / Platform Impact

### Web nav

Sidebar dashboard thêm 6 mục mới (Hợp Hôn / Manh Phái / Tarot / MBTI /
Xem Tướng / Xem Tay) — mỗi mục bị che bởi cờ feature tương ứng. Web đọc
trạng thái cờ qua endpoint `GET /health` mở rộng (hoặc 1 endpoint
`/features` riêng — chốt ở P0). KHÔNG hard-code cờ vào web bundle.

### UI từng hệ

Là phạm vi 6 epic con, KHÔNG dựng trong US-017. US-017 chỉ:

- Thêm route stub `/(app)/pairings`, `/(app)/mbti`, `/(app)/tarot`,
  `/(app)/face`, `/(app)/palm` với CTA "Tính năng đang phát triển" (Việt
  ngữ) cho 5 hệ.
- Tarot (US-017a) — UI thật.

### Platform

- `apps/web` thêm dependency 0 mới — multipart upload qua Fetch API
  chuẩn. KHÔNG thêm `@supabase/storage-js` vào web bundle (web upload qua
  API endpoint, không trực tiếp).
- `apps/api` cần multipart parser (Nest có sẵn `@nestjs/platform-express`
  + `multer`). Verify hiện trạng ở P3e.
- LLM Vision: `apps/api` cần adapter mới — ưu tiên Gemini Vision (API key
  đã có) hoặc OpenAI-compat. Adapter tách bạch trong `vision-face.service`
  / `vision-palm.service`, KHÔNG nhồi vào `explanations/` hiện có.

## Observability

- Mỗi gọi LLM (text + vision) log: `provider`, `model`, `prompt_tokens`,
  `completion_tokens`, `cost_usd_estimate`, `system` (1 trong 12 hệ),
  `request_id`. Vision có thêm `image_size_bytes`.
- Cảnh báo log khi cờ feature on ở môi trường `prod` (giống pattern
  cảnh báo `AI_EXPLANATION_FREE_FOR_ALL=true` ở 0010).
- Audit row riêng cho upload vision: `owner_user_id`, `image_path`,
  `created_at` — phục vụ cleanup + GDPR.
- Quota vision tracked tách bạch khỏi quota text — log key
  `quota_kind=vision`.

## Alternatives Considered

Quyết định kiến trúc đã chốt ở `docs/decisions/0012-extended-divination-systems.md` §Alternatives Considered:

1. Một endpoint vạn năng `POST /charts` cho 12 hệ — loại (schema phình +
   sai nghĩa).
2. Lưu ảnh dài hạn — loại (PII + GDPR).
3. Cho anon-user dùng face/palm — loại (vision tốn token + anon reset
   quota dễ).
4. Multipart upcast cho face/palm trên `POST /charts` — loại (controller
   phình + lẫn nhiều mối quan tâm).

Story này KHÔNG mở thêm alternative mới; chỉ hiện thực 0012.
