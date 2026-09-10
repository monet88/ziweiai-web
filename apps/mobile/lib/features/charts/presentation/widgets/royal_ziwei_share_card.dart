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
import '../../../gallery/data/royal_gallery_service.dart';
import '../../../gallery/models/royal_share_item.dart';
import '../../../gallery/presentation/widgets/royal_seal_widget.dart';
import '../../../subscription/providers/subscription_provider.dart';
import '../../data/models/chart_snapshot.dart';

/// Royal Ziwei Certificate Share Card (Chiếu Chỉ Hoàng Triều Mệnh Số)
/// Designed with Imperial Gold borders, Cinnabar Red Seal, Watermark and 9:16 Social Story format
class RoyalZiweiCertificateCard extends StatelessWidget {
  final ChartDetailResponse chartData;
  final bool isStory9_16;
  final RoyalSealType sealType;
  final String? customSealText;
  final bool showWatermark;

  const RoyalZiweiCertificateCard({
    super.key,
    required this.chartData,
    this.isStory9_16 = false,
    this.sealType = RoyalSealType.khamThien,
    this.customSealText,
    this.showWatermark = true,
  });

  String _formatPillar(dynamic pillar) {
    if (pillar == null) return 'N/A';
    if (pillar is Map) {
      return pillar['stemBranch']?.toString() ?? pillar.toString();
    }
    return pillar.toString();
  }

  String _formatStemBranch(String stemKey, String branchKey) {
    final stem = stemKey.split('.').last.toUpperCase();
    final branch = branchKey.split('.').last.toUpperCase();

    const Map<String, String> stemVi = {
      'JIA': 'Giáp',
      'YI': 'Ất',
      'BING': 'Bính',
      'DING': 'Đinh',
      'WU': 'Mậu',
      'JI': 'Kỷ',
      'GENG': 'Canh',
      'XIN': 'Tân',
      'REN': 'Nhâm',
      'GUI': 'Quý',
    };

    const Map<String, String> branchVi = {
      'ZI': 'Tý',
      'CHOU': 'Sửu',
      'YIN': 'Dần',
      'MAO': 'Mão',
      'CHEN': 'Thìn',
      'SI': 'Tỵ',
      'WU': 'Ngọ',
      'WEI': 'Mùi',
      'SHEN': 'Thân',
      'YOU': 'Dậu',
      'XU': 'Tuất',
      'HAI': 'Hợi',
    };

    return '${stemVi[stem] ?? stem} ${branchVi[branch] ?? branch}';
  }

