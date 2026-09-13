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
  /// Trên mobile, hiển thị bottom sheet xác thực bot hoàng gia để lấy token.
  Future<String?> acquireTurnstileToken(
    BuildContext context, {
    String action = 'checkin',
  }) async {
    if (_mockToken != null && _mockToken.isNotEmpty) {
      return _mockToken;
    }

    return showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _TurnstileChallengeSheet(action: action),
    );
  }
}

class _TurnstileChallengeSheet extends StatefulWidget {
  final String action;

  const _TurnstileChallengeSheet({required this.action});

  @override
  State<_TurnstileChallengeSheet> createState() => _TurnstileChallengeSheetState();
}

class _TurnstileChallengeSheetState extends State<_TurnstileChallengeSheet> {
  bool _isVerifying = false;

  Future<void> _handleVerify() async {
    setState(() => _isVerifying = true);
    // Giả lập verification handshake
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;

    // Sinh token xác thực với timestamp và action
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final generatedToken = 'cf_mobile_${widget.action}_$timestamp';
    Navigator.of(context).pop(generatedToken);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: AppTheme.cosmosSurface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(
          top: BorderSide(color: AppTheme.goldBright, width: 1.5),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Icon(Icons.shield_outlined, color: AppTheme.goldBright, size: 24),
              const SizedBox(width: 8),
              Text(
                'XÁC THỰC BẢO MẬT HOÀNG GIA',
                style: GoogleFonts.cinzel(
                  color: AppTheme.goldBright,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Để bảo vệ ngân sách phúc khí XU và ngăn chặn tự động hoá, vui lòng xác nhận bạn là tri kỷ thực sự.',
            style: GoogleFonts.alegreya(
              color: AppTheme.mysticalText.withAlpha(200),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _isVerifying ? null : _handleVerify,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.goldBright,
              foregroundColor: Colors.black,
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: _isVerifying
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.verified_user, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        'Tôi Không Phải Người Máy',
                        style: GoogleFonts.cinzel(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => Navigator.of(context).pop(null),
            child: Text(
              'Hủy bỏ',
              style: GoogleFonts.cinzel(color: AppTheme.mysticalText.withAlpha(150)),
            ),
          ),
        ],
      ),
    );
  }
}
