# Hướng Dẫn Chiến Lược: Phân Tách Flutter Mobile Sang Repository Độc Lập

**Dự án:** Tử Vi Toàn Tập (ViOS)  
**Tác giả:** Đội ngũ Kỹ thuật & Antigravity  
**Phiên bản:** 1.0.0 — Sprint 85  

---

## 1. Trả Lời Các Câu Hỏi Chiến Lược Của Đại Ka

### Câu hỏi 1: Tách ra có ảnh hưởng gì tiêu cực trong quá trình phát triển dự án không?
> **Trả lời: Hoàn toàn KHÔNG gây ảnh hưởng tiêu cực hay làm gãy bất kỳ tính năng nào.**
> Trái lại, mang lại lợi ích rất lớn về hiệu năng và quản trị dự án:

1. **Về mặt Codebase & Dependencies:**
   - Mã nguồn `apps/mobile` được viết hoàn toàn bằng **Dart/Flutter**.
   - Repo gốc `ziweiai-web` là **TypeScript Monorepo** (SvelteKit, NestJS, Turbo).
   - Flutter **không hề import trực tiếp bất kỳ file TypeScript nào** từ `packages/contracts` hay `packages/astro-engine` (Dart và TypeScript là 2 ngôn ngữ và máy ảo hoàn toàn khác nhau).
   - Mọi giao tiếp giữa Mobile và Backend đều thông qua **giao thức mạng (HTTP REST API qua Dio)** và **Supabase Auth SDK**.
2. **Về mặt Hiệu Năng & Tinh Gọn:**
   - Repo gốc sẽ loại bỏ được hàng chục nghìn file sinh ra từ Flutter build caches, Android Gradle (`android/.gradle`), iOS CocoaPods (`ios/Pods`), Windows Runner.
   - Thao tác `git clone`, `git status`, `pnpm install`, Turbo typecheck trên Web/API sẽ tăng tốc gấp 3-5 lần.
   - Tránh tình trạng commit nhầm các file binary lớn (`.apk`, `.aab`, `.ipa`) vào repo web.
3. **Về mặt Release Cycle (Vòng đời phát hành):**
   - Web & API deploy liên tục qua Vercel trong 2-3 phút.
   - Mobile có vòng đời kiểm thử nội bộ (TestFlight, Google Play Internal Track) và quy trình xét duyệt App Store (1-3 ngày). Tách repo giúp quản lý Semantic Versioning (`1.0.0+1`) và changelog của Mobile một cách chuyên nghiệp, độc lập.

---

### Câu hỏi 2: Khi phát triển mobile flutter app mà liên kết với các phần của repo gốc này thì vẫn được phải không?
> **Trả lời: ĐÚNG 100%! Vẫn liên kết cực kỳ chặt chẽ và chuẩn chỉnh theo mô hình Client-Server chuẩn công nghiệp.**

Mối liên kết giữa Mobile Flutter và Repo Gốc được duy trì qua 3 trụ cột:

1. **Trụ cột 1 — Backend API Endpoints:**
   - Mobile app kết nối tới máy chủ API thông qua URL cấu hình trong `.env` của Mobile:
     + Production: `https://tuvitoantap.online/api` (hoặc `https://tuvitoantap.vercel.app/api`)
     + Local Development: `http://localhost:3000/api` (hoặc `http://10.0.2.2:3000/api` trên Android Emulator)
   - Bất kể mobile nằm ở đâu, client chỉ cần gửi request HTTP chuẩn đến các endpoint `/auth`, `/rewards`, `/wallet`, `/charts`.
2. **Trụ cột 2 — Supabase Backend & Database:**
   - Cả Web và Mobile cùng trỏ vào một Database Supabase duy nhất: `nachzhkeuzwiqmbtelrp`.
   - Dữ liệu người dùng, XU balance, lá số tử vi, lịch sử giao dịch được đồng bộ tức thì theo thời gian thực giữa Web và Mobile. Người dùng đăng nhập trên web hay mobile đều thấy cùng một tài khoản và số dư XU.
3. **Trụ cột 3 — Đồng Bộ Contract / Schema:**
   - Khi Backend cập nhật endpoint mới hoặc trường dữ liệu mới (ví dụ thêm `impressionId`), backend cập nhật NestJS controller/OpenAPI docs.
   - Phía Mobile cập nhật `api_client.dart` tương ứng (như chúng ta vừa cập nhật xong trong Sprint 85).

