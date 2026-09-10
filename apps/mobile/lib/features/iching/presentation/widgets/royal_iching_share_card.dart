import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:screenshot/screenshot.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/royal_image_compressor.dart';
import '../../data/models/iching_models.dart';
import '../../../gallery/data/royal_gallery_service.dart';
import '../../../gallery/models/royal_share_item.dart';
import '../../../gallery/presentation/widgets/royal_seal_widget.dart';

class RoyalIChingShareCard extends StatelessWidget {
  final IChingDraw data;
  final String question;
  final bool isStory9_16;
  final RoyalSealType sealType;
  final String? customSealText;
  final bool showWatermark;

  const RoyalIChingShareCard({
    super.key,
    required this.data,
    required this.question,
    this.isStory9_16 = false,
    this.sealType = RoyalSealType.khamThien,
    this.customSealText,
    this.showWatermark = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 360,
      height: isStory9_16 ? 640 : null,
      padding: EdgeInsets.all(isStory9_16 ? 24 : 20),
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
      child: Stack(
        children: [
          if (showWatermark)
            RoyalWatermarkWidget(
              text: customSealText != null && customSealText!.trim().isNotEmpty
                  ? customSealText!.trim().toUpperCase()
                  : 'KHÂM THIÊN GIÁM • BỐC DỊCH',
            ),
          Column(
            mainAxisSize: isStory9_16 ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment: isStory9_16 ? MainAxisAlignment.spaceBetween : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              if (isStory9_16)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.star, color: Color(0xFFFFD700), size: 12),
                      const SizedBox(width: 6),
                      Text(
                        'HOÀNG ĐẠO BỐC DỊCH • THIỆP PHÁN 9:16',
                        style: GoogleFonts.cinzel(
                          color: const Color(0xFFFFD700),
                          fontSize: 10,
                          letterSpacing: 2,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Icon(Icons.star, color: Color(0xFFFFD700), size: 12),
                    ],
                  ),
                ),

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
              const SizedBox(height: 12),

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
              const SizedBox(height: 12),

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
              const SizedBox(height: 12),

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
                      maxLines: isStory9_16 ? 4 : 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Footer with Red Imperial Seal and QR
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Dynamic Imperial Seal
                    RoyalSealWidget(
                      sealType: sealType,
                      customSealText: customSealText,
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

class RoyalSharePreviewDialog extends ConsumerStatefulWidget {
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
  ConsumerState<RoyalSharePreviewDialog> createState() =>
      _RoyalSharePreviewDialogState();
}

class _RoyalSharePreviewDialogState extends ConsumerState<RoyalSharePreviewDialog> {
  final ScreenshotController _screenshotController = ScreenshotController();
  bool _isSharing = false;

  bool _isStory9_16 = false;
  RoyalSealType _selectedSeal = RoyalSealType.khamThien;
  final TextEditingController _customSealController = TextEditingController();
  bool _showWatermark = true;

  @override
  void dispose() {
    _customSealController.dispose();
    super.dispose();
  }

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
            isStory9_16: _isStory9_16,
            sealType: _selectedSeal,
            customSealText: _customSealController.text.trim().isNotEmpty
                ? _customSealController.text.trim()
                : null,
            showWatermark: _showWatermark,
          ),
        ),
        pixelRatio: 3.0,
      );

      // Tối ưu hóa dung lượng: Nén sang WebP (Sprint 60)
      final compressedResult = await RoyalImageCompressor.compress(imageBytes);

      final directory = await getTemporaryDirectory();
      final ext = compressedResult.fileExtension;
      final imageFile = File(
        '${directory.path}/thiep_luc_hao_${DateTime.now().millisecondsSinceEpoch}.$ext',
      );
      await imageFile.writeAsBytes(compressedResult.bytes);

      // Auto-save to Royal Gallery
      try {
        final galleryService = ref.read(royalGalleryServiceProvider);
        await galleryService.saveItem(
          RoyalShareItem(
            id: 'iching_${DateTime.now().millisecondsSinceEpoch}',
            type: RoyalCardType.iching,
            title: '${widget.data.baseHexagram.name} ${widget.data.changedHexagram != null ? '→ ${widget.data.changedHexagram!.name}' : ''}',
            subtitle: widget.question,
            createdAt: DateTime.now(),
            imagePath: imageFile.path,
            aspectRatio: _isStory9_16 ? RoyalAspectRatio.story9_16 : RoyalAspectRatio.standard,
            customSealName: _customSealController.text.trim().isNotEmpty ? _customSealController.text.trim() : null,
          ),
          isPro: true,
        );
      } catch (e) {
        debugPrint('Lỗi lưu vào Hoàng Triều Thư Viện: $e');
      }

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
      backgroundColor: const Color(0xFF140D26),
      insetPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 20),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: Color(0xFFFFD700), width: 1.5),
      ),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Dialog Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'HOÀNG TRIỀU THIỆP PHÁN',
                    style: GoogleFonts.cinzel(
                      color: const Color(0xFFFFD700),
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white70, size: 20),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Format Selector Tabs (3:4 vs 9:16)
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white12),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _isStory9_16 = false),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: !_isStory9_16 ? const Color(0xFFFFD700).withValues(alpha: 0.2) : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            border: !_isStory9_16 ? Border.all(color: const Color(0xFFFFD700)) : null,
                          ),
                          child: Center(
                            child: Text(
                              'Thiệp Cung Đình (3:4)',
                              style: TextStyle(
                                color: !_isStory9_16 ? const Color(0xFFFFD700) : Colors.white60,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _isStory9_16 = true),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: _isStory9_16 ? const Color(0xFFFFD700).withValues(alpha: 0.2) : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            border: _isStory9_16 ? Border.all(color: const Color(0xFFFFD700)) : null,
                          ),
                          child: Center(
                            child: Text(
                              'Story 9:16 (IG/FB/TikTok)',
                              style: TextStyle(
                                color: _isStory9_16 ? const Color(0xFFFFD700) : Colors.white60,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Preview Card in scaled container
              Container(
                constraints: BoxConstraints(maxHeight: _isStory9_16 ? 380 : 340),
                child: SingleChildScrollView(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: RoyalIChingShareCard(
                      data: widget.data,
                      question: widget.question,
                      isStory9_16: _isStory9_16,
                      sealType: _selectedSeal,
                      customSealText: _customSealController.text.trim().isNotEmpty
                          ? _customSealController.text.trim()
                          : null,
                      showWatermark: _showWatermark,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Custom Seal Options
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.03),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'TÙY CHỌN ẤN TRIỆN HOÀNG GIA',
                      style: GoogleFonts.cinzel(
                        color: const Color(0xFFFFD700),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: RoyalSealType.values.map((type) {
                        final isSelected = _selectedSeal == type;
                        return ChoiceChip(
                          label: Text(type.label),
                          selected: isSelected,
                          selectedColor: const Color(0xFF8B0000),
                          backgroundColor: Colors.white.withValues(alpha: 0.05),
                          labelStyle: TextStyle(
                            color: isSelected ? const Color(0xFFFFD700) : Colors.white70,
                            fontSize: 11,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                          onSelected: (val) {
                            if (val) setState(() => _selectedSeal = type);
                          },
                        );
                      }).toList(),
                    ),
                    if (_selectedSeal == RoyalSealType.custom) ...[
                      const SizedBox(height: 8),
                      TextField(
                        controller: _customSealController,
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                        decoration: InputDecoration(
                          hintText: 'Nhập danh xưng (VD: TRẦN ĐẠI KA)',
                          hintStyle: const TextStyle(color: Colors.white38, fontSize: 11),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          filled: true,
                          fillColor: Colors.black26,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: const BorderSide(color: Color(0xFFFFD700)),
                          ),
                        ),
                        onChanged: (text) => setState(() {}),
                      ),
                    ],
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Thủy ấn Khâm Thiên Giám in chìm',
                          style: TextStyle(color: Colors.white70, fontSize: 11.5),
                        ),
                        Switch(
                          value: _showWatermark,
                          activeThumbColor: const Color(0xFFFFD700),
                          onChanged: (v) => setState(() => _showWatermark = v),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Action Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Đóng', style: TextStyle(color: Colors.white60)),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: _isSharing ? null : () => _shareCard(context),
                    icon: _isSharing
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF140D26)),
                          )
                        : const Icon(Icons.share, color: Color(0xFF140D26), size: 16),
                    label: Text(
                      _isSharing ? 'Đang xuất ảnh...' : 'CHIA SẺ HOÀNG TRIỀU',
                      style: GoogleFonts.cinzel(
                        color: const Color(0xFF140D26),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFFD700),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
