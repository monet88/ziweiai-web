# BÁO CÁO BÀN GIAO SPRINT 95 VÀ KHỞI ĐỘNG SPRINT 96 (SESSION HANDOVER & ROADMAP)

> **Dự án:** Tử Vi Toàn Tập (ViOS) — Hệ Điều Hành Mệnh Lý & Thuật Số AI Hoàng Gia  
> **Domain Live:** `https://tuvitoantap.online`  
> **Giai đoạn hiện tại:** **Sprint 95 Hoàn Thành** (Phase 8: Tokenomics, Annual Report Healing, Gemini API Cost Audit & GitNexus Integration)  
> **Giai đoạn tiếp theo:** **Sprint 96 Khởi Động** (Phase 9: Dynamic Model Tiering, Seasonal 2026 Campaign & Banker B2B2C Pilot Launch)  
> **Thời điểm bàn giao:** 14/09/2026  
> **Nhánh Git:** `main` (Clean working tree, 2 commits ahead of origin)  
> **Chất lượng kiểm thử:** **1.003/1.003 tests passed (100%)**, `svelte-check` 0 errors 0 warnings, `turbo typecheck` 10/10 tasks successful.

---

## 1. TỔNG KẾT SPRINT 95 (MỤC TIÊU — VIỆC ĐÃ LÀM — KẾT QUẢ)

### A. Mục Tiêu Sprint 95 (Objectives)
1. **Chẩn đoán & Sửa dứt điểm lỗi Báo Cáo Năm bị cắt cụt:** Điều tra nguyên nhân lá số `bab356f8-fd5c-491f-b92d-0cf56104782e` dừng lại ở `**Liêm Trinh Hóa K`, xác định do CSS popup hay do backend AI generator.
2. **Kiểm toán Chi Phí Gemini API (₫13.6K):** Bóc tách con số 13.6k VNĐ trên Google Cloud Billing, xác định đơn giá vi mô theo từng token và đánh giá rủi ro thâm hụt tài chính của nền kinh tế XU.
3. **Đánh giá & Tích hợp GitNexus Knowledge Graph:** Khảo sát repo `https://github.com/abhigyanpatwari/GitNexus`, lập chỉ mục đồ thị mã nguồn, cài đặt các skills/agents cần thiết và kiểm tra tương thích với `codegraph`.
4. **Tư vấn Tiếp thị & B2B Readiness:** Đánh giá mức độ hoàn thiện của MVP để chào hàng cho Bankers, xây dựng kịch bản tiếp cận và lộ trình kiếm tiền.

---

### B. Việc Đã Thực Hiện Trong Sprint 95 (What Was Done)

#### 1. Khắc Phục Triệt Để Token Truncation & Phục Hồi Dữ Liệu Thật:
- **Nguyên nhân gốc rễ:** Model `gemini-flash-latest` bật chế độ ngẫm (thinking) ngốn ~1,700 tokens ngầm, chạm trần `maxOutputTokens: 2048`, đứt gãy giữa chừng với `finishReason: MAX_TOKENS`. Backend lưu bản ghi lỗi và vĩnh viễn trả về cache cũ.
- **Giải pháp:**
  - Nâng `maxOutputTokens` lên **8,192** và đặt `thinkingConfig: { thinkingBudget: 0 }` trong `gemini-chat-adapter.ts`.
  - Bổ sung kiểm tra nghiêm ngặt `finishReason !== 'STOP'` để loại bỏ văn bản lỗi.
  - Thêm cờ `force?: boolean` và hàm `upsertAnnualReport` để cho phép tái tạo cưỡng chế.
  - **Sửa trực tiếp bản ghi Production:** Lá số của Đại Ka đã được cập nhật bản văn hoàn chỉnh **8,032 ký tự**, đủ 12 tháng và mục kết luận cải vận.
  - Thêm thanh cuộn vàng hoàng gia `::-webkit-scrollbar` vào modal hiển thị.

#### 2. Kiểm Toán Nền Kinh Tế XU & Hóa Đơn ₫13.6K:
- Làm rõ con số: **₫13.6K = 13.600 VNĐ** (chưa tới 1 cốc cà phê, tích lũy suốt 14 ngày dev test).
- **Unit Economics Vi Mô:**
  - Giá API cho 1 Báo Cáo Năm: **~27 VNĐ**.
  - Giá bán cho người dùng: **15 XU (15.000 VNĐ)**.
  - **Biên lợi nhuận gộp (Gross Margin): > 99.8%**.
  - Tặng 15 XU tân thủ chỉ tốn tối đa ~27 VNĐ tiền API cho mỗi người dùng thật (đã chặn bot bằng Anti-Sybil email verification).
