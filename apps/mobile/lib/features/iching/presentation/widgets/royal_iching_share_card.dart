import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:screenshot/screenshot.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../core/theme/app_theme.dart';
import '../../data/models/iching_models.dart';

class RoyalIChingShareCard extends StatelessWidget {
  final IChingDraw data;
  final String question;

  const RoyalIChingShareCard({
    super.key,
    required this.data,
    required this.question,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 360,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF1B0F2E),
            Color(0xFF0F071D),
            Color(0xFF1E1035),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFFFFD700).withValues(alpha: 0.6),
          width: 2.0,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFFD700).withValues(alpha: 0.18),
            blurRadius: 24,
            spreadRadius: 2,
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.6),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Inner decorative border
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: const Color(0xFFFFD700).withValues(alpha: 0.25),
                width: 1,
              ),
            ),
            child: Column(
              children: [
                // Royal Crest Header
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(5),
                        decoration: BoxDecoration(
                          gradient: CelestialGradients.imperialGold,
                          shape: BoxShape.circle,
                          boxShadow: CelestialShadows.goldGlow,
                        ),
                        child: const Icon(
                          Icons.auto_awesome,
                          color: Color(0xFF140D26),
                          size: 14,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'KHÂM THIÊN GIÁM',
                        style: GoogleFonts.cinzel(
                          color: const Color(0xFFFFD700),
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'THIỆP PHÁN LỤC HÀO KINH DỊCH',
                  style: GoogleFonts.cinzel(
                    color: AppTheme.mysticalTextSecondary,
                    fontSize: 11,
                    letterSpacing: 1.2,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Question section
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: AppTheme.goldBright.withValues(alpha: 0.2),
              ),
            ),
            child: Column(
              children: [
                Text(
                  'SỞ NGUYỆN CHIÊM HỎI',
                  style: GoogleFonts.cinzel(
                    color: AppTheme.mysticalGold,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '"$question"',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontStyle: FontStyle.italic,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Dual Hexagram Display (Quẻ Gốc & Quẻ Biến)
          Row(
            children: [
              Expanded(
                child: _buildMiniHexagramCard(
                  title: 'QUẺ GỐC',
                  name: data.baseHexagram.name,
                  lines: data.baseHexagram.lines,
                  movingLines: data.changingLines,
                  isBase: true,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildMiniHexagramCard(
                  title: 'QUẺ BIẾN',
                  name: data.changedHexagram?.name ?? 'Không biến',
                  lines: data.changedHexagram?.lines ?? data.baseHexagram.lines,
                  movingLines: const [],
                  isBase: false,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Concise Narrative / Judgment
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.25),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: const Color(0xFFFFD700).withValues(alpha: 0.2),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.bookmark_border,
                        color: Color(0xFFFFD700), size: 14),
                    const SizedBox(width: 6),
                    Text(
                      'LỜI BÀN KHÂM THIÊN GIÁM',
                      style: GoogleFonts.cinzel(
                        color: const Color(0xFFFFD700),
                        fontSize: 10.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  _extractBriefVerdict(data.narrative),
                  style: const TextStyle(
                    color: AppTheme.mysticalText,
                    fontSize: 11.5,
                    height: 1.45,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Footer with Red Imperial Seal and QR
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Imperial Red Seal (Ấn triện Khâm Thiên Giám)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF8B0000).withValues(alpha: 0.85),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFFF3333), width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFCC0000).withValues(alpha: 0.35),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Text(
                        'KHÂM THIÊN',
                        style: GoogleFonts.cinzel(
                          color: const Color(0xFFFFD700),
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.0,
                        ),
                      ),
                      Text(
                        'NGỰ BÚT',
                        style: GoogleFonts.cinzel(
                          color: const Color(0xFFFFD700),
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 32),

                // QR Code and brand link
                Row(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'TỬ VI TOÀN TẬP',
                          style: GoogleFonts.cinzel(
                            color: const Color(0xFFFFD700),
                            fontSize: 9.5,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'tuvitoantap.vercel.app',
                          style: TextStyle(
                            color: AppTheme.mysticalTextSecondary,
                            fontSize: 8.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: QrImageView(
                        data: 'https://tuvitoantap.vercel.app/liuyao',
                        version: QrVersions.auto,
                        size: 40.0,
                        gapless: false,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniHexagramCard({
    required String title,
    required String name,
    required List<int> lines,
    required List<int> movingLines,
    required bool isBase,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isBase
              ? const Color(0xFFFFD700).withValues(alpha: 0.3)
              : Colors.purpleAccent.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        children: [
          Text(
            title,
            style: GoogleFonts.cinzel(
              color: isBase ? const Color(0xFFFFD700) : Colors.purpleAccent,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            name,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          // 6 Mini lines (rendered from bottom to top)
          Column(
            children: List.generate(6, (idx) {
              final lineIdx = 5 - idx; // Line 6 at top, Line 1 at bottom
              final isYang = lines.length > lineIdx ? lines[lineIdx] == 1 : true;
              final isMoving = isBase && movingLines.contains(lineIdx + 1);

              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: _buildMiniLine(isYang: isYang, isMoving: isMoving),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniLine({required bool isYang, required bool isMoving}) {
    final color = isMoving
        ? const Color(0xFFFFD700)
        : (isYang ? const Color(0xFFE2D4FF) : const Color(0xFFA094B8));

    if (isYang) {
      return Container(
        height: 4.5,
        width: 60,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(2),
          boxShadow: isMoving
              ? [
                  BoxShadow(
                    color: const Color(0xFFFFD700).withValues(alpha: 0.6),
                    blurRadius: 4,
                  )
                ]
              : null,
        ),
      );
    } else {
      return SizedBox(
        width: 60,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              height: 4.5,
              width: 26,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Container(
              height: 4.5,
              width: 26,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),
      );
    }
  }

  String _extractBriefVerdict(String narrative) {
    if (narrative.isEmpty) return 'Quẻ hanh thông, thời vận thuận hòa.';
    // Clean markdown headings/bullets
    final clean = narrative
        .replaceAll(RegExp(r'#+\s*'), '')
        .replaceAll(RegExp(r'\*\*'), '')
        .replaceAll(RegExp(r'-\s*'), '')
        .trim();
    final sentences = clean.split(RegExp(r'(?<=[.!?])\s+'));
    return sentences.take(2).join(' ');
  }
}

class RoyalSharePreviewDialog extends StatefulWidget {
  final IChingDraw data;
  final String question;

  const RoyalSharePreviewDialog({
    super.key,
    required this.data,
    required this.question,
  });

  static Future<void> show(
    BuildContext context, {
    required IChingDraw data,
    required String question,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => RoyalSharePreviewDialog(
        data: data,
        question: question,
      ),
    );
  }

  @override
  State<RoyalSharePreviewDialog> createState() =>
      _RoyalSharePreviewDialogState();
}

class _RoyalSharePreviewDialogState extends State<RoyalSharePreviewDialog> {
  final ScreenshotController _screenshotController = ScreenshotController();
  bool _isSharing = false;

  Future<void> _shareCard(BuildContext context) async {
    setState(() => _isSharing = true);
    HapticFeedback.mediumImpact();

    try {
      final imageBytes = await _screenshotController.captureFromWidget(
        Material(
          color: Colors.transparent,
          child: RoyalIChingShareCard(
            data: widget.data,
            question: widget.question,
          ),
        ),
        pixelRatio: 3.0,
      );

      final directory = await getTemporaryDirectory();
      final imageFile = File(
        '${directory.path}/thiep_luc_hao_${DateTime.now().millisecondsSinceEpoch}.png',
      );
      await imageFile.writeAsBytes(imageBytes);

      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(imageFile.path)],
          text:
              'Thiệp phán Lục Hào Kinh Dịch từ Khâm Thiên Giám — Tử Vi Toàn Tập',
        ),
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi chia sẻ: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSharing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Preview Card
          RoyalIChingShareCard(
            data: widget.data,
            question: widget.question,
          ),
          const SizedBox(height: 18),

          // Action Buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextButton.icon(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close, color: AppTheme.mysticalTextSecondary),
                label: const Text('Đóng',
                    style: TextStyle(color: AppTheme.mysticalTextSecondary)),
              ),
              const SizedBox(width: 14),
              ElevatedButton.icon(
                onPressed: _isSharing ? null : () => _shareCard(context),
                icon: _isSharing
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Color(0xFF140D26),
                        ),
                      )
                    : const Icon(Icons.share,
                        color: Color(0xFF140D26), size: 18),
                label: Text(
                  _isSharing ? 'Đang xuất ảnh...' : 'CHIA SẺ HOÀNG TRIỀU',
                  style: GoogleFonts.cinzel(
                    color: const Color(0xFF140D26),
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFFD700),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 6,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
