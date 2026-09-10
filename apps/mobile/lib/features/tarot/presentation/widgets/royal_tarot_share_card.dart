import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:screenshot/screenshot.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../core/theme/app_theme.dart';
import '../../data/models/tarot_models.dart';

/// Royal Tarot & Lenormand Imperial Share Card (Thiệp Chiêm Tinh Hoàng Gia)
/// Designed with Imperial Gold Borders, Oracle Card Front, Cinnabar Seal and QR Code
class RoyalTarotShareCard extends StatelessWidget {
  final TarotDraw data;
  final String systemTitle;

  const RoyalTarotShareCard({
    super.key,
    required this.data,
    this.systemTitle = 'THIỆP PHÁN TAROT AI',
  });

  String _extractBriefVerdict(String narrative) {
    if (narrative.isEmpty) return 'Thông điệp vũ trụ mang lại nguồn năng lượng mới và khai sáng tâm thức.';
    final clean = narrative
        .replaceAll(RegExp(r'#+\s*'), '')
        .replaceAll(RegExp(r'\*\*'), '')
        .replaceAll(RegExp(r'-\s*'), '')
        .trim();
    final sentences = clean.split(RegExp(r'(?<=[.!?])\s+'));
    return sentences.take(2).join(' ');
  }

  @override
  Widget build(BuildContext context) {
    final card = data.cards.isNotEmpty ? data.cards.first : TarotCard(id: 'unknown', name: 'The Oracle', reversed: false, position: 0);

    return Container(
      width: 360,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF25103C),
            Color(0xFF0F061C),
            Color(0xFF1E0A30),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFFFFD700).withValues(alpha: 0.65),
          width: 2.0,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF9C27B0).withValues(alpha: 0.22),
            blurRadius: 26,
            spreadRadius: 2,
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.65),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Inner Imperial Border
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: const Color(0xFFFFD700).withValues(alpha: 0.3),
                width: 1,
              ),
            ),
            child: Column(
              children: [
                // 1. Imperial Header
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
                          letterSpacing: 2.0,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  systemTitle,
                  style: GoogleFonts.cinzel(
                    color: const Color(0xFFFFE066),
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2.2,
                  ),
                ),
                const SizedBox(height: 4),
                // Decorative Divider
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(height: 1, width: 35, color: const Color(0xFFFFD700).withValues(alpha: 0.4)),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 6),
                      child: Icon(Icons.star, color: Color(0xFFFFD700), size: 10),
                    ),
                    Container(height: 1, width: 35, color: const Color(0xFFFFD700).withValues(alpha: 0.4)),
                  ],
                ),
                const SizedBox(height: 14),

                // 2. Question (if provided)
                if (data.question.isNotEmpty) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: const Color(0xFFFFD700).withValues(alpha: 0.2),
                        width: 0.8,
                      ),
                    ),
                    child: Text(
                      'CẦU VẤN: "${data.question}"',
                      style: const TextStyle(
                        color: Color(0xFFFFE066),
                        fontSize: 12,
                        fontStyle: FontStyle.italic,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                // 3. Central Card Showcase
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        const Color(0xFFFAF6EB),
                        const Color(0xFFEFE8D6),
                        const Color(0xFFFFD700).withValues(alpha: 0.25),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: const Color(0xFFFFD700),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFFD700).withValues(alpha: 0.25),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Card Name
                      Text(
                        card.name.toUpperCase(),
                        textAlign: TextAlign.center,
                        style: GoogleFonts.cinzel(
                          color: const Color(0xFF140D26),
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Card Orientation Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: card.reversed
                              ? Colors.red.withValues(alpha: 0.15)
                              : const Color(0xFF2E7D32).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: card.reversed ? Colors.redAccent : const Color(0xFF4CAF50),
                            width: 0.8,
                          ),
                        ),
                        child: Text(
                          card.reversed ? 'CHIỀU NGƯỢC (REVERSED)' : 'CHIỀU XUÔI (UPRIGHT)',
                          style: TextStyle(
                            color: card.reversed ? const Color(0xFFD32F2F) : const Color(0xFF2E7D32),
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Mystic Emblem
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF140D26).withValues(alpha: 0.08),
                          border: Border.all(color: const Color(0xFFD4AF37).withValues(alpha: 0.5), width: 1.2),
                        ),
                        child: Icon(
                          card.reversed ? Icons.wb_twilight : Icons.wb_sunny,
                          color: const Color(0xFFB8860B),
                          size: 42,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // 4. Oracle Verdict / Key Insight
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: const Color(0xFF140522).withValues(alpha: 0.7),
                    border: Border.all(color: const Color(0xFFFFD700).withValues(alpha: 0.25), width: 0.8),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.auto_awesome, size: 12, color: Color(0xFFFFD700)),
                          const SizedBox(width: 6),
                          Text(
                            'THÔNG ĐIỆP VŨ TRỤ',
                            style: GoogleFonts.cinzel(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFFFFD700),
                              letterSpacing: 1.2,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _extractBriefVerdict(data.narrative),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 11.5,
                          fontStyle: FontStyle.italic,
                          height: 1.45,
                          color: Color(0xFFE2D4FF),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // 5. Imperial Cinnabar Red Seal & QR Code Footer
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Red Seal
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF8B0000).withValues(alpha: 0.9),
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
                              'HUYỀN CƠ',
                              style: GoogleFonts.cinzel(
                                color: const Color(0xFFFFD700),
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.0,
                              ),
                            ),
                            Text(
                              'KHÂM THIÊN',
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
                      const SizedBox(width: 20),

                      // QR Code & Brand Link
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
                              data: 'https://tuvitoantap.vercel.app/tarot',
                              version: QrVersions.auto,
                              size: 38.0,
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
          ),
        ],
      ),
    );
  }
}

/// Preview & Share Modal Dialog for Royal Tarot & Lenormand Card
class RoyalTarotPreviewDialog extends StatefulWidget {
  final TarotDraw data;
  final String systemTitle;

  const RoyalTarotPreviewDialog({
    super.key,
    required this.data,
    this.systemTitle = 'THIỆP PHÁN TAROT AI',
  });

  static Future<void> show(
    BuildContext context, {
    required TarotDraw data,
    String systemTitle = 'THIỆP PHÁN TAROT AI',
  }) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => RoyalTarotPreviewDialog(data: data, systemTitle: systemTitle),
    );
  }

  @override
  State<RoyalTarotPreviewDialog> createState() => _RoyalTarotPreviewDialogState();
}

class _RoyalTarotPreviewDialogState extends State<RoyalTarotPreviewDialog> {
  final ScreenshotController _screenshotController = ScreenshotController();
  bool _isSharing = false;

  Future<void> _shareCard(BuildContext context) async {
    setState(() => _isSharing = true);
    HapticFeedback.mediumImpact();

    try {
      final imageBytes = await _screenshotController.captureFromWidget(
        Material(
          color: Colors.transparent,
          child: RoyalTarotShareCard(data: widget.data, systemTitle: widget.systemTitle),
        ),
        pixelRatio: 3.0,
      );

      final directory = await getTemporaryDirectory();
      final imageFile = File(
        '${directory.path}/thiep_tarot_${DateTime.now().millisecondsSinceEpoch}.png',
      );
      await imageFile.writeAsBytes(imageBytes);

      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(imageFile.path)],
          text: 'Thiệp Chiêm Tinh Khâm Thiên Giám — Tử Vi Toàn Tập',
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
          RoyalTarotShareCard(data: widget.data, systemTitle: widget.systemTitle),
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
