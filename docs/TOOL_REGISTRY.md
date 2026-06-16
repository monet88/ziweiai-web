# Tool Registry

The Tool Registry là tầng quản lý **công cụ ngoài tùy chọn** (linter, code-graph
server, deploy check, MCP server, skill, HTTP endpoint…) mà harness có thể dùng
nhưng **không phụ thuộc** vào bất kỳ cái nào. Bạn đăng ký một tool như một nhà
cung cấp (*provider*) cho một **capability**; harness quét xem nó có thực sự hiện
diện hay không; và một bước trong workflow dùng đúng thứ đang được trang bị —
một tool vắng mặt là một **clean skip**, không bao giờ là một failure.

Đây là phần triển khai của Responsibility #3 (Tool access) trong
`docs/HARNESS_COMPONENTS.md`. Manifest máy-đọc-được được phơi ra qua
`scripts/bin/harness-cli query tools`; định nghĩa thuật ngữ ở `docs/GLOSSARY.md`
("Tool Registry").

> Trên Windows dùng `scripts/bin/harness-cli.exe`; trên macOS/Linux dùng
> `scripts/bin/harness-cli`. Các ví dụ dưới đây lược bỏ phần mở rộng cho gọn.

## Mô hình

Một tool đã đăng ký có các trường sau (xem `harness-cli tool register --help`):

| Trường | Bắt buộc | Ý nghĩa |
|---|---|---|
| `--name` | ✅ | Định danh duy nhất của tool. |
| `--command` | ✅ | Lệnh/đường dẫn để gọi tool. |
| `--description` | ✅ | Mô tả ngắn tool làm gì. |
| `--responsibility` | ✅ | Responsibility nó phục vụ (vd `Verification`, `ContextSelection`) — ánh xạ tới bản đồ trong `docs/HARNESS_COMPONENTS.md`. |
| `--capability` | — | Mục đích workflow mà một bước tra cứu tool theo đó (kebab-case, vd `deploy-verification`). |
| `--kind` | — | Cách tool được gọi và dò: `cli` (mặc định), `binary`, `mcp`, `skill`, `http`. |
| `--args` | — | Tham số mặc định truyền kèm `--command`. |
| `--scan` | — | Đường dẫn/URL khai báo mà `tool check` dùng để quyết định hiện diện. |
| `--force` | — | Ghi đè bản đăng ký trùng tên. |

`kind` làm cho registry **agent-generic**: mỗi runtime agent dùng những gì nó có
thể điều phối (một agent CLI dùng `cli`/`binary`, một agent có MCP dùng `mcp`…).

## Vòng đời

```bash
# 1) Đăng ký một tool như provider của một capability
scripts/bin/harness-cli tool register --name deploy-check --kind cli \
  --capability deploy-verification --command ./scripts/deploy-check.sh \
  --responsibility Verification --description "Verify deploy health before release"

# 2) Quét hiện diện (ghi trạng thái present/missing/unknown vào durable layer)
scripts/bin/harness-cli tool check            # quét tất cả
scripts/bin/harness-cli tool check --name deploy-check   # quét một tool

# 3) Một bước workflow tra cứu thứ đang được trang bị cho một mục đích
scripts/bin/harness-cli query tools --capability deploy-verification --status present

# Gỡ đăng ký khi không còn dùng
scripts/bin/harness-cli tool remove --name deploy-check
```

### Tra cứu manifest

```bash
scripts/bin/harness-cli query tools                 # toàn bộ manifest
scripts/bin/harness-cli query tools --summary       # dạng rút gọn
scripts/bin/harness-cli query tools --json          # máy đọc
scripts/bin/harness-cli query tools --responsibility Verification
scripts/bin/harness-cli query tools --capability <cap> --status present
```

`--status` lọc theo kết quả quét gần nhất: `present`, `missing`, `unknown`.

## Degrade ladder

Quy tắc khi một bước cần một capability: **dùng bậc cao nhất đang `present`, tụt
xuống bậc kế khi vắng, và một bậc thấp nhất luôn là clean skip** — không bao giờ
biến tool vắng mặt thành lỗi cứng.

1. **Equipped + present** — có tool đăng ký cho capability và `tool check` báo
   `present`. Bước chạy tool thật, ghi kết quả vào trace như bằng chứng.
2. **Equipped + missing/unknown** — có đăng ký nhưng quét báo vắng/không rõ.
   Bước bỏ qua tool đó, thử provider kế tiếp của cùng capability (nếu có), và
   ghi nhận sự vắng mặt như friction nếu nó cản trở verify.
3. **Not equipped** — không có provider nào cho capability. Bước skip sạch
   (clean skip) và tiếp tục; đây là hành vi mặc định, không phải failure.

Hệ quả: harness **chạy được trên môi trường tối thiểu** (chỉ có harness-cli) và
**tận dụng được nhiều hơn** khi môi trường giàu tool, mà không thay đổi luồng.

## Wire một tool vào flow step

1. Xác định **capability** mà bước cần (kebab-case, vd `lint`, `typecheck`,
   `deploy-verification`, `code-graph`).
2. `tool register` một hoặc nhiều provider cho capability đó, kèm `--scan` để
   `tool check` biết cách dò hiện diện.
3. Trong bước workflow, `query tools --capability <cap> --status present` để lấy
   provider khả dụng; nếu rỗng → clean skip theo degrade ladder.
4. Sau khi chạy, ghi kết quả vào `trace` (`--actions`/`--errors`) và cập nhật
   proof story nếu tool phục vụ verification.

## Trạng thái hiện tại của repo

- Lệnh `query tools` / `tool register` / `tool check` / `tool remove` đã tồn tại
  trong `harness-cli` (v0.1.10) — xác nhận qua `--help`.
- Bảng `tool` đã được tạo qua migration 003 (`scripts/schema/003-tool.sql`).
  `query tools` liệt kê 30 compiled/builtin tools (init, migrate, intake, story,
  decision, backlog, trace, score-trace, score-context, audit, propose, query *,
  tool register/remove, intervention add). Chưa có tool **ngoài** (external) nào
  được đăng ký — mọi bước hiện rơi vào bậc "Not equipped" (clean skip) của
  degrade ladder, đúng hành vi mặc định.
- Việc còn thiếu (theo `docs/HARNESS_COMPONENTS.md` #3): permission profiles và
  usage analytics cho tool vẫn là future work.