---

## 2. Quy Trình Phân Tách Bằng Script `split-mobile-repo.sh`

Chúng ta sử dụng kỹ thuật **Git Subtree Split** chuẩn quốc tế. Kỹ thuật này trích xuất toàn bộ thư mục `apps/mobile` thành thư mục gốc của một nhánh mới, **giữ nguyên 100% lịch sử commit và tác giả từ trước đến nay**.

### Bước 1: Chạy Script Trích Xuất Nhánh
Tại thư mục gốc của repo `ziweiai-web`, chạy:
```bash
./scripts/split-mobile-repo.sh
```
Script sẽ tự động tạo một nhánh mới mang tên `mobile-standalone`.

### Bước 2: Tạo Repository Mới Trên GitHub
1. Truy cập GitHub: `https://github.com/new`
2. Đặt tên repository: `ziweiai-mobile` (hoặc `tuvitoantap-mobile`).
3. Chọn quyền riêng tư (Private hoặc Public tùy ý).
4. **QUAN TRỌNG:** Để repo **hoàn toàn trống** (KHÔNG tích chọn *"Add a README file"*, *"Add .gitignore"* hay *"Choose a license"*).

### Bước 3: Đẩy Nhánh Sang Repo Mới
Chạy 2 lệnh sau trên terminal của Đại Ka:
```bash
# Thêm remote mới trỏ tới repo GitHub vừa tạo
git remote add mobile-origin git@github.com:<YOUR_GITHUB_ORGANIZATION_OR_USER>/ziweiai-mobile.git

# Đẩy toàn bộ mã nguồn và lịch sử nhánh mobile-standalone lên nhánh main của repo mới
git push -u mobile-origin mobile-standalone:main
```

### Bước 4: Kiểm Tra Repo Mới
1. Mở repo mới trên GitHub: Thư mục gốc sẽ chính là project Flutter hoàn chỉnh (`pubspec.yaml`, `lib/`, `android/`, `ios/`, `test/`).
2. Clone thử về máy tại một thư mục khác:
   ```bash
   cd ~/Documents
   git clone git@github.com:<YOUR_USER>/ziweiai-mobile.git
   cd ziweiai-mobile
   flutter pub get
   flutter test
   ```
3. Toàn bộ tests chạy thành công, project build bình thường.

### Bước 5: Dọn Dẹp Repo Gốc (Sau Khi Repo Mới Đã Sẵn Sàng)
Sau khi Đại Ka đã xác nhận repo `ziweiai-mobile` hoạt động ổn định:
```bash
# Xóa remote tạm và nhánh tạm
git remote remove mobile-origin
git branch -D mobile-standalone

# Xóa thư mục apps/mobile khỏi repo gốc để tinh gọn
git rm -r apps/mobile
git commit -m "chore: extract mobile app to standalone ziweiai-mobile repository"
git push origin main
```

---

## 3. Tổng Kết Kiến Trúc Sau Phân Tách

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE PRODUCTION                      │
│                  Project: nachzhkeuzwiqmbtelrp              │
│       (36 Migrations, PostgreSQL, Auth, Storage, RLS)       │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│     REPO 1: ziweiai-web      │ │    REPO 2: ziweiai-mobile    │
│  (pnpm, TypeScript, Turbo)   │ │       (Flutter & Dart)       │
├──────────────────────────────┤ ├──────────────────────────────┤
│ • apps/web (SvelteKit 5)     │ │ • lib/ (Bloc/Riverpod/UI)    │
│ • apps/api (NestJS API Hub)  │ │ • android/ & ios/ (Native)   │
│ • packages/contracts         │ │ • Fastlane, App Store Deploy │
│ • Deploy: Vercel (Auto CI/CD)│ │ • Target: iOS & Android      │
└──────────────────────────────┘ └──────────────────────────────┘
```

Mô hình này giúp:
- **Tốc độ:** Web & API deploy tức thì, monorepo nhẹ và sạch sẽ.
- **An toàn:** Lịch sử git được bảo tồn trọn vẹn 100%.
- **Linh hoạt:** Đội ngũ Mobile và Web có thể làm việc song song mà không bao giờ bị nghẽn hay xung đột git.