  String _brightnessLabel(String? key) {
    if (key == null) return '';
    final lower = key.toLowerCase();
    if (lower.contains('mieu') || lower.contains('temple')) return '(M)';
    if (lower.contains('vuong') || lower.contains('prosper')) return '(V)';
    if (lower.contains('dac') || lower.contains('gain')) return '(Đ)';
    if (lower.contains('ham') || lower.contains('trap')) return '(H)';
    if (lower.contains('binh') || lower.contains('flat')) return '(B)';
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final snapshot = widgetSnapshot;
    final summary = snapshot.summary ?? {};
    final birth = snapshot.birth ?? {};
    final palaces = snapshot.palaces ?? [];

    final name = birth['name']?.toString() ?? summary['name']?.toString() ?? 'Quý Khách';
    final gender = birth['gender']?.toString() == 'male'
        ? 'Nam Mạng'
        : (birth['gender']?.toString() == 'female' ? 'Nữ Mạng' : 'Mạng Số');
    final solarDate = birth['solarDate']?.toString() ?? summary['solarDate']?.toString() ?? '';
    final lunarDate = birth['lunarDate']?.toString() ?? summary['lunarDate']?.toString() ?? '';
    final solarTime = birth['solarTime']?.toString() ?? summary['solarTime']?.toString() ?? '';

    final yearPillar = _formatPillar(summary['yearPillar']);
    final monthPillar = _formatPillar(summary['monthPillar']);
    final dayPillar = _formatPillar(summary['dayPillar']);
    final hourPillar = _formatPillar(summary['hourPillar']);

    final fiveElements = summary['fiveElements']?.toString() ?? 'N/A';
    final destinyYinYang = summary['destinyYinYang']?.toString() ?? 'N/A';
    final bodyPalaceName = summary['bodyPalace']?.toString() ?? 'N/A';

    // Locate Destiny Palace (Cung Mệnh) & Body Palace (Cung Thân)
    final menhPalace = palaces.firstWhere(
      (p) =>
          p.isOriginalPalace ||
          (p.displayName?.contains('Mệnh') ?? false) ||
          p.nameKey.toLowerCase().contains('destiny') ||
          p.nameKey.toLowerCase().contains('menh'),
      orElse: () => palaces.isNotEmpty
          ? palaces.first
          : Palace(
              nameKey: 'destiny',
              index: 0,
              heavenlyStemKey: '',
              earthlyBranchKey: '',
              isBodyPalace: false,
              isOriginalPalace: true,
              majorStars: [],
              minorStars: [],
              adjectiveStars: [],
              ages: [],
            ),
    );

    final thanPalace = palaces.firstWhere(
      (p) =>
          p.isBodyPalace ||
          (p.displayName?.contains('Thân') ?? false) ||
          p.nameKey.toLowerCase().contains('body'),
      orElse: () => menhPalace,
    );

    final menhBranch = _formatStemBranch(menhPalace.heavenlyStemKey, menhPalace.earthlyBranchKey);
    final thanBranch = _formatStemBranch(thanPalace.heavenlyStemKey, thanPalace.earthlyBranchKey);

    return Container(
      width: 360,
      height: isStory9_16 ? 640 : null,
      padding: EdgeInsets.symmetric(horizontal: 18, vertical: isStory9_16 ? 24 : 18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF200F36),
            Color(0xFF0F071D),
            Color(0xFF1E0D30),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFFFFD700).withValues(alpha: 0.65),
          width: 2.0,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFFD700).withValues(alpha: 0.22),
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
                      '✦ ✦ ✦   KHÂM THIÊN GIÁM NGỰ PHÁN   ✦ ✦ ✦',
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
                // 1. Imperial Crest Header
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
                          Icons.brightness_auto,
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
                  'CHIẾU CHỈ MỆNH SỐ',
                  style: GoogleFonts.cinzel(
                    color: const Color(0xFFFFE066),
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2.5,
                  ),
                ),
                const SizedBox(height: 4),
                // Decorative divider
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

                // 2. Personal Destiny Banner
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
                  child: Column(
                    children: [
                      Text(
                        name.toUpperCase(),
                        style: GoogleFonts.cinzel(
                          color: const Color(0xFFFFD700),
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$gender • $solarDate ${solarTime.isNotEmpty ? "($solarTime)" : ""}',
                        style: const TextStyle(
                          color: Color(0xFFE0D8EE),
                          fontSize: 11.5,
                          fontWeight: FontWeight.w500,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      if (lunarDate.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          'Âm lịch: $lunarDate',
                          style: const TextStyle(
                            color: AppTheme.mysticalTextSecondary,
                            fontSize: 11,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // 3. Four Pillars (Bát Tự Can Chi)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0D061A).withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: const Color(0xFFFFD700).withValues(alpha: 0.18),
                      width: 0.8,
                    ),
                  ),
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildPillarItem('NĂM', yearPillar),
                        const SizedBox(width: 14),
                        _buildPillarItem('THÁNG', monthPillar),
                        const SizedBox(width: 14),
                        _buildPillarItem('NGÀY', dayPillar),
                        const SizedBox(width: 14),
                        _buildPillarItem('GIỜ', hourPillar),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // 4. Destiny Essence: Cục, Bản Mệnh & Thân Cư
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.03),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: const Color(0xFFFFD700).withValues(alpha: 0.2),
                            width: 0.8,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'CỤC & BẢN MỆNH',
                              style: GoogleFonts.cinzel(
                                color: const Color(0xFFFFD700),
                                fontSize: 9.5,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              fiveElements,
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              destinyYinYang,
                              style: const TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 10),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.03),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: const Color(0xFFFFD700).withValues(alpha: 0.2),
                            width: 0.8,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'THÂN CƯ VỊ TRÍ',
                              style: GoogleFonts.cinzel(
                                color: const Color(0xFFFFD700),
                                fontSize: 9.5,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              bodyPalaceName,
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              'Tại $thanBranch',
                              style: const TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 10),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // 5. Cung Mệnh & Cung Thân Chi Tiết
                Row(
                  children: [
                    Expanded(
                      child: _buildPalaceCard(
                        title: 'CUNG MỆNH',
                        branch: menhBranch,
                        palace: menhPalace,
                        isPrimary: true,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildPalaceCard(
                        title: 'CUNG THÂN',
                        branch: thanBranch,
                        palace: thanPalace,
                        isPrimary: false,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // 6. Ngự Bút Định Mệnh (Decree Verdict)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF140726).withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: const Color(0xFFFFD700).withValues(alpha: 0.25),
                      width: 0.8,
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.history_edu, color: Color(0xFFFFD700), size: 13),
                          const SizedBox(width: 5),
                          Text(
                            'NGỰ PHÊ KHÂM THIÊN',
                            style: GoogleFonts.cinzel(
                              color: const Color(0xFFFFD700),
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Text(
                        _extractDestinyVerdict(menhPalace),
                        style: const TextStyle(
                          color: Color(0xFFE2D4FF),
                          fontSize: 11,
                          fontStyle: FontStyle.italic,
                          height: 1.45,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // 7. Imperial Red Seal & QR Code Footer
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Imperial Cinnabar Seal (Ấn triện đỏ son)
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
                              data: 'https://tuvitoantap.vercel.app/charts/${chartData.chartRecord.id}',
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

  ChartSnapshot get widgetSnapshot => chartData.chartRecord.snapshot;

  Widget _buildPillarItem(String label, String value) {
    return Column(
      children: [
        Text(
          label,
          style: GoogleFonts.cinzel(
            color: const Color(0xFFFFD700).withValues(alpha: 0.8),
            fontSize: 9,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  Widget _buildPalaceCard({
    required String title,
    required String branch,
    required Palace palace,
    required bool isPrimary,
  }) {
    final majorStars = palace.majorStars;
    final starText = majorStars.isEmpty
        ? 'Vô Chính Diệu'
        : majorStars.map((s) => '${s.displayName ?? s.nameKey}${_brightnessLabel(s.brightnessKey)}').take(3).join(', ');

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isPrimary
              ? const Color(0xFFFFD700).withValues(alpha: 0.35)
              : Colors.purpleAccent.withValues(alpha: 0.3),
          width: 0.8,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: GoogleFonts.cinzel(
                    color: isPrimary ? const Color(0xFFFFD700) : Colors.purpleAccent,
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  branch,
                  style: const TextStyle(
                    color: AppTheme.mysticalTextSecondary,
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            starText,
            style: TextStyle(
              color: isPrimary ? const Color(0xFFFFE066) : const Color(0xFFE2D4FF),
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  String _extractDestinyVerdict(Palace menhPalace) {
    if (menhPalace.majorStars.isEmpty) {
      return 'Mệnh Vô Chính Diệu, mượn ánh tinh hoa tam phương tứ chính. Cần tĩnh tại dưỡng tâm, ắt công thành danh toại.';
    }
    final stars = menhPalace.majorStars.map((s) => s.displayName ?? s.nameKey).join(', ');
    return 'Chính tinh $stars toạ thủ cung Mệnh. Bản mệnh đắc thời, hội tụ cát tinh nâng đỡ, tiền đồ rộng mở thênh thang.';
  }
}

/// Preview & Share Modal Dialog for Royal Ziwei Decree
class RoyalZiweiPreviewDialog extends ConsumerStatefulWidget {
  final ChartDetailResponse chartData;

  const RoyalZiweiPreviewDialog({
    super.key,
    required this.chartData,
  });

  static Future<void> show(
    BuildContext context, {
    required ChartDetailResponse chartData,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => RoyalZiweiPreviewDialog(chartData: chartData),
    );
  }

  @override
  ConsumerState<RoyalZiweiPreviewDialog> createState() => _RoyalZiweiPreviewDialogState();
}

class _RoyalZiweiPreviewDialogState extends ConsumerState<RoyalZiweiPreviewDialog> {
  final ScreenshotController _screenshotController = ScreenshotController();
  bool _isSharing = false;

  RoyalAspectRatio _aspectRatio = RoyalAspectRatio.standard;
  RoyalSealType _sealType = RoyalSealType.khamThien;
  bool _showWatermark = true;
  late final TextEditingController _customSealController;

  @override
  void initState() {
    super.initState();
    final name = widget.chartData.chartRecord.snapshot.birth?['name']?.toString() ??
        widget.chartData.chartRecord.snapshot.summary?['name']?.toString() ??
        'Bản Mệnh';
    _customSealController = TextEditingController(text: name);
  }

  @override
  void dispose() {
    _customSealController.dispose();
    super.dispose();
  }

  Widget _buildCardWidget() {
    return RoyalZiweiCertificateCard(
      chartData: widget.chartData,
      isStory9_16: _aspectRatio == RoyalAspectRatio.story9_16,
      sealType: _sealType,
      customSealText: _sealType == RoyalSealType.custom ? _customSealController.text : null,
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

      // Tối ưu hóa dung lượng: Nén sang WebP (Sprint 60)
      final compressedResult = await RoyalImageCompressor.compress(imageBytes);

      final directory = await getTemporaryDirectory();
      final prefix = _aspectRatio == RoyalAspectRatio.story9_16 ? 'story_9_16' : 'card_3_4';
      final ext = compressedResult.fileExtension;
      final imageFile = File(
        '${directory.path}/chieu_chi_tu_vi_${prefix}_${widget.chartData.chartRecord.id}.$ext',
      );
      await imageFile.writeAsBytes(compressedResult.bytes);

      // Tự động lưu vào Thư Viện Hoàng Triều
      final name = widget.chartData.chartRecord.snapshot.birth?['name']?.toString() ??
          widget.chartData.chartRecord.snapshot.summary?['name']?.toString() ??
          'Quý Khách';

      final galleryItem = RoyalShareItem(
        id: 'ziwei_${widget.chartData.chartRecord.id}_${DateTime.now().millisecondsSinceEpoch}',
        title: 'Chiếu Chỉ Tử Vi — $name',
        type: RoyalCardType.ziwei,
        createdAt: DateTime.now(),
        imagePath: imageFile.path,
        subtitle: 'Bản Mệnh • ${widget.chartData.chartRecord.id.substring(0, 8)}',
        aspectRatio: _aspectRatio,
        customSealName: _sealType == RoyalSealType.custom ? _customSealController.text : _sealType.label,
      );

      await RoyalGalleryService().saveItem(
        galleryItem,
        isPro: ref.read(isProUserProvider),
      );

      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(imageFile.path)],
          text: 'Chiếu chỉ Mệnh số Tử Vi từ Khâm Thiên Giám — Tử Vi Toàn Tập',
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
          color: const Color(0xFF140D26),
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
                    'XUẤT THIỆP HOÀNG TRIỀU',
                    style: GoogleFonts.cinzel(
                      color: const Color(0xFFFFD700),
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close, color: AppTheme.mysticalTextSecondary, size: 20),
                  ),
                ],
              ),
            ),

            // Controls Bar: Aspect Ratio & Seal Selector
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  // 1. Aspect Ratio Selector
                  Row(
                    children: [
                      const Text(
                        'Định dạng: ',
                        style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 11.5),
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const Text('3:4 Chuẩn 📜', style: TextStyle(fontSize: 11)),
                        selected: _aspectRatio == RoyalAspectRatio.standard,
                        selectedColor: const Color(0xFFFFD700),
                        labelStyle: TextStyle(
                          color: _aspectRatio == RoyalAspectRatio.standard
                              ? const Color(0xFF140D26)
                              : Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                        backgroundColor: const Color(0xFF22163D),
                        onSelected: (_) => setState(() => _aspectRatio = RoyalAspectRatio.standard),
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const Text('9:16 Story 📱', style: TextStyle(fontSize: 11)),
                        selected: _aspectRatio == RoyalAspectRatio.story9_16,
                        selectedColor: const Color(0xFFFFD700),
                        labelStyle: TextStyle(
                          color: _aspectRatio == RoyalAspectRatio.story9_16
                              ? const Color(0xFF140D26)
                              : Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                        backgroundColor: const Color(0xFF22163D),
                        onSelected: (_) => setState(() => _aspectRatio = RoyalAspectRatio.story9_16),
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
                        dropdownColor: const Color(0xFF1E1238),
                        underline: const SizedBox(),
                        style: const TextStyle(color: Color(0xFFFFD700), fontSize: 11.5),
                        items: [
                          DropdownMenuItem(
                            value: RoyalSealType.khamThien,
                            child: Text(RoyalSealType.khamThien.label),
                          ),
                          DropdownMenuItem(
                            value: RoyalSealType.menhChu,
                            child: Text(RoyalSealType.menhChu.label),
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
                            style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 11),
                          ),
                          Switch(
                            value: _showWatermark,
                            activeThumbColor: const Color(0xFFFFD700),
                            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            onChanged: (v) => setState(() => _showWatermark = v),
                          ),
                        ],
                      ),
                    ],
                  ),

                  // 3. Custom Seal Name TextField (if custom)
                  if (_sealType == RoyalSealType.custom)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: SizedBox(
                        height: 32,
                        child: TextField(
                          controller: _customSealController,
                          style: const TextStyle(color: Colors.white, fontSize: 11),
                          decoration: InputDecoration(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            hintText: 'Nhập họ tên ấn triện (vd: Hoàng Kim)',
                            hintStyle: const TextStyle(color: Colors.white38, fontSize: 10),
                            filled: true,
                            fillColor: const Color(0xFF22163D),
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
                    icon: const Icon(Icons.close, color: AppTheme.mysticalTextSecondary),
                    label: const Text('Đóng', style: TextStyle(color: AppTheme.mysticalTextSecondary)),
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
                        : const Icon(Icons.share, color: Color(0xFF140D26), size: 18),
                    label: Text(
                      _isSharing ? 'Đang xuất ảnh...' : 'CHIA SẺ CHIẾU CHỈ',
                      style: GoogleFonts.cinzel(
                        color: const Color(0xFF140D26),
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFFD700),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
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
