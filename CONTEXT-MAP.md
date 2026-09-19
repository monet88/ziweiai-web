# Context Map

## Contexts

- [Contracts](./packages/contracts/CONTEXT.md): Độc lập, định nghĩa toàn bộ Zod DTOs, domain models, và schemas trao đổi giữa client và server.
- [Astro Engine](./packages/astro-engine/CONTEXT.md): Server-only, xử lý an sao Tử Vi, lập bàn Bát Tự, Kỳ Môn, Lục Hào, Mai Hoa, Đại Lục Nhâm.
- [Xuanshu Runtime](./packages/xuanshu-runtime/): Server-only, runtime cầu nối giải thuật số cổ truyền Lục Hào, Đại Lục Nhâm, Kỳ Môn Độn Giáp.
- [Core](./packages/core/CONTEXT.md): Server-only, cung cấp thuật toán lịch âm dương, tính toán tiết khí, can chi và chốt chặn bảo vệ ngôn ngữ.
- [API](./apps/api/CONTEXT.md): NestJS backend điều phối engine thuật số, AI explanation providers (Gemini, DeepSeek, OpenAI), quota, ví XU và persistence.
- [Web](./apps/web/CONTEXT.md): SvelteKit SPA (Svelte 5 runes, scoped CSS) giao diện người dùng, nghi thức an quẻ, hiển thị lá số và hỏi đáp AI.
- [Mobile](./apps/mobile/CONTEXT.md): Flutter client (iOS & Android) với trợ lý giọng nói, thông báo đẩy FCM, nạp XU qua VietQR & In-App Purchase.
## Relationships

- **Web → Contracts**: Web client CHỈ ĐƯỢC PHÉP import `@ziweiai/contracts`, tuyệt đối không import engine hoặc core.
- **Web → API**: Giao tiếp qua REST API và SSE streams, dữ liệu chuẩn hóa qua DTOs của Contracts.
- **API → Contracts**: Xác thực toàn bộ request/response bằng Zod schemas của Contracts.
- **API → Astro Engine**: Gọi engine server-only để tính toán tọa độ sao và cấu trúc lá số.
- **API → Core**: Sử dụng các hàm tiện ích lịch pháp và bộ kiểm tra CJK guard.
- **Astro Engine → Core**: Kế thừa các phép biến đổi ngày tháng âm lịch, can chi và ánh xạ token tiếng Việt.
- **Astro Engine → Xuanshu Runtime**: Cầu nối gọi runtime giải thuật Lục Hào, Đại Lục Nhâm, Kỳ Môn.
- **Mobile → API**: Giao tiếp qua REST API và SSE streams, sử dụng Bearer token Supabase.
