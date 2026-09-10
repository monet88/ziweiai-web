import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import '../../domain/models/compatibility_models.dart';
import '../../domain/services/compatibility_calculator.dart';

class RoyalCompatibilityCard extends StatelessWidget {
  final CompatibilityResult result;
  final GlobalKey? boundaryKey;
  final bool isExporting;

  const RoyalCompatibilityCard({
    super.key,
    required this.result,
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
      debugPrint('[RoyalCompatibilityCard] captureCard error: $e');
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final canChi1 = CompatibilityCalculator.getCanChi(result.person1.year);
    final canChi2 = CompatibilityCalculator.getCanChi(result.person2.year);
    final napAm1 = CompatibilityCalculator.napAmMap[canChi1] ?? '';
    final napAm2 = CompatibilityCalculator.napAmMap[canChi2] ?? '';

    return RepaintBoundary(
      key: boundaryKey,
      child: AspectRatio(
        aspectRatio: 9 / 16,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xFF0A071A),
                Color(0xFF160E33),
                Color(0xFF221345),
                Color(0xFF0C091F),
              ],
              stops: [0.0, 0.35, 0.75, 1.0],
            ),
            border: Border.all(
              color: AppTheme.goldBright.withValues(alpha: 0.85),
              width: 2.0,
            ),
            boxShadow: [
              BoxShadow(
                color: AppTheme.goldBright.withValues(alpha: 0.25),
                blurRadius: 36,
                spreadRadius: 2,
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(26),
            child: Stack(
              children: [
                // Họa tiết góc Cung Đình
                Positioned(top: 14, left: 14, child: _buildCornerAccent(true, true)),
                Positioned(top: 14, right: 14, child: _buildCornerAccent(false, true)),
                Positioned(bottom: 14, left: 14, child: _buildCornerAccent(true, false)),
                Positioned(bottom: 14, right: 14, child: _buildCornerAccent(false, false)),

                // Nội dung thẻ
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Header
                      Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 12,
                                height: 1,
                                color: AppTheme.goldBright.withValues(alpha: 0.6),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'KHÂM THIÊN GIÁM · NGỰ PHÊ',
                                style: GoogleFonts.cinzel(
                                  color: AppTheme.goldBright,
                                  fontSize: 7.5,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.8,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Container(
                                width: 12,
                                height: 1,
                                color: AppTheme.goldBright.withValues(alpha: 0.6),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'DUYÊN ĐỊNH CUNG ĐÌNH',
                            style: GoogleFonts.cinzel(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.2,
                              shadows: [
                                Shadow(
                                  color: AppTheme.goldBright.withValues(alpha: 0.8),
                                  blurRadius: 10,
                                ),
                              ],
                            ),
                          ),
                          Text(
                            result.category.title,
                            style: TextStyle(
                              color: AppTheme.mysticalGold.withValues(alpha: 0.85),
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),

                      // 2 Người tham gia
                      Row(
                        children: [
                          Expanded(
                            child: _buildPersonBox(
                              name: result.person1.name,
                              gender: result.person1.isMale ? 'Nam' : 'Nữ',
                              canChi: canChi1,
                              napAm: napAm1,
                              isLeft: true,
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 6.0),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppTheme.cinnabarCrimson.withValues(alpha: 0.3),
                                border: Border.all(
                                  color: AppTheme.goldBright.withValues(alpha: 0.6),
                                  width: 1,
                                ),
                              ),
                              child: const Text(
                                '囍',
                                style: TextStyle(
                                  color: AppTheme.goldBright,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: _buildPersonBox(
                              name: result.person2.name,
                              gender: result.person2.isMale ? 'Nam' : 'Nữ',
                              canChi: canChi2,
                              napAm: napAm2,
                              isLeft: false,
                            ),
                          ),
                        ],
                      ),

                      // Điểm số Hoàng Gia
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 14),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const RadialGradient(
                            colors: [
                              Color(0xFF5A1A22),
                              Color(0xFF260A10),
                            ],
                          ),
                          border: Border.all(
                            color: AppTheme.goldBright,
                            width: 2.0,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.cinnabarCrimson.withValues(alpha: 0.5),
                              blurRadius: 16,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '${result.totalScore}',
                              style: GoogleFonts.cinzel(
                                color: AppTheme.goldBright,
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                                height: 1.0,
                              ),
                            ),
                            Text(
                              '/100',
                              style: TextStyle(
                                color: AppTheme.goldBright.withValues(alpha: 0.7),
                                fontSize: 8.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Nhãn xếp hạng
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          color: AppTheme.goldBright.withValues(alpha: 0.15),
                          border: Border.all(
                            color: AppTheme.goldBright.withValues(alpha: 0.5),
                            width: 0.8,
                          ),
                        ),
                        child: Text(
                          result.verdictTitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: AppTheme.goldBright,
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),

                      // 4 Khía cạnh chỉ số
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.35),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppTheme.goldBright.withValues(alpha: 0.25),
                            width: 0.8,
                          ),
                        ),
                        child: Column(
                          children: [
                            _buildAspectRow('Ngũ Hành', result.elementAspect.rating, result.elementAspect.score),
                            const Divider(color: Colors.white12, height: 4),
                            _buildAspectRow('Bát Trạch', result.batTrachAspect.rating, result.batTrachAspect.score),
                            const Divider(color: Colors.white12, height: 4),
                            _buildAspectRow('Thiên Can', result.canAspect.rating, result.canAspect.score),
                            const Divider(color: Colors.white12, height: 4),
                            _buildAspectRow('Địa Chi', result.chiAspect.rating, result.chiAspect.score),
                          ],
                        ),
                      ),

                      // Thơ hoàng gia
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.cinnabarCrimson.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: AppTheme.cinnabarCrimson.withValues(alpha: 0.4),
                            width: 0.8,
                          ),
                        ),
                        child: Text(
                          result.imperialPoem,
                          maxLines: 4,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.beVietnamPro(
                            fontStyle: FontStyle.italic,
                            color: const Color(0xFFFFDFB0),
                            fontSize: 8.5,
                            height: 1.3,
                          ),
                        ),
                      ),

                      // Footer & QR Code
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(3),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: QrImageView(
                                    data: 'https://tuvitoantap.vercel.app/compatibility',
                                    version: QrVersions.auto,
                                    size: 30.0,
                                    padding: EdgeInsets.zero,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        'TỬ VI TOÀN TẬP',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: GoogleFonts.cinzel(
                                          color: AppTheme.goldBright,
                                          fontSize: 8.5,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                      const Text(
                                        'Quét QR tra cứu',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          color: Colors.white60,
                                          fontSize: 7,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          _buildImperialSeal(),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPersonBox({
    required String name,
    required String gender,
    required String canChi,
    required String napAm,
    required bool isLeft,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: AppTheme.goldBright.withValues(alpha: 0.3),
          width: 0.8,
        ),
      ),
      child: Column(
        crossAxisAlignment: isLeft ? CrossAxisAlignment.start : CrossAxisAlignment.end,
        children: [
          Text(
            name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '$gender · $canChi',
            style: TextStyle(
              color: AppTheme.mysticalGold.withValues(alpha: 0.9),
              fontSize: 9,
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            napAm,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 8.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAspectRow(String title, String rating, int score) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 9.5,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            rating,
            textAlign: TextAlign.end,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppTheme.goldBright,
              fontSize: 9.0,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildImperialSeal() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(6),
        color: AppTheme.cinnabarCrimson.withValues(alpha: 0.85),
        border: Border.all(color: AppTheme.goldBright, width: 1),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'KHÂM THIÊN GIÁM',
            style: GoogleFonts.cinzel(
              color: AppTheme.goldBright,
              fontSize: 6.5,
              fontWeight: FontWeight.w900,
            ),
          ),
          const Text(
            'NGỰ PHÊ',
            style: TextStyle(
              color: Colors.white,
              fontSize: 6,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.0,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCornerAccent(bool isLeft, bool isTop) {
    return Container(
      width: 14,
      height: 14,
      decoration: BoxDecoration(
        border: Border(
          top: isTop ? BorderSide(color: AppTheme.goldBright.withValues(alpha: 0.7), width: 1.5) : BorderSide.none,
          bottom: !isTop ? BorderSide(color: AppTheme.goldBright.withValues(alpha: 0.7), width: 1.5) : BorderSide.none,
          left: isLeft ? BorderSide(color: AppTheme.goldBright.withValues(alpha: 0.7), width: 1.5) : BorderSide.none,
          right: !isLeft ? BorderSide(color: AppTheme.goldBright.withValues(alpha: 0.7), width: 1.5) : BorderSide.none,
        ),
      ),
    );
  }
}
