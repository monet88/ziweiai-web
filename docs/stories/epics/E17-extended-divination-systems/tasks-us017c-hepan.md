# Tasks: US-017c Hop Hon (Phase 3 - TASKS)

> Trang thai: DRAFT - cho review. Chia task cho he Hop Hon (pairings). Moi task <= ~5 file, co Acceptance + Verify. TDD: test truoc moi lop.

## Quyet dinh thiet ke (quan trong)

- pairingSnapshotSchema (DA CO tu US-017) nest 2 ziwei chartSnapshot (primary + partner) + compatibility {overallScore?, notes?}. Giu nest ziwei (khong sua nghia cu).
- Thuat toan tuong hop taibu (analyzeCompatibility) tinh bang BAZI (ngu hanh dominantWuxing + quan he sinh/khac), KHONG phai ziwei. Output goc co chu Han (Kim/Moc/Thuy/Hoa/Tho + mo ta TQ).
- => Compatibility tinh server-side trong astro-engine (noi co lunar-javascript), port tu hepan.ts, DICH output sang tieng Viet (0 Han). API goi: IztroChartAdapter cho 2 ziwei snapshot (khop schema nest) + analyzeHepanCompatibility cho diem.
- Deterministic (pure function cua 2 birthInput) -> giai doan dau KHONG LLM, giong Tarot/MBTI proof.
- Mo rong compatibility: them dimensions[] {name, score 0-100, description} + overallScore (required) + level + narrative (Viet). Bo monthly-trend / advice / triggerFactors / conflicts chi tiet (E17 non-goals: chi luan giai cot loi).

## Task 1: Contract - request + mo rong compatibility

- [ ] packages/contracts/src/chart/pairing-snapshot.ts: them pairingRequestSchema {primary: birthInputSchema, partner: birthInputSchema, relationType: enum('love'|'business'|'family')}. Mo rong compatibility: overallScore (required 0-100), level (string), dimensions (array {name, score 0-100, description}), narrative (string min 1). Giu primary/partner nest ziwei.
  - Acceptance: parse request 2 birthInput hop le; reject thieu partner / relationType la; pairingSnapshot moi parse OK voi dimensions + narrative.
  - Verify: pnpm --filter @ziweiai/contracts test (them pairing-request.test.ts hoac mo rong us017-schemas.test.ts).
  - Files: pairing-snapshot.ts, index.ts (neu can), 1 test file.

## Task 2: astro-engine - port thuat toan tuong hop (bazi)

- [ ] packages/astro-engine/src/hepan-compatibility.ts: port calculateBaZi (Solar/Lunar getEightChar - lunar-javascript da co) + analyzeCompatibility + calculateWuxingRelation + getCompatibilityLevel tu .ref/taibu/src/lib/divination/hepan.ts. DICH het nhan/mo ta sang tieng Viet (Kim/Moc/Thuy/Hoa/Tho; 0 Han). Input: 2 birthInput (contracts) + relationType. Output: {overallScore, level, dimensions[], narrative} - shape khop compatibility schema. Export qua index.ts.
  - Acceptance: cung 2 birthInput -> cung diem (deterministic); output 0 ky tu CJK; score trong 0-100.
  - Verify: hepan-compatibility.test.ts (2 cap sinh -> diem on dinh + CJK scan = 0 + 1 ca sinh/khac ngu hanh).
  - Files: hepan-compatibility.ts, index.ts, hepan-compatibility.test.ts.

## Task 3: pairings service + gate

- [ ] apps/api/src/modules/pairings/pairings.service.ts: trat tu gate giong MBTI/Tarot - FEATURE_DISABLED (EXTENDED_SYSTEM_HEPAN_ENABLED) 403 -> assertCanUseAiExplanation (shared guard, 402) -> assertCanCreatePairing quota (boc 429) -> IztroChartAdapter.calculateChart x2 (primary+partner ziwei snapshot) -> analyzeHepanCompatibility -> pairingSnapshotSchema.parse.
  - Acceptance: co off -> 403; AI gate off -> 402; quota loi -> 429; happy-path tra pairingSnapshot hop le (2 snapshot + compatibility).
  - Verify: pairings.service.test.ts (4 nhanh; mock adapter + quota). Them assertCanCreatePairing vao quotas.service.ts.
  - Files: pairings.service.ts, service.test.ts, quotas.service.ts.

## Task 4: controller + module + wiring

- [ ] pairings.controller.ts (POST /pairings, @CurrentUser + @Req, validate pairingRequestSchema -> INVALID_INPUT) + pairings.module.ts (imports QuotasModule) + dang ky AppModule.
  - Acceptance: body sai -> 400; body dung -> goi service dung tham so; module nap.
  - Verify: controller.test.ts (pattern draws-tarot/quizzes-mbti); api test toan bo xanh.
  - Files: controller.ts, module.ts, app.module.ts, controller.test.ts.

## Task 5: web - route + 2 birth form + ket qua

- [ ] route /hepan + component (2 cum BirthForm-style primary/partner + chon relationType) + ket qua (overallScore + level + dimensions + narrative); api-client createPairing; copy Viet; doc GET /features.
  - Acceptance: nhap 2 nguoi -> submit -> hien diem + dimensions; 0 Han; an khi co off.
  - Verify: web check 0 loi + lint sach; mbti-style copy-cjk test cho viCopy.hepan; component/model test.
  - Files: routes/(app)/hepan/+page.svelte, feature component + model, api-client, vi.ts, test.

## Task 6: e2e live + harness + PR

- [ ] e2e us-017c-hepan.spec.ts (bat co HEPAN o playwright env): dang nhap -> /hepan -> nhap 2 nguoi -> submit -> hien diem tuong hop. Chay live xanh. Update harness US-017c. Mo PR.
  - Acceptance: e2e live pass; harness US-017c implemented (unit/integration/e2e).
  - Verify: pnpm --filter @ziweiai/web e2e -- us-017c-hepan; harness story update + verify.
  - Files: us-017c-hepan.spec.ts, playwright.config.ts (them co), PR.

## Definition of Done

- contracts + astro-engine + api + web test xanh; web check 0 loi; lint --max-warnings=0; e2e live xanh.
- Co EXTENDED_SYSTEM_HEPAN_ENABLED default false (fail-closed); output 0 Han.
- 1 PR vao main; review (bot) resolved; harness US-017c cap nhat; branch don sach.

## Next

Sau TASKS duyet -> IMPLEMENT Task 1..6 theo TDD. Khi US-017c merged -> US-017d Manh Phai.
