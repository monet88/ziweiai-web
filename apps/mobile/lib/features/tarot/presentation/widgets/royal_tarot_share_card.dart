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
import '../../../gallery/data/royal_gallery_service.dart';
import '../../../gallery/models/royal_share_item.dart';
import '../../../gallery/presentation/widgets/royal_seal_widget.dart';
import '../../../subscription/providers/subscription_provider.dart';
import '../../data/models/tarot_models.dart';

/// Royal Tarot & Lenormand Imperial Share Card (Thiệp Chiêm Tinh Hoàng Gia)
/// Designed with Imperial Gold Borders, Oracle Card Front, Watermark and 9:16 Story format
class RoyalTarotShareCard extends StatelessWidget {
  final TarotDraw data;
  final String systemTitle;
  final bool isStory9_16;
  final RoyalSealType sealType;
  final String? customSealText;
  final bool showWatermark;

  const RoyalTarotShareCard({
    super.key,
    required this.data,
    this.systemTitle = 'THIỆP PHÁN TAROT AI',
    this.isStory9_16 = false,
    this.sealType = RoyalSealType.huyenCo,
    this.customSealText,
    this.showWatermark = true,
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
      height: isStory9_16 ? 640 : null,
      padding: EdgeInsets.symmetric(horizontal: 18, vertical: isStory9_16 ? 24 : 18),
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
      child: Stack(
        children: [
          if (showWatermark) const RoyalWatermarkWidget(),
          Column(
            mainAxisSize: isStory9_16 ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment:
                isStory9_16 ? MainAxisAlignment.spaceBetween : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              if (isStory9_16)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Center(
                    child: Text(
                      '✦ ✦ ✦   KHÂM THIÊN GIÁM • HUYỀN CƠ CHIÊM BỐC   ✦ ✦ ✦',
                      style: GoogleFonts.cinzel(
                        color: const Color(0xFFFFD700).withValues(alpha: 0.75),
                        fontSize: 8,
                        letterSpacing: 2.0,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
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
                      RoyalSealWidget(
                        sealType: sealType,
                        customSealText: customSealText,
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
    ], // Đóng Stack children
  ), // Đóng Stack
);
  }
}

/// Preview & Share Modal Dialog for Royal Tarot & Lenormand Card
class RoyalTarotPreviewDialog extends ConsumerStatefulWidget {
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
      builder: (ctx) =>
          RoyalTarotPreviewDialog(data: data, systemTitle: systemTitle),
    );
  }

  @override
  ConsumerState<RoyalTarotPreviewDialog> createState() => _RoyalTarotPreviewDialogState();
}

class _RoyalTarotPreviewDialogState extends ConsumerState<RoyalTarotPreviewDialog> {
  final ScreenshotController _screenshotController = ScreenshotController();
  bool _isSharing = false;

  RoyalAspectRatio _aspectRatio = RoyalAspectRatio.standard;
  RoyalSealType _sealType = RoyalSealType.huyenCo;
  bool _showWatermark = true;
  late final TextEditingController _customSealController;

  @override
  void initState() {
    super.initState();
    _customSealController = TextEditingController(text: 'Huyền Cơ');
  }

  @override
  void dispose() {
    _customSealController.dispose();
    super.dispose();
  }

  Widget _buildCardWidget() {
    return RoyalTarotShareCard(
      data: widget.data,
      systemTitle: widget.systemTitle,
      isStory9_16: _aspectRatio == RoyalAspectRatio.story9_16,
      sealType: _sealType,
      customSealText:
          _sealType == RoyalSealType.custom ? _customSealController.text : null,
      showWatermark: _showWatermark,
    );
  }

  Future<void> _shareCard(BuildContext context) async {
    setState(() => _isSharing = true);
    HapticFeedback.mediumImpact();

    try {
      final imageBytes = await _screenshotController.captureFromWidget(
        Material(
          color: Colors.transparent,
          child: _buildCardWidget(),
        ),
        pixelRatio: 3.0,
      );

      final directory = await getTemporaryDirectory();
      final prefix =
          _aspectRatio == RoyalAspectRatio.story9_16 ? 'story_9_16' : 'card_3_4';
      final imageFile = File(
        '${directory.path}/thiep_tarot_${prefix}_${DateTime.now().millisecondsSinceEpoch}.png',
      );
      await imageFile.writeAsBytes(imageBytes);

      // Lưu vào Thư Viện Hoàng Triều
      final cardName = widget.data.cards.isNotEmpty
          ? widget.data.cards.first.name
          : 'Huyền Cơ';
      final galleryItem = RoyalShareItem(
        id: 'tarot_${DateTime.now().millisecondsSinceEpoch}',
        title: '${widget.systemTitle} — $cardName',
        type: RoyalCardType.tarot,
        createdAt: DateTime.now(),
        imagePath: imageFile.path,
        subtitle: '${widget.data.cards.length} lá bài • Trải bài ${widget.data.spread}',
        aspectRatio: _aspectRatio,
        customSealName: _sealType == RoyalSealType.custom
            ? _customSealController.text
            : _sealType.label,
      );
      await RoyalGalleryService().saveItem(
        galleryItem,
        isPro: ref.read(isProUserProvider),
      );

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
      insetPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
      child: Container(
        constraints: const BoxConstraints(maxHeight: 720),
        decoration: BoxDecoration(
          color: const Color(0xFF14061C),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFFFFD700).withValues(alpha: 0.5),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.8),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header Dialog
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'XUẤT THIỆP CHIÊM TINH',
                    style: GoogleFonts.cinzel(
                      color: const Color(0xFFFFD700),
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close,
                        color: AppTheme.mysticalTextSecondary, size: 20),
                  ),
                ],
              ),
            ),

            // Controls Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  // 1. Aspect Ratio Selector
                  Row(
                    children: [
                      const Text(
                        'Định dạng: ',
                        style: TextStyle(
                            color: AppTheme.mysticalTextSecondary,
                            fontSize: 11.5),
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const Text('3:4 Chuẩn 🔮',
                            style: TextStyle(fontSize: 11)),
                        selected: _aspectRatio == RoyalAspectRatio.standard,
                        selectedColor: const Color(0xFFFFD700),
                        labelStyle: TextStyle(
                          color: _aspectRatio == RoyalAspectRatio.standard
                              ? const Color(0xFF140D26)
                              : Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                        backgroundColor: const Color(0xFF25103C),
                        onSelected: (_) => setState(
                            () => _aspectRatio = RoyalAspectRatio.standard),
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const Text('9:16 Story 📱',
                            style: TextStyle(fontSize: 11)),
                        selected: _aspectRatio == RoyalAspectRatio.story9_16,
                        selectedColor: const Color(0xFFFFD700),
                        labelStyle: TextStyle(
                          color: _aspectRatio == RoyalAspectRatio.story9_16
                              ? const Color(0xFF140D26)
                              : Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                        backgroundColor: const Color(0xFF25103C),
                        onSelected: (_) => setState(
                            () => _aspectRatio = RoyalAspectRatio.story9_16),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // 2. Seal & Watermark Options
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      DropdownButton<RoyalSealType>(
                        value: _sealType,
                        dropdownColor: const Color(0xFF25103C),
                        underline: const SizedBox(),
                        style: const TextStyle(
                            color: Color(0xFFFFD700), fontSize: 11.5),
                        items: [
                          DropdownMenuItem(
                            value: RoyalSealType.huyenCo,
                            child: Text(RoyalSealType.huyenCo.label),
                          ),
                          DropdownMenuItem(
                            value: RoyalSealType.khamThien,
                            child: Text(RoyalSealType.khamThien.label),
                          ),
                          DropdownMenuItem(
                            value: RoyalSealType.custom,
                            child: Text(RoyalSealType.custom.label),
                          ),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _sealType = val);
                        },
                      ),
                      Row(
                        children: [
                          const Text(
                            'Thủy ấn',
                            style: TextStyle(
                                color: AppTheme.mysticalTextSecondary,
                                fontSize: 11),
                          ),
                          Switch(
                            value: _showWatermark,
                            activeThumbColor: const Color(0xFFFFD700),
                            materialTapTargetSize:
                                MaterialTapTargetSize.shrinkWrap,
                            onChanged: (v) =>
                                setState(() => _showWatermark = v),
                          ),
                        ],
                      ),
                    ],
                  ),

                  // 3. Custom Seal Input
                  if (_sealType == RoyalSealType.custom)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: SizedBox(
                        height: 32,
                        child: TextField(
                          controller: _customSealController,
                          style: const TextStyle(
                              color: Colors.white, fontSize: 11),
                          decoration: InputDecoration(
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 6),
                            hintText: 'Nhập họ tên ấn triện (vd: Minh Triết)',
                            hintStyle: const TextStyle(
                                color: Colors.white38, fontSize: 10),
                            filled: true,
                            fillColor: const Color(0xFF25103C),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide.none,
                            ),
                          ),
                          onChanged: (_) => setState(() {}),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            const Divider(color: Colors.white12, height: 12),

            // Scrollable Preview Card
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Center(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: _buildCardWidget(),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 8),

            // Bottom Action Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  TextButton.icon(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close,
                        color: AppTheme.mysticalTextSecondary),
                    label: const Text('Đóng',
                        style:
                            TextStyle(color: AppTheme.mysticalTextSecondary)),
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
                      _isSharing ? 'Đang xuất ảnh...' : 'CHIA SẺ CHIÊM TINH',
                      style: GoogleFonts.cinzel(
                        color: const Color(0xFF140D26),
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFFD700),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 6,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
