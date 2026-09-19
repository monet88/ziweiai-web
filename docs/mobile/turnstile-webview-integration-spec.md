# TÀI LIỆU KỸ THUẬT: TÍCH HỢP CLOUDFLARE TURNSTILE CHO FLUTTER MOBILE

> **Dự án:** ViOS — Tử Vi Toàn Tập  
> **Phiên bản tài liệu:** 1.0  
> **Mục đích:** Xây dựng giải pháp xác thực người dùng thật (Anti-Sybil Bot Protection) cho ứng dụng Flutter Mobile thông qua Cloudflare Turnstile WebView, cho phép mở lại luồng nhận thưởng tân thủ (15 XU) và điểm danh hàng ngày trên native app một cách bảo mật tuyệt đối.

---

## 1. Bối Cảnh & Đặt Vấn Đề

Tại Sprint 89, kiểm toán đối kháng từ Codex đã chỉ ra hai vấn đề an ninh nghiêm trọng:
1. **Header Spoofing:** Client mobile trước đây có thể gửi `X-Client-Platform: mobile` để vượt qua hàng rào Turnstile trên backend.
2. **Fake Mobile Token:** Client mobile tự sinh chuỗi `cf_mobile_*` giả lập, không có giá trị bảo vệ cryptographic.

Hệ thống đã được khắc phục ở Sprint 89 bằng cách:
- **Backend API Fail-Closed 100%:** Mọi endpoint nhận thưởng (`/api/referral/claim`, `/api/wallet/claim-welcome-bonus`, `/api/wallet/claim-daily-checkin`) bắt buộc phải có `turnstileToken` hợp lệ do Cloudflare cấp, được backend xác thực qua `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
- **Client Mobile Guard:** Tạm thời khóa các request nhận thưởng native và hướng dẫn người dùng thực hiện trên Web MVP (`https://tuvitoantap.online`).

---

## 2. So Sánh Các Phương Án Kỹ Thuật

| Tiêu Chí | Phương Án A: Turnstile WebView (Khuyến Nghị) | Phương Án B: Native Attestation (Play Integrity / DeviceCheck) |
| :--- | :--- | :--- |
| **Tính tương thích Backend** | **100% tương thích ngay lập tức**. Dùng chung token format và cùng endpoint xác thực Cloudflare hiện tại. | Cần viết thêm module giải mã chữ ký JWT từ Google / Apple trên NestJS API. |
| **Độ phức tạp Client** | Đơn giản: Nhúng `webview_flutter` với một trang widget siêu nhẹ (`turnstile-widget.html`). | Phức tạp: Tích hợp 2 SDK độc lập (`play_integrity` cho Android, `device_check` cho iOS). |
| **Chi phí & Yêu cầu tài khoản** | **Miễn phí 100%**, không cần tài khoản developer trả phí để kích hoạt. | Yêu cầu GCP Project liên kết Google Play Console & Apple Developer Program ($99/năm). |
| **Trải nghiệm người dùng (UX)** | Hiển thị modal mạ vàng đẹp mắt 1-2 giây, người dùng tương tác trực quan. | Chạy ngầm hoàn toàn, nhưng dễ gặp lỗi thiết bị không đạt chuẩn (Rooted, Bootloader unlocked). |
| **Thời gian triển khai** | **1 - 2 ngày** (Đã có sẵn trang web widget). | 1 - 2 tuần (Đòi hỏi thiết lập hạ tầng chứng chỉ và backend validation). |

**=> KẾT LUẬN:** Chọn **Phương án A (Turnstile WebView)** làm giải pháp tiêu chuẩn cho Sprint 90.

---

## 3. Kiến Trúc Chi Tiết Turnstile WebView

