# Báo cáo: Refactor UsersService - Loại bỏ truy vấn SQL trực tiếp

## 1. Mục tiêu (Goal)
- **Vấn đề cốt lõi:** `UsersService` hiện tại đang "rò rỉ" (leak) truy vấn cơ sở dữ liệu khi trực tiếp gọi SQL client qua Supabase để lấy thông tin ví Xu (`this.client.from('profiles').select('xu_balance')`). Việc này vi phạm tính module (Deep Module) và khiến logic database bị trộn lẫn với business logic.
- **Giải pháp hướng tới:** Xây dựng một Seam rõ ràng tại Database Layer. Chúng ta cần cập nhật `SupabasePersistenceGateway` để đảm nhận trọn vẹn truy vấn `profiles`, từ đó tiêm (inject) Gateway này vào `UsersService`.

## 2. Công việc đã thực hiện (Actions Taken)

1. **Chuẩn hoá Contract/Domain Entity:**
   - Cập nhật `profileRecordSchema` trong `@ziweiai/contracts` (file `persistence-records.ts`).
   - Bổ sung trường `xuBalance` (`z.number().nonnegative().default(0)`) vào schema và thêm Type `ProfileRecord` để bao trọn mọi thông tin cần thiết.

2. **Cập nhật Persistence Mappers:**
   - Tạo phương thức `toProfileRecord(row: SupabaseRow): ProfileRecord` trong `persistence-mappers.ts`.
   - Hàm này giúp chuyển hoá dữ liệu thô dạng `snake_case` từ PostgreSQL (`user_id`, `xu_balance`) thành TypeScript Entity chuẩn dạng `camelCase`.

3. **Củng cố Database Seam (Gateway):**
   - Viết phương thức `findProfileByUserId(userId: string): Promise<ProfileRecord | null>` bên trong `SupabasePersistenceGateway`.
   - Gateway nay chịu trách nhiệm kết nối client, select dữ liệu, gọi mapper `toProfileRecord` hoặc trả về `null` trong trường hợp không tìm thấy, giấu đi chi tiết SQL đối với các thành phần sử dụng nó.

4. **Refactor Business Logic (Service Layer):**
   - Đưa `SupabasePersistenceGateway` vào danh sách Inject của `UsersService`.
   - Cập nhật hàm `getWalletBalance`, thay vì gọi SQL client trực tiếp, giờ đây nó gọi `this.gateway.findProfileByUserId(userId)`. 
   - Xử lý mượt mà ngoại lệ: Nếu profile không tồn tại (trả về `null`), nó ném ra `ApiErrorHttpException` với mã lỗi `500` đồng nhất như phiên bản trước, không làm thay đổi hợp đồng phía Client.

5. **Rà soát bảo mật (.gitignore) và Workflow:**
   - Đã kiểm tra qua `.gitignore` để đảm bảo `.env`, `.env.local`, file key, credential, thư mục agent (`.claude`, `.gemini`, `.agent`, `.agents`) và các file media/build (`apk`, `aab`, `ipa`, `mp4`) đều được exclude chính xác. (Tất cả đã chuẩn từ trước).

## 3. Kết quả (Results)
- Các file sửa đổi:
  - `packages/contracts/src/persistence/persistence-records.ts`
  - `apps/api/src/database/persistence-mappers.ts`
  - `apps/api/src/database/supabase-persistence.gateway.ts`
  - `apps/api/src/modules/users/users.service.ts`
- **Validation:** 
  - Toàn bộ Code được biên dịch lại (typecheck, build contracts).
  - Toàn bộ 407 Unit Tests hiện có đã Pass 100% không ghi nhận Regression bugs nào. Hệ thống giữ được tính ổn định và tính mở rộng cao hơn.

## 4. Rủi ro tiềm ẩn (Risks check)
- Dữ liệu trả về `xuBalance` luôn được đảm bảo chuẩn hoá từ Zod Schema (số tự nhiên không âm).
- Ngoại lệ profile trống (`null`) được bao bọc tốt, không gây rò rỉ `PostgrestError` hoặc `PGRST116` ra bên ngoài API layer. Do vậy không phát hiện rủi ro về logic, workflow vẫn diễn ra đúng thiết kế hệ thống.
