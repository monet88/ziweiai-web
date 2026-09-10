import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:screenshot/screenshot.dart';

import '../data/models/chart_snapshot.dart';
import '../../../../core/theme/app_theme.dart';
import 'palace_detail_bottom_sheet.dart';

class ZiweiBoard extends StatefulWidget {
  final ChartSnapshot snapshot;
  final ScreenshotController? screenshotController;
  final ValueChanged<Palace>? onPalaceSelected;
  final int? selectedPalaceIndex;

  const ZiweiBoard({
    super.key,
    required this.snapshot,
    this.screenshotController,
    this.onPalaceSelected,
    this.selectedPalaceIndex,
  });

  @override
  State<ZiweiBoard> createState() => _ZiweiBoardState();
}

class _ZiweiBoardState extends State<ZiweiBoard> {
  late final TransformationController _transformationController;
  bool _initializedScale = false;
  int? _selectedPalaceIndex;

  @override
  void initState() {
    super.initState();
    _transformationController = TransformationController();
    _selectedPalaceIndex = widget.selectedPalaceIndex;
  }

  @override
  void dispose() {
    _transformationController.dispose();
    super.dispose();
  }

  void _resetZoom(double availableWidth) {
    final double initialScale = availableWidth / 800.0;
    _transformationController.value = Matrix4.diagonal3Values(initialScale, initialScale, 1.0);
  }

  @override
  Widget build(BuildContext context) {
    const double boardSize = 800.0;
    const double cellSize = boardSize / 4;

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

    final palaces = widget.snapshot.palaces ?? [];
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final borderColor = isDark ? AppTheme.glassBorderGold : const Color(0x33D4AF37);
    final boardBg = isDark ? AppTheme.cosmosDark : const Color(0xFF141026);
    final centerBg = isDark ? AppTheme.cosmosSurface : const Color(0xFF1C1733);

    return LayoutBuilder(
      builder: (context, constraints) {
        final availableWidth = constraints.maxWidth.isFinite && constraints.maxWidth > 0
            ? constraints.maxWidth
            : MediaQuery.of(context).size.width - 48;

        if (!_initializedScale && availableWidth > 0) {
          final double initialScale = availableWidth / boardSize;
          _transformationController.value = Matrix4.diagonal3Values(initialScale, initialScale, 1.0);
          _initializedScale = true;
        }

        return Stack(
          children: [
            GestureDetector(
              onDoubleTap: () {
                HapticFeedback.lightImpact();
                _resetZoom(availableWidth);
              },
              child: InteractiveViewer(
                transformationController: _transformationController,
                constrained: false,
                boundaryMargin: const EdgeInsets.all(40),
                minScale: 0.2,
                maxScale: 3.5,
                child: Screenshot(
                  controller: widget.screenshotController ?? ScreenshotController(),
                  child: Container(
                    width: boardSize,
                    height: boardSize,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: AppTheme.mysticalGold.withValues(alpha: 0.4),
                        width: 1.5,
                      ),
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
                                    widget.snapshot.summary?['name']?.toString() ?? 'Tử Vi Toàn Tập',
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
                                      'Năm sinh: ${widget.snapshot.birth?['solarYear'] ?? ''}',
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
                        for (final palace in palaces) ...[
                          Builder(
                            builder: (context) {
                              final isSelected = _selectedPalaceIndex == palace.index;

                              return Positioned(
                                left: getCellOffset(palace.index).dx,
                                top: getCellOffset(palace.index).dy,
                                width: cellSize,
                                height: cellSize,
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    onTap: () {
                                      HapticFeedback.mediumImpact();
                                      setState(() => _selectedPalaceIndex = palace.index);
                                      if (widget.onPalaceSelected != null) {
                                        widget.onPalaceSelected!(palace);
                                      } else {
                                        PalaceDetailBottomSheet.show(
                                          context,
                                          palaces: widget.snapshot.palaces ?? [],
                                          initialIndex: palace.index,
                                          onPalaceChanged: (idx) {
                                            setState(() => _selectedPalaceIndex = idx);
                                          },
                                        );
                                      }
                                    },
                                    splashColor: AppTheme.mysticalGold.withValues(alpha: 0.25),
                                    highlightColor: AppTheme.mysticalGold.withValues(alpha: 0.12),
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 250),
                                      curve: Curves.easeOutCubic,
                                      decoration: BoxDecoration(
                                        border: Border.all(
                                          color: isSelected ? AppTheme.goldBright : borderColor,
                                          width: isSelected ? 2.0 : 0.8,
                                        ),
                                        boxShadow: isSelected
                                            ? [
                                                BoxShadow(
                                                  color: AppTheme.goldBright.withValues(alpha: 0.5),
                                                  blurRadius: 16,
                                                  spreadRadius: 2,
                                                ),
                                                BoxShadow(
                                                  color: AppTheme.nebulaPurple.withValues(alpha: 0.3),
                                                  blurRadius: 10,
                                                ),
                                              ]
                                            : null,
                                        gradient: palace.isBodyPalace || palace.isOriginalPalace
                                            ? LinearGradient(
                                                begin: Alignment.topLeft,
                                                end: Alignment.bottomRight,
                                                colors: [
                                                  AppTheme.mysticalGold.withValues(alpha: isSelected ? 0.3 : 0.18),
                                                  AppTheme.nebulaPurple.withValues(alpha: isSelected ? 0.2 : 0.12),
                                                  AppTheme.cosmosSurface.withValues(alpha: 0.8),
                                                ],
                                              )
                                            : LinearGradient(
                                                begin: Alignment.topLeft,
                                                end: Alignment.bottomRight,
                                                colors: [
                                                  isSelected
                                                      ? AppTheme.cosmosElevated.withValues(alpha: 0.95)
                                                      : AppTheme.cosmosSurface.withValues(alpha: 0.9),
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
                           );
                         },
                       ),
                     ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              right: 12,
              bottom: 12,
              child: Container(
                decoration: BoxDecoration(
                  color: AppTheme.cosmosDark.withValues(alpha: 0.8),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.mysticalGold.withValues(alpha: 0.4), width: 1),
                ),
                child: IconButton(
                  icon: const Icon(Icons.fit_screen, color: AppTheme.goldBright, size: 20),
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    _resetZoom(availableWidth);
                  },
                  tooltip: 'Vừa màn hình',
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
