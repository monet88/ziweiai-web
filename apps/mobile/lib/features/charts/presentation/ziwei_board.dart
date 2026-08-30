import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:screenshot/screenshot.dart';

import '../data/models/chart_snapshot.dart';
import '../../../../core/theme/app_theme.dart';

class ZiweiBoard extends StatelessWidget {
  final ChartSnapshot snapshot;
  final ScreenshotController? screenshotController;

  const ZiweiBoard({super.key, required this.snapshot, this.screenshotController});

  @override
  Widget build(BuildContext context) {
    const double boardSize = 800.0;
    const double cellSize = boardSize / 4;

    // Helper to get row and column for a branch index (0=Zi, 1=Chou...)
    // Layout:
    // (0,0)=Si(5), (0,1)=Wu(6), (0,2)=Wei(7), (0,3)=Shen(8)
    // (1,0)=Chen(4),                           (1,3)=You(9)
    // (2,0)=Mao(3),                            (2,3)=Xu(10)
    // (3,0)=Yin(2), (3,1)=Chou(1), (3,2)=Zi(0), (3,3)=Hai(11)
    Offset getCellOffset(int index) {
      switch (index) {
        case 5: return const Offset(0, 0);
        case 6: return const Offset(cellSize, 0);
        case 7: return const Offset(cellSize * 2, 0);
        case 8: return const Offset(cellSize * 3, 0);
        case 4: return const Offset(0, cellSize);
        case 9: return const Offset(cellSize * 3, cellSize);
        case 3: return const Offset(0, cellSize * 2);
        case 10: return const Offset(cellSize * 3, cellSize * 2);
        case 2: return const Offset(0, cellSize * 3);
        case 1: return const Offset(cellSize, cellSize * 3);
        case 0: return const Offset(cellSize * 2, cellSize * 3);
        case 11: return const Offset(cellSize * 3, cellSize * 3);
        default: return Offset.zero;
      }
    }

    final palaces = snapshot.palaces ?? [];
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final borderColor = isDark ? AppTheme.glassBorderGold : const Color(0x33D4AF37);
    final boardBg = isDark ? AppTheme.cosmosDark : const Color(0xFF141026);
    final centerBg = isDark ? AppTheme.cosmosSurface : const Color(0xFF1C1733);

    return InteractiveViewer(
      constrained: false,
      boundaryMargin: const EdgeInsets.all(32),
      minScale: 0.2,
      maxScale: 2.5,
      child: Screenshot(
        controller: screenshotController ?? ScreenshotController(),
        child: Container(
          width: boardSize,
          height: boardSize,
          decoration: BoxDecoration(
            border: Border.all(color: AppTheme.mysticalGold.withValues(alpha: 0.4), width: 1.5),
            color: boardBg,
            boxShadow: [
              BoxShadow(
                color: AppTheme.nebulaPurple.withValues(alpha: 0.25),
                blurRadius: 30,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Stack(
            children: [
              // Center info area (Thái Cực & Thiên Bàn)
              Positioned(
                left: cellSize,
                top: cellSize,
                width: cellSize * 2,
                height: cellSize * 2,
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: borderColor, width: 1.2),
                    color: centerBg,
                    gradient: RadialGradient(
                      center: Alignment.center,
                      radius: 0.85,
                      colors: [
                        AppTheme.cosmosElevated,
                        AppTheme.cosmosSurface,
                        AppTheme.cosmosDeep,
                      ],
                    ),
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Yin-Yang & Compass Icon
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: CelestialGradients.imperialGold,
                            boxShadow: CelestialShadows.goldGlow,
                          ),
                          child: const Icon(
                            Icons.brightness_medium,
                            size: 32,
                            color: Color(0xFF141026),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          snapshot.summary?['name']?.toString() ?? 'Tử Vi Toàn Tập',
                          style: GoogleFonts.cinzel(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.goldBright,
                            letterSpacing: 1.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            color: AppTheme.cosmosDark.withValues(alpha: 0.6),
                            border: Border.all(
                              color: AppTheme.mysticalGold.withValues(alpha: 0.3),
                              width: 1,
                            ),
                          ),
                          child: Text(
                            'Năm sinh: ${snapshot.birth?['solarYear'] ?? ''}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.mysticalTextSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // 12 Palaces
              for (final palace in palaces)
                Positioned(
                  left: getCellOffset(palace.index).dx,
                  top: getCellOffset(palace.index).dy,
                  width: cellSize,
                  height: cellSize,
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {
                        HapticFeedback.lightImpact();
                      },
                      splashColor: AppTheme.mysticalGold.withValues(alpha: 0.15),
                      highlightColor: AppTheme.mysticalGold.withValues(alpha: 0.08),
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: borderColor, width: 0.8),
                          gradient: palace.isBodyPalace || palace.isOriginalPalace
                              ? LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    AppTheme.mysticalGold.withValues(alpha: 0.18),
                                    AppTheme.nebulaPurple.withValues(alpha: 0.12),
                                    AppTheme.cosmosSurface.withValues(alpha: 0.8),
                                  ],
                                )
                              : LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    AppTheme.cosmosSurface.withValues(alpha: 0.9),
                                    AppTheme.cosmosDeep.withValues(alpha: 0.95),
                                  ],
                                ),
                        ),
                        padding: const EdgeInsets.all(10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Palace name badge (e.g. MỆNH, QUAN LỘC)
                            Center(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  gradient: palace.isBodyPalace || palace.isOriginalPalace
                                      ? CelestialGradients.imperialGold
                                      : null,
                                  color: palace.isBodyPalace || palace.isOriginalPalace
                                      ? null
                                      : AppTheme.cosmosElevated,
                                  border: Border.all(
                                    color: palace.isBodyPalace || palace.isOriginalPalace
                                        ? Colors.transparent
                                        : AppTheme.mysticalGold.withValues(alpha: 0.3),
                                    width: 0.8,
                                  ),
                                ),
                                child: Text(
                                  palace.displayName ?? palace.nameKey,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13,
                                    color: palace.isBodyPalace || palace.isOriginalPalace
                                        ? const Color(0xFF141026)
                                        : AppTheme.goldBright,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),

                            // Major stars (Chính tinh)
                            ...palace.majorStars.map((s) => Padding(
                              padding: const EdgeInsets.only(bottom: 2.0),
                              child: Text(
                                s.displayName ?? s.nameKey,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13,
                                  color: Color(0xFFFF6B6B),
                                  letterSpacing: 0.2,
                                ),
                              ),
                            )),

                            // Minor stars (Phụ tinh)
                            ...palace.minorStars.take(3).map((s) => Padding(
                              padding: const EdgeInsets.only(bottom: 1.0),
                              child: Text(
                                s.displayName ?? s.nameKey,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 11,
                                  color: Color(0xFF4DD0E1),
                                ),
                              ),
                            )),

                            const Spacer(),

                            // Footer: Đại hạn & Can Chi
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Flexible(
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(4),
                                      color: AppTheme.cosmosDark.withValues(alpha: 0.5),
                                    ),
                                    child: Text(
                                      '${palace.ages.isNotEmpty ? palace.ages.first : ''}',
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: AppTheme.mysticalTextSecondary,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                                Flexible(
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(4),
                                      color: AppTheme.mysticalGold.withValues(alpha: 0.12),
                                    ),
                                    child: Text(
                                      '${palace.heavenlyStemKey.split('.').last} ${palace.earthlyBranchKey.split('.').last}',
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: AppTheme.goldBright,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
