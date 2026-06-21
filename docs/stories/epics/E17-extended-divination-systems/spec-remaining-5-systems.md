# Spec: 5 he luan giai con lai (MBTI / Hop Hon / Manh Phai / Xem Tuong / Xem Tay)

> Trang thai: DRAFT - cho review Phase 1 (SPECIFY). Chua code cho toi khi spec duoc duyet. Theo decision 0012 + execplan E17.

## Objective

Hoan tat 5 epic con con lai cua US-017 (US-017b..f) de dua ziweiai-web tu "6 he implemented + Tarot proof" len du 12 he luan giai. US-017 (PR #15) da dung xong khung: enum 12 he, 4 schema ket qua, 6 co feature-flag, guard danh tinh, quota vision, bucket Storage, va da chung minh khung qua Tarot (US-017a).

5 he can hien thuc (thu tu theo decision 0012):

| # | He | slug | Endpoint | Dau vao | Engine | LLM |
|---|---|---|---|---|---|---|
| 1 | MBTI | mbti | POST /quizzes/mbti | mang cau tra loi Likert | scoring thuan | text |
| 2 | Hop Hon | hepan | POST /pairings | 2 birth-input | iztro ghep 2 ziwei | text |
| 3 | Manh Phai | mangpai | POST /charts | 1 birth-input | bazi mo rong | text |
| 4 | Xem Tuong | face | POST /vision/face | 1 anh chan dung | (none) | vision |
| 5 | Xem Tay | palm | POST /vision/palm | 1 anh long ban tay | (none) | vision |

Nguon port: .ref/taibu/src/app/api/{mbti,hepan,mangpai,face,palm}/route.ts + .ref/taibu/src/lib/divination/*. Chi port luan giai cot loi moi he (Non-Goals cua E17 giu nguyen: khong port annual-report/share/history nang cao cua taibu).

Nguoi dung: moi he sau khi merged + bat co se xuat hien nhu mot loi luan giai rieng. Anon dung duoc MBTI/Hop Hon/Manh Phai; bi chan face/palm (PII + chi phi vision).

Thanh cong = 5 he chay that sau API (gate dung, quota dung, output 0 chu Han, test day du), moi he mot PR rieng vao main, co van default false o prod.

## Tech Stack

- Backend: NestJS (apps/api), Zod schema tu @ziweiai/contracts.
- Engine: @ziweiai/astro-engine (adapter iztro cho ziwei/hepan; adapter lunar-javascript-bazi cho mangpai) - KHONG de web dung engine (boundary 0007).
- LLM: ExplanationProviderRouter hien co (text). Vision (face/palm) CAN mo rong provider - xem Open Question #1.
- Web: SvelteKit (apps/web), chi import @ziweiai/contracts.
- Storage: bucket vision-uploads (da co tu US-017) qua @supabase/storage-js.
- Test: Vitest (api + contracts + web unit), Playwright (web e2e).

## Commands

- Typecheck:  pnpm -w turbo typecheck
- API test:   pnpm --filter @ziweiai/api test
- Contracts:  pnpm --filter @ziweiai/contracts test
- Web check:  pnpm --filter @ziweiai/web check
- Web unit:   pnpm --filter @ziweiai/web test
- Web e2e:    pnpm --filter @ziweiai/web e2e -- <spec-name>
- Lint:       pnpm --filter @ziweiai/web lint   (eslint --max-warnings=0)
- Harness:    scripts/bin/harness-cli.exe story verify US-017b

## Project Structure

Di san US-017 da co (tai dung, KHONG dung lai):

- packages/contracts/src/chart/pairing-snapshot.ts   (hepan)
- packages/contracts/src/chart/tarot-draw.ts          (tarot - done)
- packages/contracts/src/chart/vision-analysis.ts     (face + palm)
- packages/contracts/src/quizzes/mbti-result.ts       (mbti)
- apps/api/src/modules/auth/identity.guard.ts         (EmailIdentityGuard + assertEmailIdentityRequired)
- apps/api/src/common/entitlement/ai-entitlement.guard.ts  (assertCanUseAiExplanation)
- apps/api/src/modules/quotas/quotas.service.ts       (assertCanCreate* text)
- apps/api/src/health/features.controller.ts          (GET /features - 6 co)
- apps/api/supabase/migrations/000002_vision-uploads-bucket.up.sql
- apps/api/src/config/env.ts                          (6 co EXTENDED_SYSTEM_* + API_VISION_REQUESTS_PER_DAY_PER_USER)

Moi he them 1 module duoi apps/api/src/modules/ theo mau draws-tarot/:

- apps/api/src/modules/quizzes-mbti/   (US-017b: controller + service + mbti-questions.ts + module)
- apps/api/src/modules/pairings/       (US-017c: controller + service iztro ghep + module)
- mangpai (US-017d): THEM 'mangpai' vao charts flow hien co, KHONG module moi
- apps/api/src/modules/vision-face/    (US-017e: controller multipart + service upload + vision + module)
- apps/api/src/modules/vision-palm/    (US-017f: tuong tu vision-face)

Web: moi he mot route + feature component, doc GET /features de an/hien.

## Code Style

Bam mau draws-tarot.service.ts da merged - trat tu gate bat buoc:

1. Neu co EXTENDED_SYSTEM_<HE>_ENABLED = false -> throw 403 FEATURE_DISABLED.
2. face/palm them: assertEmailIdentityRequired(user) -> 403 IDENTITY_REQUIRED (chan anon).
3. assertPremiumEntitlement() - gate AI TRUOC quota (402 PAYMENT_REQUIRED).
4. assertCanCreate...(user.userId, ip, !user.email) - quota, boc loi raw -> 429 RATE_LIMITED.
5. Tinh deterministic (scoring / ghep / vision: upload anh) -> goi LLM (hoac deterministic o giai doan proof).
6. resultSchema.parse(...) truoc khi tra ve.

Quy uoc: nhan nguoi dung tieng Viet (0 ky tu CJK - guard CJK_TEXT_PATTERN); comment/log tieng Viet; identifier English; dung !user.email de nhan dien anon.

## Testing Strategy

Moi he phai co:

- Contract test: schema parse OK + reject (pattern us017-schemas.test.ts).
- Service unit: gate FEATURE_DISABLED khi co off; (face/palm) IDENTITY_REQUIRED cho anon; PAYMENT_REQUIRED khi gate AI off; quota -> 429; happy-path deterministic.
- Controller unit: validate input (INVALID_INPUT), truyen tham so dung service.
- Web: no-han-characters mo rong nhan he; component/view-state test.
- E2E (it nhat 1/he): bat co o moi truong test, chay luong chinh qua UI.

Muc tieu giu nguong: api test xanh toan bo, web check 0 loi, lint sach (--max-warnings=0), e2e live xanh.

## Boundaries

- Always: gate fail-closed (co off -> tu choi); test truoc khi mo PR; nhan Viet 0 Han; moi he 1 PR rieng + 1 co rieng; tai dung guard/quota/schema US-017.
- Ask first: mo rong provider cho vision (thay doi interface AI); them dependency (@supabase/storage-js neu chua co); them bang/migration moi; bat bat ky co nao o prod; dua mangpai vao implementedChartSystems.
- Never: commit secret/anh test PII; bat co prod trong cac PR nay; sua schema 5 bang cu; de web import core/astro-engine; luu anh vision qua 7 ngay; bo guard anon o face/palm.

## Success Criteria

1. MBTI: POST /quizzes/mbti nhan mang answer, scoring 4 truc -> mbtiResultSchema hop le, narrative 0 Han; co off -> 403; quota -> 429; bo cau hoi tieng Viet.
2. Hop Hon: POST /pairings nhan 2 birth-input -> pairingSnapshotSchema (2 ziwei + compatibility); co off -> 403.
3. Manh Phai: POST /charts chap nhan chartSystem='mangpai' (them vao implementedChartSystems) -> snapshot bazi mo rong; co off -> 403; 5 he cu khong doi hanh vi.
4. Xem Tuong / Xem Tay: POST /vision/{face,palm} (multipart) -> upload anh vao vision-uploads (RLS owner-only) -> visionAnalysisSchema; anon -> 403 IDENTITY_REQUIRED; quota vision rieng -> VISION_QUOTA_EXCEEDED; anh auto-xoa <= 7 ngay.
5. Moi he: co default false, fail-closed; output web 0 Han; test day du; moi he 1 PR vao main; harness story US-017b..f cap nhat.

## Open Questions (can chot truoc PLAN)

1. Vision provider (face/palm): ExplanationProviderRouter hien chi lam text (payload promptOverride, khong nhan anh). face/palm can gui anh cho LLM vision. Huong nao: (a) mo rong interface AiExplanationProvider them anh inline (Gemini generateContent ho tro); (b) provider vision rieng; (c) giai doan proof dung narrative deterministic nhu Tarot, hoan vision LLM that. Day la rui ro kien truc lon nhat + duong tien te dat nhat.
2. Pham vi lan nay: Lam tron ca 5 he, hay chot spec/plan roi implement tuan tu tung he (US-017b truoc)? Decision 0012 quy dinh tuan tu, moi he 1 PR. De xuat: spec chung cho 5, implement lan luot, dung review giua cac he.
3. MBTI questions: Port 60 cau tu .ref/taibu/src/lib/data-sources/mbti.ts (nguon tieng Trung) -> can dich sang tieng Viet (giu bat bien 0 Han). Tu dich hay rut gon con ~28/44 cau chuan? Can chot so luong + nguon dich.
4. Engine mangpai/hepan: astro-engine co adapter bazi + iztro-ziwei. Manh Phai = lop luan giai tren bazi (co can thuat toan rieng hay chi prompt khac?); Hop Hon = ghep 2 ziwei + compatibility score (thuat toan diem lay tu taibu lib/divination/hepan.ts hay tu dinh nghia?). Can xac nhan muc port engine.
5. @supabase/storage-js: can kiem co trong deps chua (US-017 tao bucket qua migration nhung co the chua wire client upload). Neu thieu -> thuoc nhom Ask first them dependency.

## Assumptions (sua ngay neu sai)

1. Trien khai TUAN TU theo decision 0012: MBTI -> Hop Hon -> Manh Phai -> Xem Tuong -> Xem Tay; moi he mot PR + mot co.
2. Tai dung 100% khung US-017 (schema/guard/quota/bucket/features), KHONG dung lai; chi THEM module/route moi + (mangpai) them vao flow charts.
3. Co giu default false o moi PR; chi bat o moi truong test/stg de chay e2e.
4. AI gate dung chung assertCanUseAiExplanation; vision dung quota rieng API_VISION_REQUESTS_PER_DAY_PER_USER + guard danh tinh email.
5. Giai doan dau moi he co the dung narrative deterministic (nhu Tarot proof) neu wiring LLM that vuot scope mot PR; LLM that la buoc ke tiep co co.

## Next phase

Sau khi spec duoc duyet -> PLAN (thu tu ky thuat + checkpoint) -> TASKS (chia nho theo tung he, moi task <= ~5 file) -> IMPLEMENT (TDD, tuan tu tung he).

---

## Resolved Decisions (chot sau review Phase 1)

1. Vision provider (face/palm): MO RONG provider OpenAI-compatible hien co de nhan anh inline (content part image_url voi data URL base64). Ca deepseek lan gemini deu di qua chat completions nen mot duong la du - KHONG dung provider vision rieng. Them field optional imageInput {base64, mimeType} vao ExplanationPromptPayload; khi co + provider la openai-compat thi user message thanh mang [{type:text},{type:image_url}]. Tai dung nguyen chain timeout/failover/CJK guard. Quota vision rieng + guard danh tinh email giu nguyen.
2. Pham vi: TUAN TU 5 he, moi he test + e2e live day du, review tung he roi moi sang he ke. Thu tu: MBTI -> Hop Hon -> Manh Phai -> Xem Tuong -> Xem Tay.
3. MBTI: dich HET bo cau hoi sang tieng Viet (giu bat bien 0 Han). Port question bank + scoring tu .ref/taibu.
4. Engine: lay full code/thuat toan tu .ref/taibu (hepan.ts calculateBaZi + analyzeCompatibility; mangpai.ts; mbti.ts calculateResult; face.ts/palm.ts prompts) de toi uu + nhanh, port sang cau truc ziweiai-web.
5. @supabase/supabase-js da co san storage client trong apps/api -> KHONG can them dependency. Wire upload tu client nay.

## Dependency note (xac minh)

- apps/api/package.json da co @supabase/supabase-js ^2.84.0 (bao gom storage). Khong them @supabase/storage-js rieng.
- Provider router hien chi text; vision can sua interface ExplanationPromptPayload + openai-compat provider (nhom "Ask first" da duoc duyet o quyet dinh #1).

---

## Correction (2026-06-21): Vision provider - CA 3 provider deu doc duoc anh

Sua lai Resolved Decision #1 (truoc do ghi "chi mo rong provider openai-compat" — KHONG dung).

Router explanation-provider-router.ts chay chain 3 provider voi FAILOVER: deepseek + openai-compat (OpenAI-style /v1/chat/completions) + gemini (:generateContent). Ca 3 deu ho tro doc anh, nhung KHAC SHAPE request:
- deepseek + openai-compat: user message la mang content part, anh = {type:'image_url', image_url:{url: <data URL base64>}}.
- gemini: contents[].parts[] voi inlineData {mimeType, data: <base64>}.

=> US-017e (buoc C0 vision): them field optional imageInput {base64, mimeType} vao ExplanationPromptPayload, roi MOI trong 3 provider build shape rieng khi co anh. Neu chi sua 1 provider, failover sang provider con lai se am tham bo anh -> ket qua vision sai (hoac LLM "ao" mo ta anh khong ton tai). Test vision phai phu ca 3 provider (it nhat unit test build-request cho moi shape).

Anh huong: tang do phuc tap C0 (3 provider thay vi 1) nhung van nam trong PR US-017e; khong doi thu tu epic. Khong co dependency moi (fetch san co).

---

## Correction (2026-06-21): DeepSeek - chi deepseek-v4-pro doc duoc anh

Bo sung Correction vision o tren. DeepSeek provider dung apiEnv.DEEPSEEK_MODEL (mac dinh deepseek-v4-pro) hoac payload.modelOverride. KHONG phai moi model deepseek doc duoc anh:
- deepseek-v4-pro: doc duoc anh (vision OK).
- deepseek-v4-flash: KHONG doc duoc anh.

=> US-017e (C0 vision): khi co imageInput, provider deepseek phai kiem NANG LUC MODEL (model resolved co thuoc allowlist vision khong), KHONG chi kiem provider.isAvailable(). Neu model hien tai khong ho tro vision:
- bo qua deepseek trong chain vision (de failover sang gemini/openai-compat ho tro anh), HOAC
- ep modelOverride sang model vision-capable (vd deepseek-v4-pro) cho rieng duong vision.
Tranh truong hop gui anh cho deepseek-v4-flash -> loi hoac anh bi bo am tham -> LLM "ao" mo ta anh khong doc duoc.

Khuyen nghi: them allowlist vision-capable model (vi du config VISION_CAPABLE_MODELS hoac hard-code danh sach toi thieu) + isVisionCapable() tren moi provider. Chain vision chi gom provider+model that su doc duoc anh.

---

## Correction (2026-06-21): DeepSeek API thuc te CHUA ho tro vision (dinh chinh Correction tren)

Kiem chung truc tiep tren `api.deepseek.com` (key hop le) + doc tai lieu chinh thuc api-docs.deepseek.com:
- Goi `/v1/chat/completions` voi content part `image_url` (data URL base64) cho CA `deepseek-v4-pro`
  LAN `deepseek-v4-flash` deu tra HTTP 400: "Failed to deserialize ... unknown variant `image_url`,
  expected `text`". Thu ca hai thu tu (text-first, image-first) deu 400.
- Tai lieu chinh thuc (API Guides) KHONG co trang vision/multimodal nao. Bai "DeepSeek V4 Vision" la
  blog ben thu ba (mindstudio.ai), KHONG phai docs chinh thuc.

=> Correction "deepseek-v4-pro doc duoc anh" o tren la SAI thuc te. Da sua:
`DEEPSEEK_VISION_CAPABLE_MODELS` = RONG → `isVisionCapable()` cua DeepSeek luon false → router loai
DeepSeek khoi chain vision (khong ton mot cu goi 400 thua moi request roi moi failover). Co che
isVisionCapable/allowlist GIU NGUYEN: khi DeepSeek mo vision chi can them model id vao set la du.

Thuc te chay (live, anh that): chain vision chay qua `openai-compat` (endpoint OpenAI-style cau hinh
qua OPENAI_COMPAT_*) — provider duy nhat doc duoc anh trong moi truong nay (GEMINI_API_KEY trong nen
gemini native bi skip). Ket qua face/palm: 200, tieng Viet, 0 chu Han, mo ta dung anh.
