 # Báo cáo review PR #5 — feat(web): US-007 5 hệ thuật số khác + lịch sử + guard Hán
 
 **Ngày review**: 2026-06-15 20:15 (UTC+7)
 **Branch**: `feat/us-007-other-systems-history` → `main`
 **Commit**: `a0ca100dfd539552b56043f069abb92be9a3ba8d`
 **Files**: 25 changed (+1153 / -103)
 **State**: open, mergeable clean
 
 ## Tổng quan
 
 PR hoàn thiện US-007 với 5 hệ thuật số khác Tử Vi (Bát Tự, Mai Hoa, Lục Hào, Đại Lục Nhâm, Kỳ Môn), trang lịch sử đầy đủ, và guard Hán toàn cục. Kiến trúc sạch, test coverage tốt, bất biến ngôn ngữ được chốt chắc.
 
 ## Điểm số
 
 | Chiều | Điểm | Ghi chú |
 |---|---|---|
 | Chất lượng code | 95/100 | Pattern nhất quán, Svelte 5 runes chính xác. CSS `.cards` duplicate nhẹ. |
 | Test coverage | 85/100 | 103/103 pass, no-han-characters toàn diện. Thiếu unit test formatter + cache fix. |
 | Standards compliance | 95/100 | Kebab-case, Vietnamese content, boundary sạch, bundle không secret. |
 | Requirement alignment | 100/100 | Toàn bộ phạm vi US-007 hoàn thiện, Success Criteria đạt. |
 | Architecture consistency | 95/100 | Presentational + dispatcher + thin route. SystemChartScreen thiếu nav hệ khác. |
 | Risk assessment | 90/100 | Rủi ro đã ghi nhận + mitigation rõ ràng. |
 | **Tổng hợp** | **92.4/100** | **Approval** |
 
 ## Phân tích chi tiết
 
 ### Điểm mạnh
 
 1. **Kiến trúc presentational sạch**: 5 detail card (BaziDetailCard, MeihuaDetailCard, LiuyaoDetailCard, DaliurenDetailCard, QimenDetailCard) đều là presentational thuần — nhận `snapshot` qua `$props()`, dùng `$derived` format từ `chart-display.ts`, render `SummaryCard`. Không logic nghiệp vụ trong card, không state riêng.
 
 2. **Dispatcher mở rộng được**: `getChartDetailState()` trong `chart-detail-view-state.ts` ánh xạ chartSystem → chuỗi trạng thái. `ChartDetailScreen.svelte` dispatch theo chuỗi này. Thêm hệ mới chỉ cần một else-if + card mới.
 
 3. **Route wrapper mỏng**: 5 route (`/bazi`, `/meihua`, `/liuyao`, `/daliuren`, `/qimen`) mỗi cái 12 dòng. Tất cả tái dùng `SystemChartScreen` + `dashboard-model` + `BirthForm` — không fork logic.
 
 4. **Cache fix đúng gốc**: `dashboard-model.svelte.ts` inject `QueryClient` + gọi `invalidateQueries({ queryKey: ['history'] })` trong `onSuccess`. Fix đúng nguyên nhân (cache lỗi thời sau ghi) thay vì hạ `staleTime`. Post-mortem giải thích rõ symptom → root cause → fix → validation.
 
 5. **Guard Hán toàn cục**: `guardFreeText` → `normalizeLegacyDisplayName` → `CJK_TEXT_PATTERN`. Áp dụng cho naYin (Bát Tự), tên quẻ (Lục Hào), phục thần (Lục Hào). Test `no-han-characters.test.ts` quét toàn bộ 5 hệ + test fallback "Thuật ngữ cũ" khi input có chữ Hán.
 
 6. **Test no-han-characters kỹ lưỡng**: 7 test cases, mỗi hệ có fixture riêng với key ASCII hợp lệ. Test hai lớp: (a) key hợp lệ → output tiếng Việt, (b) chuỗi Hán giả lập → guard đổi "Thuật ngữ cũ".
 
 ### Điểm cần lưu ý (không chặn merge)
 
 1. **Thiếu unit test cho formatter logic mới**: `formatBaziMetaItems`, `formatQimenMetaItems`, `formatLiuyaoMetaItems`, `formatMeihuaMetaItems`, `formatLiuyaoHexagramItems`. CodeGraph báo "no covering tests". `no-han-characters.test.ts` test CJK guard nhưng không test logic format (ví dụ: fallback `formatPillarItems` khi `snapshot.bazi` null).
 
 2. **Thiếu unit test cho cache fix**: Post-mortem đã ghi nhận action item "Unit test cho invalidate: mock QueryClient, xác nhận onSuccess gọi invalidateQueries". Chưa implement.
 
 3. **CSS `.cards` duplicate**: 5 detail card + HistoryList đều có `.cards { display: flex; flex-direction: column; gap: var(--space-lg); }`. Có thể extract ra shared class trong tương lai.
 
 4. **SystemChartScreen thiếu nav hệ khác**: Khi đang ở route wrapper (ví dụ `/bazi`), người dùng phải quay về dashboard để chọn hệ khác. UX có thể cải thiện bằng cách thêm nav nhỏ vào SystemChartScreen.
 
 5. **CJK pattern drift risk**: `CJK_TEXT_PATTERN` được copy từ `@ziweiai/core` (decision 0007). Nếu core đổi pattern, web không tự cập nhật. Có thể thêm CI check so sánh hai pattern string.
 
 ### Rủi ro
 
 | Rủi ro | Mức | Mitigation |
 |---|---|---|
 | CJK pattern drift giữa web và core | Thấp | Comment rõ trong cả hai file; test no-han-characters bảo vệ bất biến |
 | Cache history không invalidate nếu thêm mutation mới | Thấp | Pattern invalidate đã rõ; thêm mutation mới cần nhớ gọi invalidate |
 | Thiếu unit test formatter → regression khi refactor chart-display | Thấp | E2E US-007 cover full flow; no-han-characters test cover CJK guard |
 
 ### Bảo mật
 
 - `grep SERVICE_ROLE\|DEEPSEEK\|GEMINI` trong `build/` → 0 kết quả (theo PR description)
 - Không thay đổi auth flow hay permission
 - Không SQL injection hay XSS vector mới
 - Boundary client/server được giữ: web không import từ core/astro-engine
 
 ## Khuyến nghị
 
 **Merge được** (Approval, 92.4/100).
 
 ### Action items (follow-up PR)
 
 1. **Unit test cho dashboard-model cache fix**: Mock `QueryClient`, xác nhận `onSuccess` gọi `invalidateQueries({ queryKey: ['history'] })`.
 2. **Unit test cho formatter logic 5 hệ**: Test fallback path (ví dụ `snapshot.bazi` null → `formatPillarItems`), test empty state, test edge case values.
 3. Cân nhắc thêm nav hệ khác vào `SystemChartScreen` để UX liền mạch hơn.
 4. Extract CSS `.cards` shared class để giảm duplication.
 5. (Stretch) CI check so sánh `CJK_TEXT_PATTERN` giữa web và core.
 
 ## Validation đã thực hiện
 
 - `vitest run`: 103/103 pass (16 file)
 - `svelte-check`: 0 lỗi / 0 cảnh báo
 - `eslint --max-warnings=0`: sạch
 - CodeGraph blast radius: không breaking change, không ảnh hưởng ngược
 