- Tạo tài liệu phân tích chuyên sâu tại: `docs/sprint-95-tokenomics-gemini-cost-analysis-and-monetization-proposal.md`.

#### 3. Tích Hợp GitNexus Knowledge Graph & Cài Đặt 15 Agent Skills:
- Chạy `npx gitnexus analyze`: Lập chỉ mục thành công **30,187 nodes, 877,416 edges, 1,058 clusters, 300 flows** trong 36.2s.
- Cài đặt **15 Agent Skills** vào `.agents/skills/`:
  - 6 skills quy trình: `gitnexus-guide`, `gitnexus-impact-analysis`, `gitnexus-debugging`, `gitnexus-exploring`, `gitnexus-refactoring`, `gitnexus-cli`.
  - 9 skills chuyên biệt theo module ViOS: `gitnexus-area-ziwei`, `gitnexus-area-bazi`, `gitnexus-area-liuyao`, `gitnexus-area-qimen`, `gitnexus-area-chart`, `gitnexus-area-ai`, `gitnexus-area-services`, `gitnexus-area-repositories`, `gitnexus-area-api-client`.
- Cấu hình MCP Server `gitnexus` vào cả `~/.gemini/antigravity-ide/mcp_config.json` và `~/.gemini/config/mcp_config.json`.
- Tạo tài liệu kiểm chứng tại: `docs/sprint-95-gitnexus-codebase-knowledge-graph-and-skills-integration.md`.

---

### C. Kết Quả Kiểm Thử (Verification Gates)
- **API Tests:** 575/575 tests passed (89 files).
- **Web Tests:** 428/428 tests passed (81 files).
- **Tổng số tests toàn repo:** **1,003/1,003 tests passed (100%)**.
- **Typecheck Monorepo:** 10/10 tasks successful (Full Turbo).
- **Svelte Diagnostics:** 0 errors, 0 warnings.
- **Database Integrity (`pnpm check:db`):** 100% đạt chuẩn, 0 tài khoản âm tiền.

---

## 2. PHÂN TÍCH TƯƠNG THÍCH GIỮA GITNEXUS VÀ CODEGRAPH

Đại Ka đặt câu hỏi: *"GitNexus update codebase và CodeGraph có active không, có xung đột nhau không?"*

👉 **KẾT LUẬN: CẢ HAI ĐỀU ACTIVE, HOẠT ĐỘNG HOÀN TOÀN ĐỘC LẬP VÀ KHÔNG XUNG ĐỘT.**

| Tiêu Chí So Sánh | GitNexus (v1.6.3) | CodeGraph (v1.5.0) | Đánh Giá Xung Đột |
| :--- | :--- | :--- | :---: |
| **Thư mục lưu trữ** | `.gitnexus/` (Đã có trong `.gitignore`) | `.codegraph/` (Đã có trong `.gitignore`) | ✅ Không đè file |
| **Vị trí nhị phân CLI** | `/Users/gray/.npm-global/bin/gitnexus` | `/Users/gray/.npm-global/bin/codegraph` | ✅ Hai binary riêng biệt |
| **Cơ chế lưu trữ Graph**| LadybugDB (Embedded Graph DB) | File SQLite / JSON graph | ✅ Database tách bạch |
| **Máy chủ MCP** | Server name: `gitnexus` (stdio) | Server name: `codegraph` (nếu bật) | ✅ Tên MCP độc lập |
| **Thư mục Skills** | Prefix: `gitnexus-*` và `gitnexus-area-*` | Không can thiệp vào prefix gitnexus | ✅ Tên skill không trùng lặp |
| **Vai trò bổ trợ** | Phân tích AST, Blast radius, Call chain, MCP tools cho Agent | Trực quan hóa sơ đồ quan hệ file nhanh | 🤝 Bổ trợ hoàn hảo cho nhau |

---

## 3. LỘ TRÌNH VIBE-ENGINEERING-WORKFLOW CHO SPRINT 96

Trong Sprint 96 tới, chúng ta sẽ tập trung vào 3 mũi nhọn:

### 1. Kỹ Thuật: Triển Khai "Định Tuyến Model Đa Tầng" (Dynamic Model Tiering)
- Cấu hình `gemini-2.0-flash-lite` cho các tác vụ vi mô: Chat hỏi đáp 1 XU, Rút bài Tarot 3 XU, Gieo quẻ 5 XU, Tra cứu Lịch hoàng đạo.
- Giữ `gemini-2.5-flash` tắt thinking cho các tác vụ cao cấp: Luận giải 10 XU, Báo cáo năm 15 XU, Hồ sơ 50 XU.
- **Mục tiêu:** Giảm thêm 50-70% chi phí vận hành API, tăng tốc độ phản hồi dưới 600ms.