```
┌────────────────────────────────────────────────────────┐
│                   Flutter Mobile App                   │
│                                                        │
│  [User taps 'Điểm Danh / Nhận XU']                     │
│               │                                        │
│               ▼                                        │
│  TurnstileMobileService.acquireTurnstileToken(context) │
│               │                                        │
│               ▼                                        │
│  Hiển thị TurnstileBottomSheet (Modal)                │
│       ┌───────────────────────────────────────┐        │
│       │           WebView (In-App)            │        │
│       │  Load: https://tuvitoantap.online/    │        │
│       │        turnstile-widget.html          │        │
│       │                                       │        │
│       │  [Cloudflare Turnstile Challenges]    │        │
│       │               │                       │        │
│       │               ▼ (Pass Challenge)      │        │
│       │  TurnstileBridge.postMessage(token)   │        │
│       └───────────────────────────────────────┘        │
│               │                                        │
│               ▼ (Token nhận được tại Dart)             │
│  Đóng TurnstileBottomSheet, trả về token               │
│               │                                        │
│               ▼                                        │
│  Gửi POST /api/wallet/claim-daily-checkin              │
│       { "turnstileToken": token }                      │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│                   Backend NestJS API                   │
│                                                        │
│  TurnstileService.verifyToken(token)                   │
│  -> POST https://challenges.cloudflare.com/...         │
│  -> Cloudflare trả về: { success: true }              │
│                                                        │
│  -> Cộng XU vào Ví + Ghi Sổ Cái Kép Thành Công!       │
└────────────────────────────────────────────────────────┘
```

---

## 4. Đặc Tả Mã Nguồn & Triển Khai (Implementation Specs)

### 4.1. Trang Web Widget Đã Triển Khai
- URL: `https://tuvitoantap.online/turnstile-widget.html`
- File local: `apps/web/static/turnstile-widget.html`
- Tính năng:
  - Tự động nhận diện theme nền tối huyền bí (`#0d0f18` và màu vàng gold `#e6c687`).
  - Giao tiếp hai chiều với Flutter thông qua JavaScript Channel: `window.TurnstileBridge.postMessage(token)`.

### 4.2. Cấu Hình Dependency Trong `apps/mobile/pubspec.yaml`
```yaml
dependencies:
  webview_flutter: ^4.10.0
```

### 4.3. Widget Mẫu: `TurnstileBottomSheet`
```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../theme/app_theme.dart';

class TurnstileBottomSheet extends StatefulWidget {
  final String action;
  const TurnstileBottomSheet({Key? key, this.action = 'mobile_checkin'}) : super(key: key);

  @override
  State<TurnstileBottomSheet> createState() => _TurnstileBottomSheetState();
}

class _TurnstileBottomSheetState extends State<TurnstileBottomSheet> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(AppTheme.cosmosSurface)
      ..addJavaScriptChannel(
        'TurnstileBridge',
        onMessageReceived: (JavaScriptMessage message) {
          final token = message.message;
          if (token.isNotEmpty && mounted) {
            Navigator.of(context).pop(token);
          }
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
          onNavigationRequest: (NavigationRequest request) {
            // Chỉ cho phép load từ domain chính thức hoặc cloudflare
            if (request.url.startsWith('https://tuvitoantap.online') ||
                request.url.contains('cloudflare.com')) {
              return NavigationDecision.navigate;
            }
            return NavigationDecision.prevent;
          },
        ),
      )
      ..loadRequest(Uri.parse(
        'https://tuvitoantap.online/turnstile-widget.html?action=${widget.action}',
      ));
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 380,
      decoration: const BoxDecoration(
        color: AppTheme.cosmosSurface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(color: AppTheme.goldBright),
            ),
        ],
      ),
    );
  }
}
```

### 4.4. Cập Nhật `TurnstileMobileService`
```dart
class TurnstileMobileService {
  final String? _mockToken;

  TurnstileMobileService({String? mockToken}) : _mockToken = mockToken;

  Future<String?> acquireTurnstileToken(
    BuildContext context, {
    String action = 'checkin',
  }) async {
    if (_mockToken != null && _mockToken.isNotEmpty) {
      return _mockToken;
    }

    // Hiển thị modal WebView để nhận token thật từ Cloudflare
    final token = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => TurnstileBottomSheet(action: action),
    );

    return token;
  }
}
```

---

## 5. Các Rủi Ro & Biện Pháp Phòng Ngừa An Ninh

1. **WebView Hijacking / URL Injection:**  
   *Biện pháp:* Khóa `NavigationDelegate` chỉ cho phép điều hướng tới `https://tuvitoantap.online` và các tài nguyên của `cloudflare.com`.
2. **Replay Token:**  
   *Biện pháp:* Token của Cloudflare Turnstile có tính chất dùng một lần (single-use) và có thời hạn sống tối đa 300 giây. Backend API ghi nhận và từ chối token đã dùng qua Cloudflare API.
3. **Mạng Yếu / AdBlocker:**  
   *Biện pháp:* Có timeout 10 giây trên mobile và nút đóng kèm hướng dẫn người dùng thử lại hoặc kiểm tra kết nối mạng.
