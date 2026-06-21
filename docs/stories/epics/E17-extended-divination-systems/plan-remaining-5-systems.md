# Plan: 5 he luan giai con lai (Phase 2 - PLAN)

> Trang thai: DRAFT - cho review Phase 2. Bam spec-remaining-5-systems.md (da duyet) + nguon .ref/taibu.

## Thu tu trien khai (tuan tu, moi he 1 PR)

US-017b MBTI -> US-017c Hop Hon -> US-017d Manh Phai -> US-017e Xem Tuong -> US-017f Xem Tay.

Ly do thu tu: tang dan do phuc tap ha tang. MBTI = scoring thuan + LLM text (khong engine, khong storage). Hop Hon/Manh Phai = engine (iztro/bazi adapter) + LLM text. Face/Palm = vision provider moi + storage upload + guard danh tinh => de cuoi cung sau khi vision provider da chot.

## Phu thuoc chung (lam mot lan, nam trong PR dau co lien quan)

- C0 (truoc US-017e): Mo rong provider vision. Sua ExplanationPromptPayload them imageInput? {base64, mimeType}; openai-compat provider build user message dang mang content part khi co anh. Test provider rieng. => Dat trong PR US-017e (Face), khong lam som.
- Cac schema/guard/quota/bucket/features: DA CO tu US-017, tai dung truc tiep.

## US-017b - MBTI (PR dau)

Components:
- contracts: mbti-result.ts DA CO (mbtiResultSchema, mbtiAnswerSchema). Bo sung neu thieu: mbtiQuestion type + request schema (answers[]).
- api module quizzes-mbti/: controller (POST /quizzes/mbti) + service (scoring) + mbti-questions.ts (bo cau hoi dich tieng Viet) + module.
- Port tu .ref/taibu/src/lib/divination/mbti.ts: calculateResult (scoring 8 chieu E/I S/N T/F J/P + percent), getRandomQuestions. Dich question bank sang tieng Viet.
- Gate: FEATURE_DISABLED (EXTENDED_SYSTEM_MBTI_ENABLED) -> premium -> quota text -> scoring -> (LLM narrative hoac deterministic) -> mbtiResultSchema.parse.
- web: route /mbti + component quiz + ket qua; doc GET /features.

Rui ro: bo cau hoi lon (dich + giu 0 Han); scoring off-by tie-break. Mitigation: port nguyen logic calculateResult + unit test doi chieu fixture taibu.

Checkpoint: contracts test xanh; api test (gate/quota/scoring) xanh; web check+lint; e2e live /mbti; harness US-017b. -> REVIEW -> merge.

## US-017c - Hop Hon

Components:
- contracts: pairing-snapshot.ts DA CO.
- api module pairings/: controller (POST /pairings, body {primary, partner}) + service (ghep 2 ziwei qua astro-engine iztro adapter + compatibility score).
- Port tu .ref/taibu/src/lib/divination/hepan.ts: analyzeCompatibility (dimensions score 0-100) + calculateBaZi. Anh xa sang chartSnapshot ziwei hien co cho primary/partner.
- Gate giong MBTI (co EXTENDED_SYSTEM_HEPAN_ENABLED).
- web: route /hepan (2 birth form) + ket qua.

Rui ro: dung 2 snapshot ziwei that (nang) vs port score thuan. Mitigation: tai dung iztro adapter da co; compatibility port nguyen tu hepan.ts.

Checkpoint nhu tren -> REVIEW -> merge.

## US-017d - Manh Phai

Components:
- THEM 'mangpai' vao implementedChartSystems + createChartSystemSchema (POST /charts chap nhan mangpai). KHONG module moi.
- charts service: nhan dien mangpai -> dung bazi adapter + lop luan giai mangpai (port .ref/taibu mangpai.ts) + prompt rieng.
- Gate co EXTENDED_SYSTEM_MANGPAI_ENABLED kiem o duong tao chart cho mangpai (khong dung chung 6 he cu).
- web: ChartSystemPicker van chi 6 he cu cho toi khi co bat; route /mangpai wrapper.

Rui ro lon nhat: cham vao createChartRequestSchema + charts flow (duong da merged, co e2e us-007). Mitigation: chi THEM nhanh mangpai, gate rieng; chay lai e2e us-007 dam bao 5 he cu khong doi.

Checkpoint + chay regression e2e us-007 -> REVIEW -> merge.

## US-017e - Xem Tuong (Face) [bao gom C0 vision provider]

Components:
- C0: mo rong provider vision (ExplanationPromptPayload.imageInput + openai-compat content part). Test provider.
- contracts: vision-analysis.ts DA CO.
- api module vision-face/: controller (POST /vision/face, multipart hoac base64 JSON) + service (assertEmailIdentityRequired -> quota vision -> upload vision-uploads -> vision LLM -> visionAnalysisSchema).
- Port prompts tu .ref/taibu/src/lib/divination/face.ts (buildFaceSystemPrompt/buildFaceUserPrompt, dich Viet) + SUPPORTED_IMAGE_MIME_TYPES.
- Storage: upload qua @supabase/supabase-js (da co); path {userId}/{requestId}.{ext}; RLS owner-only da co.
- web: route /face (chi user co email; anon thay CTA nang cap) + upload UI.

Rui ro: PII anh + chi phi vision + anon bypass. Mitigation: guard danh tinh BAT BUOC; quota vision rieng; auto-delete 7 ngay (cron da co); test guard anon -> 403.

Checkpoint + test vision provider + e2e (user email) -> REVIEW -> merge.

## US-017f - Xem Tay (Palm)

Components: tuong tu vision-face, tai dung C0 + module pattern. Port .ref/taibu/src/lib/divination/palm.ts prompts. kind='palm'.

Checkpoint nhu Face -> REVIEW -> merge.

## Verification checkpoints (moi he)

1. Contracts: pnpm --filter @ziweiai/contracts test
2. API: pnpm --filter @ziweiai/api test (gate/quota/scoring/guard)
3. Web: pnpm --filter @ziweiai/web check + test + lint (--max-warnings=0)
4. E2E live: pnpm --filter @ziweiai/web e2e -- us-017X-...
5. Harness: story update US-017X (unit/integration/e2e/platform) + verify
6. REVIEW (subagent + bot) -> resolve -> merge -> don branch.

## Parallel vs sequential

- Tuan tu bat buoc giua cac he (yeu cau review tung he). KHONG lam song song.
- Trong 1 he: contracts -> api -> web co the lam noi tiep; test viet truoc (TDD) theo tung lop.

## Rui ro tong + mitigation

- Co bat nham prod: moi PR giu default false; chi bat o env test/stg cho e2e.
- Public contract drift: them gia tri/endpoint thuan, khong sua schema cu; chay regression e2e us-006/us-007.
- Vision cost/PII: quota rieng + guard danh tinh + auto-delete.
- mangpai cham charts flow: gate rieng + regression e2e 6 he cu.

## Next phase

Sau khi PLAN duyet -> TASKS (chia nho US-017b truoc, moi task <= ~5 file, co acceptance + verify) -> IMPLEMENT US-017b theo TDD.