### 2. Sản Phẩm: Ra Mắt Gói Combo Mùa Vận Hạn "Bính Ngọ Khởi Sắc 2026" (79k - 99k)
- Tạo gói nạp Seasonal tại `/pricing` và `/wallet`.
- Quyền lợi: 100 XU + Tặng sẵn 1 Báo Cáo Năm 2026 trọn đời + 1 Quẻ đầu năm + Huy hiệu "Khai Vận 2026".

### 3. Kinh Doanh / B2B: Khởi Động Kênh "Banker & Wealth Manager Pilot"
- Xây dựng trang đích (Landing Section) định vị ViOS thành: *"Quà Tặng Số Mệnh Hoàng Gia Dành Cho Khách Hàng VIP Của Ngân Hàng"*.
- Tạo cơ chế mua sỉ Voucher Pack (gói 500k nhận 1.000 XU) để Banker xuất Hồ Sơ Hoàng Gia 19 Trang PDF đi tặng khách VIP.
- Phát tán kịch bản Pitching tới các nhóm cộng đồng Banker và Môi giới Bất động sản theo playbook đã soạn thảo.

---

## 4. TÌNH TRẠNG GIT & BẢO MẬT (VIBE-GIT-MANAGER)

- **Nhánh:** `main`
- **Lịch sử commit mới nhất:**
  - `bcb9c6d`: `feat(gitnexus): integrate codebase knowledge graph and install 15 agent skills`
  - `e5bd7eb`: `feat(tokenomics): resolve annual report truncation, audit gemini cost and deliver monetization blueprint`
- **Secret Hygiene:** Tuyệt đối an toàn (các file `.env`, `.env.local`, `.gemini`, `.claude` đều được kiểm tra `git check-ignore`).
- **Trạng thái:** Working tree hoàn toàn sạch sẽ (`clean`), 2 commit đã nằm an toàn trên local `main`. Nếu Đại Ka muốn đẩy lên remote GitHub/Vercel thì chỉ cần chạy `git push origin main`.

---

## 5. PROMPT KHỞI ĐỘNG SESSION MỚI (COPY-PASTE READY CHO ĐẠI KA)

Khi mở session mới, Đại Ka chỉ cần dán đoạn prompt chuẩn bị sẵn dưới đây để Agent tiếp nối mạch làm việc 100%:

```markdown
Chào bro! Chúng ta tiếp tục phát triển dự án "Tử Vi Toàn Tập (ViOS)" — domain: https://tuvitoantap.online.

HIỆN TRẠNG DỰ ÁN:
- Vừa hoàn thành xuất sắc Sprint 95 (Tokenomics, Khắc phục lỗi Báo Cáo Năm bị cắt cụt, Kiểm toán hóa đơn Gemini 13.6k và Tích hợp GitNexus Knowledge Graph với 15 skills).
- Tài liệu bàn giao chi tiết: docs/sprint-95-session-handover-and-sprint-96-kickoff.md và docs/sprint-95-tokenomics-gemini-cost-analysis-and-monetization-proposal.md.
- Nhánh git: main, working tree clean, 1.003/1.003 tests passed (575 API + 428 Web), svelte-check 0 errors 0 warnings, turbo typecheck 10/10 tasks successful.
- GitNexus (v1.6.3) và CodeGraph (v1.5.0) đều active, không xung đột. Lập chỉ mục 30,187 nodes, 877,416 edges hoàn tất.

MỤC TIÊU SPRINT 96:
1. Triển khai Dynamic Model Tiering: Cấu hình gemini-2.0-flash-lite cho tác vụ nhẹ (Chat 1 XU, Tarot 3 XU) và gemini-2.5-flash cho tác vụ chuyên sâu (Báo cáo năm 15 XU, Hồ sơ 50 XU) để tối ưu chi phí thêm 60%.
2. Ra mắt Gói Combo Mùa Vận Hạn "Bính Ngọ Khởi Sắc 2026" (79.000đ nhận 100 XU + Báo Cáo Năm 2026 trọn đời).
3. Triển khai gói B2B2C Voucher Pack và Landing Section chào hàng cộng đồng Bankers / Wealth Managers.

Đồng ý tiến hành với /vibe-engineering-workflow, /behavior-model-debugger và /vibe-git-manager. Bắt đầu ngay cho tôi!
```
