import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../data/models/chart_snapshot.dart';

/// Modal Bottom Sheet displaying in-depth Imperial Palace (Cung Vị) astrology details,
/// including 4 star tiers, Mutagens (Tứ Hóa), Royal Khâm Thiên Giám commentary,
/// and 48dp thumb-driven navigation across all 12 palaces.
class PalaceDetailBottomSheet extends StatefulWidget {
  final List<Palace> palaces;
  final int initialIndex;
  final ValueChanged<int>? onPalaceChanged;

  const PalaceDetailBottomSheet({
    super.key,
    required this.palaces,
    required this.initialIndex,
    this.onPalaceChanged,
  });

  static Future<void> show(
    BuildContext context, {
    required List<Palace> palaces,
    required int initialIndex,
    ValueChanged<int>? onPalaceChanged,
  }) {
    HapticFeedback.mediumImpact();
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PalaceDetailBottomSheet(
        palaces: palaces,
        initialIndex: initialIndex,
        onPalaceChanged: onPalaceChanged,
      ),
    );
  }

  @override
  State<PalaceDetailBottomSheet> createState() => _PalaceDetailBottomSheetState();
}

class _PalaceDetailBottomSheetState extends State<PalaceDetailBottomSheet> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  Palace get _currentPalace =>
      widget.palaces.firstWhere((p) => p.index == _currentIndex, orElse: () => widget.palaces.first);

  void _goToPalace(int nextIndex) {
    if (nextIndex < 0) nextIndex = 11;
    if (nextIndex > 11) nextIndex = 0;
    HapticFeedback.selectionClick();
    setState(() => _currentIndex = nextIndex);
    widget.onPalaceChanged?.call(nextIndex);
  }

  String _formatStemBranch(String stemKey, String branchKey) {
    final stem = stemKey.split('.').last.toUpperCase();
    final branch = branchKey.split('.').last.toUpperCase();

    final Map<String, String> stemVi = {
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

    final Map<String, String> branchVi = {
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
    if (lower.contains('mieu') || lower.contains('temple')) return ' (Miếu)';
    if (lower.contains('vuong') || lower.contains('prosper')) return ' (Vượng)';
    if (lower.contains('dac') || lower.contains('gain')) return ' (Đắc)';
    if (lower.contains('ham') || lower.contains('trap')) return ' (Hãm)';
    if (lower.contains('binh') || lower.contains('flat')) return ' (Bình)';
    return '';
  }

  Color _brightnessColor(String? key) {
    if (key == null) return AppTheme.goldBright;
    final lower = key.toLowerCase();
    if (lower.contains('mieu') || lower.contains('vuong')) return AppTheme.goldBright;
    if (lower.contains('dac')) return AppTheme.mysticalGold;
    if (lower.contains('ham')) return AppTheme.cinnabarLight;
    return AppTheme.mysticalTextSecondary;
  }

  bool _isMaleficStar(Star star) {
    final name = (star.displayName ?? star.nameKey).toLowerCase();
    final group = star.group.toLowerCase();
    if (group.contains('sat') || group.contains('malefic') || group.contains('bai')) return true;
    const malefics = [
      'kình', 'đà', 'hỏa', 'linh', 'không', 'kiếp', 'kỵ', 'khốc', 'hư', 'tang', 'hổ',
      'kình dương', 'đà la', 'hỏa tinh', 'linh tinh', 'địa không', 'địa kiếp', 'hóa kỵ',
      'thiên khốc', 'thiên hư', 'tang môn', 'bạch hổ', 'cô thần', 'quả tú', 'đại hao', 'tiểu hao'
    ];
    return malefics.any((m) => name.contains(m));
  }

  @override
  Widget build(BuildContext context) {
    final palace = _currentPalace;
    final stemBranch = _formatStemBranch(palace.heavenlyStemKey, palace.earthlyBranchKey);
    final palaceName = palace.displayName ?? palace.nameKey;

    // Categorize stars
    final majorStars = palace.majorStars;
    final mutagens = <Star>[];
    for (final s in [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars]) {
      if (s.mutagen != null && s.mutagen!.isNotEmpty) {
        mutagens.add(s);
      }
    }

    final auspiciousStars = <Star>[];
    final maleficStars = <Star>[];

    for (final s in [...palace.minorStars, ...palace.adjectiveStars]) {
      if (_isMaleficStar(s)) {
        maleficStars.add(s);
      } else {
        auspiciousStars.add(s);
      }
    }

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
        child: Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.86,
          ),
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xF51C1733),
                Color(0xF50D0B18),
              ],
            ),
            border: Border.all(
              color: AppTheme.glassBorderGold,
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.6),
                blurRadius: 30,
                offset: const Offset(0, -6),
              ),
              BoxShadow(
                color: AppTheme.mysticalGold.withValues(alpha: 0.12),
                blurRadius: 20,
                spreadRadius: -2,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Top drag pill handle
              Container(
                margin: const EdgeInsets.only(top: 10, bottom: 6),
                width: 38,
                height: 4,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(2),
                  color: AppTheme.mysticalGold.withValues(alpha: 0.4),
                ),
              ),

              // Header Row: Back/Next Navigation (48dp Touch Targets)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Previous Palace 48dp Button
                    SizedBox(
                      width: AppTheme.touchTargetMin,
                      height: AppTheme.touchTargetMin,
                      child: IconButton(
                        tooltip: 'Cung trước',
                        icon: const Icon(Icons.arrow_back_ios_new, size: 16, color: AppTheme.goldBright),
                        onPressed: () => _goToPalace(_currentIndex - 1),
                      ),
                    ),

                    // Palace Title & Badge
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(10),
                                gradient: palace.isBodyPalace || palace.isOriginalPalace
                                    ? CelestialGradients.imperialGold
                                    : null,
                                color: palace.isBodyPalace || palace.isOriginalPalace
                                    ? null
                                    : AppTheme.cosmosElevated,
                                border: Border.all(
                                  color: AppTheme.mysticalGold,
                                  width: 1,
                                ),
                                boxShadow: palace.isBodyPalace || palace.isOriginalPalace
                                    ? CelestialShadows.goldGlow
                                    : null,
                              ),
                              child: Text(
                                'CUNG $palaceName'.toUpperCase(),
                                style: GoogleFonts.cinzel(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  color: palace.isBodyPalace || palace.isOriginalPalace
                                      ? const Color(0xFF141026)
                                      : AppTheme.goldBright,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ),
                            if (palace.isBodyPalace) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  gradient: CelestialGradients.cinnabarImperial,
                                  border: Border.all(color: AppTheme.goldBright, width: 0.8),
                                ),
                                child: const Text(
                                  'THÂN CƯ',
                                  style: TextStyle(
                                    color: AppTheme.goldBright,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '$stemBranch · Vị trí ${palace.index + 1}/12 Cung',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.mysticalTextSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),

                    // Next Palace 48dp Button
                    SizedBox(
                      width: AppTheme.touchTargetMin,
                      height: AppTheme.touchTargetMin,
                      child: IconButton(
                        tooltip: 'Cung sau',
                        icon: const Icon(Icons.arrow_forward_ios, size: 16, color: AppTheme.goldBright),
                        onPressed: () => _goToPalace(_currentIndex + 1),
                      ),
                    ),
                  ],
                ),
              ),

              const Divider(color: AppTheme.glassBorderGold, height: 1),

              // Scrollable Palace Details
              Flexible(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Sub-header tags: Tràng Sinh & Đại Hạn
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          color: AppTheme.cosmosElevated.withValues(alpha: 0.6),
                          border: Border.all(color: AppTheme.glassBorderGold, width: 0.8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildInfoPill(
                              'VÒNG TRÀNG SINH',
                              palace.changsheng12Key?.split('.').last ?? 'Tràng Sinh',
                              Icons.spa,
                              AppTheme.etherealJade,
                            ),
                            Container(width: 1, height: 24, color: AppTheme.glassBorderGold),
                            _buildInfoPill(
                              'ĐẠI HẠN',
                              palace.decadalRange != null && palace.decadalRange!.length >= 2
                                  ? '${palace.decadalRange![0]} - ${palace.decadalRange![1]} Tuổi'
                                  : '${palace.ages.isNotEmpty ? palace.ages.first : 0} Tuổi',
                              Icons.timeline,
                              AppTheme.goldBright,
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 14),

                      // Section 1: CHÍNH DIỆU CUNG ĐÌNH
                      _buildStarSection(
                        title: 'CHÍNH TINH HOÀNG TRIỀU',
                        subtitle: 'Các đại tinh diệu chủ quản cung vị',
                        icon: Icons.brightness_high,
                        stars: majorStars,
                        accentColor: AppTheme.goldBright,
                        isMajor: true,
                      ),

                      const SizedBox(height: 12),

                      // Section 2: TỨ HÓA (NẾU CÓ)
                      if (mutagens.isNotEmpty) ...[
                        _buildMutagenSection(mutagens),
                        const SizedBox(height: 12),
                      ],

                      // Section 3: CÁT TINH (NGỌC BÍCH)
                      _buildStarSection(
                        title: 'CÁT TINH & PHƯỚC THIỆN',
                        subtitle: 'Phù trợ bản cung cát tường hanh thông',
                        icon: Icons.eco,
                        stars: auspiciousStars,
                        accentColor: AppTheme.etherealJade,
                        isMajor: false,
                      ),

                      const SizedBox(height: 12),

                      // Section 4: SÁT TINH & BẠI DIỆU (CHU SA)
                      _buildStarSection(
                        title: 'SÁT DIỆU & HUNG TINH',
                        subtitle: 'Các xung sát cần phòng ngừa và hóa giải',
                        icon: Icons.shield,
                        stars: maleficStars,
                        accentColor: AppTheme.cinnabarLight,
                        isMajor: false,
                      ),

                      const SizedBox(height: 14),

                      // Section 5: KHÂM THIÊN GIÁM NGỰ PHÊ
                      _buildImperialCommentary(palaceName, majorStars, maleficStars),

                      const SizedBox(height: 16),

                      // Close Button (48dp Touch Target)
                      SizedBox(
                        height: AppTheme.touchTargetMin,
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.goldBright,
                            side: const BorderSide(color: AppTheme.mysticalGold, width: 1),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () => Navigator.pop(context),
                          child: const Text(
                            'HOÀN TẤT TRA CỨU',
                            style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 1.0),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoPill(String label, String value, IconData icon, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 9,
                color: AppTheme.mysticalTextSecondary,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
            Text(
              value,
              style: TextStyle(
                fontSize: 13,
                color: color,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStarSection({
    required String title,
    required String subtitle,
    required IconData icon,
    required List<Star> stars,
    required Color accentColor,
    required bool isMajor,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: AppTheme.cosmosElevated.withValues(alpha: 0.5),
        border: Border.all(color: accentColor.withValues(alpha: 0.35), width: 0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: accentColor),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: accentColor,
                        letterSpacing: 0.8,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppTheme.mysticalTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(6),
                  color: accentColor.withValues(alpha: 0.15),
                ),
                child: Text(
                  '${stars.length} sao',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: accentColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (stars.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6.0),
              child: Text(
                isMajor ? 'Vô Chính Diệu (Mượn tinh diệu đối cung)' : 'Không có phụ diệu',
                style: const TextStyle(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  color: AppTheme.mysticalTextSecondary,
                ),
              ),
            )
          else
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: stars.map((s) {
                final brightness = _brightnessLabel(s.brightnessKey);
                final bColor = _brightnessColor(s.brightnessKey);
                final displayName = s.displayName ?? s.nameKey;

                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: isMajor
                        ? AppTheme.cosmosSurface
                        : accentColor.withValues(alpha: 0.12),
                    border: Border.all(
                      color: isMajor
                          ? AppTheme.mysticalGold.withValues(alpha: 0.5)
                          : accentColor.withValues(alpha: 0.35),
                      width: 0.8,
                    ),
                  ),
                  child: RichText(
                    text: TextSpan(
                      children: [
                        TextSpan(
                          text: displayName,
                          style: TextStyle(
                            fontSize: isMajor ? 13 : 11,
                            fontWeight: FontWeight.w800,
                            color: isMajor ? AppTheme.goldBright : accentColor,
                          ),
                        ),
                        if (brightness.isNotEmpty)
                          TextSpan(
                            text: brightness,
                            style: TextStyle(
                              fontSize: isMajor ? 11 : 9,
                              fontWeight: FontWeight.w700,
                              color: bColor,
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }

  Widget _buildMutagenSection(List<Star> mutagens) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        gradient: LinearGradient(
          colors: [
            AppTheme.cinnabarCrimson.withValues(alpha: 0.25),
            AppTheme.cosmosElevated.withValues(alpha: 0.6),
          ],
        ),
        border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.4), width: 0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.stars, size: 16, color: AppTheme.goldBright),
              SizedBox(width: 8),
              Text(
                'TỨ HÓA HOÀNG TRIỀU TỌA THỦ',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.goldBright,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: mutagens.map((s) {
              final mutagenStr = s.mutagen?.split('.').last ?? '';
              String label = 'HÓA';
              Color badgeBg = AppTheme.nephriteJade;
              if (mutagenStr.contains('luoc') || mutagenStr.contains('loc')) {
                label = 'HÓA LỘC';
                badgeBg = AppTheme.nephriteJade;
              } else if (mutagenStr.contains('quyen')) {
                label = 'HÓA QUYỀN';
                badgeBg = AppTheme.mysticalGold;
              } else if (mutagenStr.contains('khoa')) {
                label = 'HÓA KHOA';
                badgeBg = AppTheme.nebulaCyan;
              } else if (mutagenStr.contains('ky')) {
                label = 'HÓA KỴ';
                badgeBg = AppTheme.cinnabarCrimson;
              }

              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  color: badgeBg.withValues(alpha: 0.3),
                  border: Border.all(color: badgeBg, width: 0.8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      s.displayName ?? s.nameKey,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.mysticalText,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(4),
                        color: badgeBg,
                      ),
                      child: Text(
                        label,
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.cosmosDark,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildImperialCommentary(String palaceName, List<Star> majors, List<Star> malefics) {
    String summary = 'Cung $palaceName đắc chính diệu tọa thủ, khí tượng quang minh vững vàng.';
    if (majors.isEmpty) {
      summary = 'Cung $palaceName Vô Chính Diệu, cần mượn tinh lực đối cung chiếu rọi để định hình vận trình.';
    } else if (malefics.length >= 3) {
      summary = 'Cung $palaceName sát tinh trùng phùng, thời vận gặp thử thách tôi luyện, lấy nhu thắng cương.';
    } else if (majors.any((m) => (m.displayName ?? m.nameKey).contains('Tử Vi') || (m.displayName ?? m.nameKey).contains('Thiên Phủ'))) {
      summary = 'Đế tinh và Lệnh tinh hội tụ cung $palaceName, khí chất quý hiển, quyền biến uy nghi, dễ nắm cương vị cốt cán.';
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        gradient: LinearGradient(
          colors: [
            AppTheme.cosmosSurface,
            AppTheme.cosmosElevated.withValues(alpha: 0.8),
          ],
        ),
        border: Border.all(color: AppTheme.glassBorderGold, width: 0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: CelestialGradients.cinnabarImperial,
                ),
                child: const Icon(Icons.history_edu, size: 14, color: AppTheme.goldBright),
              ),
              const SizedBox(width: 8),
              Text(
                'KHÂM THIÊN GIÁM NGỰ PHÊ',
                style: GoogleFonts.cinzel(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.goldBright,
                  letterSpacing: 1.0,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            summary,
            style: const TextStyle(
              fontSize: 12,
              color: AppTheme.mysticalText,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}
