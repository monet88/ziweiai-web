import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

/// Provider cung cấp TurnstileMobileService cho toàn bộ ứng dụng
final turnstileServiceProvider = Provider<TurnstileMobileService>((ref) {
  return TurnstileMobileService();
});

/// Dịch vụ xác thực bot Turnstile trên mobile
class TurnstileMobileService {
  final String? _mockToken;

  TurnstileMobileService({String? mockToken}) : _mockToken = mockToken;

  /// Yêu cầu lấy Turnstile token để chống bot
  /// Nếu có mockToken (trong test/dev), trả về ngay lập tức.
  /// Đối với Native Mobile App (Giai đoạn 2 Preview):
  /// Hệ thống hiển thị hộp thoại hướng dẫn người dùng trải nghiệm điểm danh và nhận thưởng
  /// chính thức trên nền tảng Web MVP https://tuvitoantap.online (nơi tích hợp Cloudflare Turnstile chính thức).
  Future<String?> acquireTurnstileToken(
    BuildContext context, {
    String action = 'checkin',
  }) async {
    if (_mockToken != null && _mockToken.isNotEmpty) {
      return _mockToken;
    }

    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cosmosSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppTheme.goldBright, width: 1.5),
        ),
        title: Row(
          children: [
            const Icon(Icons.shield_outlined, color: AppTheme.goldBright, size: 24),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'BẢO MẬT & NHẬN THƯỞNG',
                style: GoogleFonts.cinzel(
                  color: AppTheme.goldBright,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ],
        ),
        content: Text(
          'Hệ thống bảo vệ chống bot Cloudflare Turnstile đang được phục vụ chính thức trên nền tảng Web MVP.\n\nKính mời quý tri kỷ truy cập https://tuvitoantap.online trên trình duyệt để điểm danh và nhận XU phúc khí an toàn!',
          style: GoogleFonts.alegreya(
            color: AppTheme.mysticalText,
            fontSize: 15,
            height: 1.5,
          ),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.goldBright,
              foregroundColor: Colors.black,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(
              'Đã Hiểu',
              style: GoogleFonts.cinzel(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );

    return null;
  }
}
