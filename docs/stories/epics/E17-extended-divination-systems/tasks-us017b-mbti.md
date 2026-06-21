# Tasks: US-017b MBTI (Phase 3 - TASKS)

> Trang thai: DRAFT - cho review Phase 3. Chi chia task cho he DAU (MBTI). 4 he sau chia khi toi luot. Moi task <= ~5 file, co Acceptance + Verify.

## Ghi chu contract (quan trong)

Contract da co (US-017) khac shape taibu - PORT phai MAP, khong doi contract cong khai tru khi can:
- mbtiAnswerSchema hien tai: {questionId: string, choice: 1..7}. Taibu: {questionIndex, likertValue 1..7}. => Service map questionId -> index noi bo.
- mbtiResultSchema hien tai: {type, axes[4] {key EI/SN/TF/JP, score 0-100, label}, narrative}. Taibu: {type, scores{8}, percentages{4 cap}}. => Service chuyen percentages -> axes (score = % cuc thu 2, label Viet).
- Neu can them request schema (mang answers + so cau) -> them mbtiQuizRequestSchema vao mbti-result.ts (mo rong thuan, co test).

## Task 1: Contract - request schema + question type

- [ ] Mo rong packages/contracts/src/quizzes/mbti-result.ts: them mbtiQuizRequestSchema {answers: mbtiAnswerSchema[] min 4} + mbtiQuestionSchema (id, text Viet, axis EI/SN/TF/JP, direction). Export qua index.ts.
  - Acceptance: schema parse OK mang answers; reject answers rong / choice ngoai 1..7. Type export.
  - Verify: pnpm --filter @ziweiai/contracts test (them case vao us017-schemas.test.ts hoac file moi mbti-quiz.test.ts).
  - Files: mbti-result.ts, index.ts, 1 test file.

## Task 2: Question bank dich tieng Viet

- [ ] Tao apps/api/src/modules/quizzes-mbti/mbti-questions.ts: port bo cau hoi tu .ref/taibu (output.txt / data-source), DICH HET sang tieng Viet, moi cau {id, text, axis, choiceA{dim,text}, choiceB{dim,text}}. Giu 0 ky tu Han.
  - Acceptance: >= 28 cau (dung getRandomQuestions count mac dinh), phu deu 4 truc; CJK scan = 0.
  - Verify: unit test quet CJK_TEXT_PATTERN tren toan bo text + dem cau moi truc.
  - Files: mbti-questions.ts, mbti-questions.test.ts.

## Task 3: Scoring service (port calculateResult)

- [ ] Tao apps/api/src/modules/quizzes-mbti/mbti-scoring.ts: port calculateResult + LIKERT_WEIGHTS + tie-break tu .ref/taibu/src/lib/divination/mbti.ts. Output map sang mbtiResultSchema shape (axes + percentages).
  - Acceptance: cung input -> cung type (doi chieu fixture taibu mbti.test.ts); tie-break xac dinh; axes score 0-100.
  - Verify: unit test fixture (it nhat 2 bo answer -> 2 type khac nhau + 1 ca tie-break).
  - Files: mbti-scoring.ts, mbti-scoring.test.ts.

## Task 4: Service + gate

- [ ] Tao quizzes-mbti.service.ts: trat tu gate giong draws-tarot - FEATURE_DISABLED (EXTENDED_SYSTEM_MBTI_ENABLED) -> assertPremiumEntitlement (402) -> assertCanCreateMbtiQuiz quota (boc 429) -> scoring -> narrative (deterministic giai doan dau, theo Tarot proof) -> mbtiResultSchema.parse.
  - Acceptance: co off -> 403 FEATURE_DISABLED; AI gate off -> 402; quota loi -> 429; happy-path tra result hop le.
  - Verify: quizzes-mbti.service.test.ts (4 nhanh nhu draws-tarot.service.test.ts).
  - Files: quizzes-mbti.service.ts, service.test.ts; them assertCanCreateMbtiQuiz vao quotas.service.ts (hoac tai dung assertCanCreateTarotDraw-style).

## Task 5: Controller + module + wiring

- [ ] Tao quizzes-mbti.controller.ts (POST /quizzes/mbti, @CurrentUser + @Req, validate mbtiQuizRequestSchema -> INVALID_INPUT) + quizzes-mbti.module.ts (imports QuotasModule) + dang ky vao AppModule.
  - Acceptance: body sai -> 400 INVALID_INPUT; body dung -> goi service dung tham so; module nap trong AppModule.
  - Verify: controller.test.ts (pattern draws-tarot.controller.test.ts); api test toan bo xanh.
  - Files: controller.ts, module.ts, app.module.ts, controller.test.ts.

## Task 6: Web - route + quiz UI + ket qua

- [ ] Tao route /mbti + component quiz (Likert) + ket qua (4 truc + narrative); api-client createMbtiQuiz; doc GET /features de an/hien; nhan Viet.
  - Acceptance: lam bai -> submit -> hien type + 4 truc; 0 chu Han; an khi co off.
  - Verify: web check 0 loi + lint sach; no-han-characters mo rong; component/view-state test.
  - Files: routes/(app)/mbti/+page.svelte, feature component(s), api-client, vi.ts, test.

## Task 7: E2E live + harness

- [ ] Viet e2e us-017b-mbti.spec.ts (bat co MBTI o env test): dang nhap -> /mbti -> lam bai -> ket qua hien type. Chay live xanh. Update harness US-017b.
  - Acceptance: e2e live pass; harness story US-017b unit/integration/e2e set.
  - Verify: pnpm --filter @ziweiai/web e2e -- us-017b-mbti; harness story update + verify.
  - Files: us-017b-mbti.spec.ts, (env test flag).

## Definition of Done (US-017b)

- contracts + api + web test xanh; web check 0 loi; lint --max-warnings=0; e2e live xanh.
- Co EXTENDED_SYSTEM_MBTI_ENABLED default false (fail-closed); output 0 Han.
- 1 PR vao main; review (subagent + bot) resolved; harness US-017b cap nhat; branch don sach.

## Next

Sau khi TASKS duyet -> IMPLEMENT Task 1..7 theo TDD (test truoc moi lop). Khi US-017b merged -> chia TASKS cho US-017c Hop Hon.
