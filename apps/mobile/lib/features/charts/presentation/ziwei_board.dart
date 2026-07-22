import 'package:flutter/material.dart';
import '../data/models/chart_snapshot.dart';
import 'package:screenshot/screenshot.dart';

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
    final borderColor = isDark ? Colors.white24 : Colors.black12;
    final boardBg = isDark ? const Color(0xFF1A1724) : theme.colorScheme.surface;
    final centerBg = isDark ? const Color(0xFF221F2E) : Colors.white;
    final bodyTint = isDark
        ? const Color(0xFFD4AF37).withValues(alpha: 0.12)
        : Colors.yellow.withValues(alpha: 0.1);
    final palaceNameColor = isDark ? const Color(0xFFE8B4B4) : Colors.red;
    final textColor = theme.colorScheme.onSurface;

    return InteractiveViewer(
      constrained: false,
      boundaryMargin: const EdgeInsets.all(32),
      minScale: 0.2,
      maxScale: 2.0,
      child: Screenshot(
        controller: screenshotController ?? ScreenshotController(),
        child: Container(
          width: boardSize,
          height: boardSize,
          decoration: BoxDecoration(
            border: Border.all(color: borderColor),
            color: boardBg,
          ),
          child: Stack(
          children: [
            // Center info area
            Positioned(
              left: cellSize,
              top: cellSize,
              width: cellSize * 2,
              height: cellSize * 2,
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: borderColor),
                  color: centerBg,
                ),
                padding: const EdgeInsets.all(16),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        snapshot.summary?['name']?.toString() ?? 'Tử Vi Toàn Tập',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: textColor,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Năm sinh: ${snapshot.birth?['solarYear'] ?? ''}',
                        style: TextStyle(fontSize: 16, color: textColor),
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
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: borderColor),
                    color: palace.isBodyPalace ? bodyTint : Colors.transparent,
                  ),
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Palace name (e.g. Mệnh, Quan Lộc)
                      Center(
                        child: Text(
                          palace.displayName ?? palace.nameKey,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: palaceNameColor,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Major stars
                      ...palace.majorStars.map((s) => Text(
                        s.displayName ?? s.nameKey,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: textColor,
                        ),
                      )),
                      const Spacer(),
                      // Heavenly stem & Earthly branch
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Flexible(
                            child: Text(
                              '${palace.ages.isNotEmpty ? palace.ages.first : ''}',
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: textColor),
                            ),
                          ),
                          Flexible(
                            child: Text(
                              '${palace.heavenlyStemKey.split('.').last} ${palace.earthlyBranchKey.split('.').last}',
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: textColor),
                            ),
                          ),
                        ],
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
}
