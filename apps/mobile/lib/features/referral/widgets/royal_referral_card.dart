import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';

class RoyalReferralCard extends StatelessWidget {
  final String referralCode;
  final GlobalKey? boundaryKey;
  final bool isExporting;

  const RoyalReferralCard({
    super.key,
    required this.referralCode,
    this.boundaryKey,
    this.isExporting = false,
  });

  static Future<List<int>?> captureCard(GlobalKey key) async {
    try {
      final boundary = key.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return null;

      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      return byteData?.buffer.asUint8List();
    } catch (e) {
      debugPrint('[RoyalReferralCard] captureCard error: $e');
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cardContent = RepaintBoundary(
      key: boundaryKey,
      child: Container(
        width: isExporting ? 400 : double.infinity,
        constraints: const BoxConstraints(maxWidth: 420),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF070B14),
              Color(0xFF130D2E),
              Color(0xFF1B1238),
              Color(0xFF091024),
            ],
            stops: [0.0, 0.35, 0.7, 1.0],
          ),
          border: Border.all(
            color: AppTheme.goldBright.withValues(alpha: 0.8),
            width: 2.0,
          ),
          boxShadow: [
            BoxShadow(
              color: AppTheme.goldBright.withValues(alpha: 0.2),
              blurRadius: 32,
              spreadRadius: 2,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(26),
          child: Stack(
            children: [
              // Họa tiết góc Cung Đình (4 góc)
              Positioned(top: 12, left: 12, child: _buildCornerAccent(true, true)),
              Positioned(top: 12, right: 12, child: _buildCornerAccent(false, true)),
              Positioned(bottom: 12, left: 12, child: _buildCornerAccent(true, false)),
              Positioned(bottom: 12, right: 12, child: _buildCornerAccent(false, false)),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 28.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Huy hiệu Khâm Thiên Giám
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppTheme.goldBright.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.4)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.auto_awesome, color: AppTheme.goldBright, size: 13),
                          const SizedBox(width: 6),
                          Text(
                            '✦ THIỆP MỜI THƯỢNG KHÁCH ✦',
                            style: GoogleFonts.spaceGrotesk(
                              color: AppTheme.goldBright,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Logo & Tiêu đề Hoàng Gia
                    Text(
                      'TỬ VI TOÀN TẬP',
                      style: GoogleFonts.cinzel(
                        color: AppTheme.goldBright,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.0,
                        shadows: [
                          Shadow(
                            color: AppTheme.goldBright.withValues(alpha: 0.5),
                            blurRadius: 16,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Khai mở Thiên cơ · Đón nhận Phúc khí',
                      style: TextStyle(
                        color: AppTheme.mysticalTextSecondary.withValues(alpha: 0.85),
                        fontSize: 12,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Hộp Quà Tặng +20 XU Vận Khí
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0x33B91C1C), Color(0x33D97706)],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.5)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.card_giftcard, color: AppTheme.goldBright, size: 16),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              'TẶNG NGAY +20 XU VẬN KHÍ CUNG ĐÌNH',
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.spaceGrotesk(
                                color: AppTheme.goldBright,
                                fontWeight: FontWeight.w800,
                                fontSize: 10,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 22),

                    // QR Code Cung Đình
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.goldBright.withValues(alpha: 0.3),
                            blurRadius: 20,
                            spreadRadius: 2,
                          ),
                        ],
                        border: Border.all(color: AppTheme.goldBright, width: 3),
                      ),
                      child: QrImageView(
                        data: 'https://tuvitoantap.vercel.app/share/ref/$referralCode',
                        version: QrVersions.auto,
                        size: 140.0,
                        backgroundColor: Colors.white,
                        eyeStyle: const QrEyeStyle(
                          eyeShape: QrEyeShape.square,
                          color: Color(0xFF130D2E),
                        ),
                        dataModuleStyle: const QrDataModuleStyle(
                          dataModuleShape: QrDataModuleShape.square,
                          color: Color(0xFF130D2E),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Mã Giới Thiệu
                    Text(
                      'MÃ PHÚC KHÍ CỦA BẠN',
                      style: TextStyle(
                        color: AppTheme.mysticalTextSecondary.withValues(alpha: 0.7),
                        fontSize: 10,
                        letterSpacing: 1.2,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1B1238),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppTheme.goldBright, width: 1.5),
                      ),
                      child: Text(
                        referralCode,
                        style: GoogleFonts.spaceGrotesk(
                          color: AppTheme.goldBright,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 4.0,
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Lời đề từ dưới chân
                    Text(
                      'Quét mã QR để cùng đàm đạo thiên cơ và khai mở vận mệnh',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppTheme.mysticalTextSecondary.withValues(alpha: 0.8),
                        fontSize: 11,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );

    return cardContent;
  }

  Widget _buildCornerAccent(bool isLeft, bool isTop) {
    return Container(
      width: 14,
      height: 14,
      decoration: BoxDecoration(
        border: Border(
          left: isLeft ? const BorderSide(color: AppTheme.goldBright, width: 2.5) : BorderSide.none,
          right: !isLeft ? const BorderSide(color: AppTheme.goldBright, width: 2.5) : BorderSide.none,
          top: isTop ? const BorderSide(color: AppTheme.goldBright, width: 2.5) : BorderSide.none,
          bottom: !isTop ? const BorderSide(color: AppTheme.goldBright, width: 2.5) : BorderSide.none,
        ),
      ),
    );
  }
}
