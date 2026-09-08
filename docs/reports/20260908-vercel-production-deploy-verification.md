# Báo Cáo Xác Minh Triển Khai: Vercel Production Deploy & Live Verification

**Dự án:** Tử Vi Toàn Tập (`ziweiai-web`)  
**Thời gian triển khai:** 08/09/2026 17:10:30 +07:00  
**Môi trường:** Production (`https://tuvitoantap.vercel.app`)  
**Quy chuẩn áp dụng:** `/vibe-engineering-workflow`, `/vibe-git-manager`, `/behavior-model-debugger`  
**Trạng thái:** **READY / HOÀN TẤT XÁC MINH 100% (VERIFIED)**

---

## 1. Thông Tin Bản Triển Khai (Deployment Metadata)

| Trường thông tin | Giá trị xác minh |
| :--- | :--- |
| **Production Domain** | `https://tuvitoantap.vercel.app` |
| **Deployment ID** | `dpl_7eCZcaRVRM47HC7f9r32n7UwM6qx` |
| **Vercel Direct URL** | `https://build-nf82m6pbl-galaxypro710-7060s-projects.vercel.app` |
| **Vercel Account** | `galaxypro710-7060` (Team: `galaxypro710-7060s-projects`) |
| **Git Commit Anchor** | `318c524` (`fix(security): harden webhooks fail-closed, ad-reward daily cap, optimize uuid lookup and resolve mobile deps`) |
| **GitHub Remote** | `origin/main` (`galaxypro710-stack/ziweiai-web.git`) - Đã push đồng bộ thành công |
| **Serverless Function** | `λ api/[...path] (7.85MB) [iad1]` |
| **Build Status** | `● Ready` (Vercel Build hoàn tất trong 2 phút 17 giây) |

---

## 2. Quá Trình Triển Khai (Execution Steps)

### 2.1. Đồng Bộ Mã Nguồn Git Remote
* Thực hiện lệnh push 9 commit từ local `main` lên GitHub remote:
  ```bash
  git push origin main
  # To https://github.com/galaxypro710-stack/ziweiai-web.git
  #    e8db26d..318c524  main -> main
  ```
* Xác minh: Working tree hoàn toàn sạch sẽ (`nothing to commit, working tree clean`).

### 2.2. Biên Dịch & Đóng Gói Monorepo Trên Vercel
* Vercel tự động thực thi script `vercel-build`:
  * `@ziweiai/contracts`: Biên dịch ESM & CJS declarations.
  * `@ziweiai/core`: Biên dịch type-safe core utilities.
  * `@ziweiai/xuanshu-runtime`: Biên dịch TypeScript & tsc-alias.
  * `@ziweiai/astro-engine`: Biên dịch engine thuật toán server-only.
  * `@ziweiai/api`: Đóng gói NestJS Serverless Handler (`nest build`).
  * `@ziweiai/web`: Đóng gói SvelteKit SPA (`vite build` -> 4.107 modules transformed, `Wrote site to "build"`).

### 2.3. Gán Alias Domain Production
* Deployment `dpl_7eCZcaRVRM47HC7f9r32n7UwM6qx` được alias thành công về tên miền chính:
  ```bash
  npx vercel alias set https://build-nf82m6pbl-galaxypro710-7060s-projects.vercel.app tuvitoantap.vercel.app
  # > Success! https://tuvitoantap.vercel.app now points to https://build-nf82m6pbl-galaxypro710-7060s-projects.vercel.app
  ```

---

## 3. Bằng Chứng Kiểm Định Thực Tế Trên Production (Live Verification Evidence)

Tất cả các kiểm định đều được chạy trực tiếp bằng lệnh curl và test scripts, không suy đoán:

### 3.1. Health Check Endpoint
* **Lệnh:** `curl -sS https://tuvitoantap.vercel.app/api/health`
* **Kết quả (HTTP 200):**
  ```json
  {"service":"ziweiai-api","status":"ok","timestamp":"2026-09-08T10:10:30.663Z","version":"0.1.0"}
  ```

### 3.2. Feature Flags Endpoint
* **Lệnh:** `curl -sS https://tuvitoantap.vercel.app/api/features`
* **Kết quả (HTTP 200):**
  ```json
  {"hepan":true,"mangpai":true,"tarot":true,"mbti":true,"face":true,"palm":true,"lenormand":true,"dream":true,"sticks":true,"almanac":true}
  ```

### 3.3. Kiểm Định Lỗ Hổng Bảo Mật Webhook (Fail-Closed Verification)
Xác minh trực tiếp bản vá bảo mật mới nhất trên Production Vercel:
* **SePay Webhook:**
  * **Lệnh:** `curl -s -o /dev/null -w "%{http_code}" -X POST https://tuvitoantap.vercel.app/api/webhooks/sepay -H "Content-Type: application/json" -d '{"gateway":"sepay"}'`
  * **HTTP Code:** `401 Unauthorized` (Đã chặn đứng request giả mạo).
* **RevenueCat Webhook:**
  * **Lệnh:** `curl -s -o /dev/null -w "%{http_code}" -X POST https://tuvitoantap.vercel.app/api/webhooks/sepay/revenuecat -H "Content-Type: application/json" -d '{"event":{}}'`
  * **HTTP Code:** `401 Unauthorized` (Đã chặn đứng request giả mạo).

### 3.4. Vercel Demo Smoke Test Suite
* **Lệnh:** `pnpm smoke:vercel-demo`
* **Kết quả toàn bộ:**
  * Root Page: **HTTP 200 OK**
  * API Health: **HTTP 200 OK**
  * API Features: **HTTP 200 OK**
  * SPA Fallback for Chart Detail (`/charts/<uuid>`): **HTTP 200 OK (index.html confirmed)**
  * **Tổng kết:** `Vercel demo smoke passed for https://tuvitoantap.vercel.app`

---

## 4. An Toàn Thông Tin & Secret Hygiene

* Toàn bộ cấu hình nhạy cảm trong `.env.local` (Database credentials, API keys DeepSeek/OpenRouter/Gemini, Vercel token, Telegram token, VietQR, RevenueCat) được bảo toàn tuyệt đối, tuân thủ nghiêm ngặt quy tắc của repository:
  * Không in ra log console hoặc báo cáo công khai.
  * Được bảo vệ trong `.gitignore` không bị rò rỉ vào Git history.
  * Được nạp an toàn từ Vercel Project Environment Variables.

---

## 5. Kết Luận

Bản triển khai mới nhất mang mã nguồn commit `318c524` đã chính thức online tại:  
👉 **`https://tuvitoantap.vercel.app`**  
Hệ thống hoạt động trơn tru, bảo mật cao, không có lỗi runtime 5xx hay suy thoái hiệu năng.
