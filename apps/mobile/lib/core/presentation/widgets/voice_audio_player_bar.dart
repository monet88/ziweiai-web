import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/voice_synthesis_service.dart';
import '../../theme/app_theme.dart';
import '../../../ui/glass_panel.dart';

/// Compact Audio Waveform animation simulating mystical voice harmonics
class AnimatedWaveformVisualizer extends StatefulWidget {
  final bool isPlaying;

  const AnimatedWaveformVisualizer({super.key, required this.isPlaying});

  @override
  State<AnimatedWaveformVisualizer> createState() => _AnimatedWaveformVisualizerState();
}

class _AnimatedWaveformVisualizerState extends State<AnimatedWaveformVisualizer>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override

  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);
  }

  @override
  void didUpdateWidget(covariant AnimatedWaveformVisualizer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isPlaying && !_controller.isAnimating) {
      _controller.repeat(reverse: true);
    } else if (!widget.isPlaying && _controller.isAnimating) {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: List.generate(4, (index) {
            final double baseHeight = 6.0;
            final double animVal = widget.isPlaying
                ? (sin((_controller.value * pi * 2) + (index * 0.8)).abs() * 14.0)
                : 2.0;
            final double height = baseHeight + animVal;

            return Container(
              width: 3.5,
              height: height.clamp(4.0, 20.0),
              margin: const EdgeInsets.symmetric(horizontal: 1.5),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(2),
                gradient: CelestialGradients.imperialGold,
                boxShadow: widget.isPlaying ? CelestialShadows.goldGlow : null,
              ),
            );
          }),
        );
      },
    );
  }
}

/// A compact 1-tap Voice Play icon button that can be embedded into any card or narrative
class VoicePlayIconButton extends ConsumerWidget {
  final String text;
  final String title;

  const VoicePlayIconButton({
    super.key,
    required this.text,
    this.title = 'Luận Giải AI',
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final voiceState = ref.watch(voiceSynthesisProvider);
    final isCurrent = voiceState.currentText == text;
    final isPlaying = isCurrent && voiceState.isPlaying;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        ref.read(voiceSynthesisProvider.notifier).togglePlay(
              text: text,
              title: title,
            );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isPlaying
              ? AppTheme.goldBright.withValues(alpha: 0.2)
              : AppTheme.cosmosElevated,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isPlaying ? AppTheme.goldBright : AppTheme.mysticalGold.withValues(alpha: 0.35),
            width: isPlaying ? 1.4 : 0.8,
          ),
          boxShadow: isPlaying ? CelestialShadows.goldGlow : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isPlaying) ...[
              const AnimatedWaveformVisualizer(isPlaying: true),
              const SizedBox(width: 6),
            ] else ...[
              Icon(
                isCurrent && voiceState.isPaused
                    ? Icons.play_arrow_rounded
                    : Icons.volume_up_rounded,
                size: 16,
                color: AppTheme.goldBright,
              ),
              const SizedBox(width: 4),
            ],
            Text(
              isPlaying
                  ? 'Đang đọc'
                  : isCurrent && voiceState.isPaused
                      ? 'Tiếp tục'
                      : 'Nghe AI',
              style: TextStyle(
                color: AppTheme.goldBright,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Floating Celestial Luxury Audio Player Bar attached to screen bottom
class VoiceAudioPlayerBar extends ConsumerWidget {
  const VoiceAudioPlayerBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final voiceState = ref.watch(voiceSynthesisProvider);

    if (voiceState.isIdle) return const SizedBox.shrink();

    final notifier = ref.read(voiceSynthesisProvider.notifier);

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: GlassPanel(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        borderGradient: CelestialGradients.goldBorder,
        borderRadius: BorderRadius.circular(20),
        child: Row(
          children: [
            // Waveform & Icon
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: CelestialGradients.imperialGold,
                boxShadow: CelestialShadows.goldGlow,
              ),
              child: AnimatedWaveformVisualizer(isPlaying: voiceState.isPlaying),
            ),
            const SizedBox(width: 12),

            // Title & Status
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    voiceState.title.isNotEmpty ? voiceState.title : 'Giọng Đọc AI Phong Thủy',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.cinzel(
                      color: AppTheme.goldBright,
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    voiceState.isPlaying ? 'Đang đọc truyền cảm...' : 'Đang tạm dừng',
                    style: TextStyle(
                      color: voiceState.isPlaying
                          ? AppTheme.mysticalTextSecondary
                          : Colors.amber.shade300,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),

            // Zen Mode Toggle Chip (Khí Âm Thiền Định)
            GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                notifier.toggleZenMode();
                final isNowZen = !voiceState.isZenMode;
                ScaffoldMessenger.of(context).hideCurrentSnackBar();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    duration: const Duration(seconds: 2),
                    backgroundColor: AppTheme.cosmosSurface,
                    content: Text(
                      isNowZen ? '✦ Đã kích hoạt Khí Âm Thiền Định (Zen Sound)' : 'Đã tắt âm hưởng thiền',
                      style: const TextStyle(color: AppTheme.goldBright, fontWeight: FontWeight.bold),
                    ),
                  ),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
                margin: const EdgeInsets.only(right: 6),
                decoration: BoxDecoration(
                  gradient: voiceState.isZenMode ? CelestialGradients.imperialGold : null,
                  color: voiceState.isZenMode ? null : AppTheme.cosmosElevated,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: voiceState.isZenMode ? AppTheme.goldBright : AppTheme.mysticalGold.withValues(alpha: 0.4),
                    width: 0.8,
                  ),
                  boxShadow: voiceState.isZenMode ? CelestialShadows.goldGlow : null,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.spa_rounded,
                      size: 13,
                      color: voiceState.isZenMode ? const Color(0xFF141026) : AppTheme.goldBright,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      'ZEN',
                      style: TextStyle(
                        color: voiceState.isZenMode ? const Color(0xFF141026) : AppTheme.goldBright,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Speed multiplier chip (0.8x / 1.0x / 1.2x)
            GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                notifier.cycleSpeechRate();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                margin: const EdgeInsets.only(right: 6),
                decoration: BoxDecoration(
                  color: AppTheme.cosmosElevated,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppTheme.mysticalGold.withValues(alpha: 0.4),
                    width: 0.8,
                  ),
                ),
                child: Text(
                  '${voiceState.speechRate}x',
                  style: const TextStyle(
                    color: AppTheme.goldBright,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),

            // Play / Pause Button
            IconButton(
              icon: Icon(
                voiceState.isPlaying ? Icons.pause_circle_filled_rounded : Icons.play_circle_fill_rounded,
                color: AppTheme.goldBright,
                size: 32,
              ),
              onPressed: () {
                HapticFeedback.lightImpact();
                if (voiceState.isPlaying) {
                  notifier.pause();
                } else {
                  notifier.resume();
                }
              },
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
            const SizedBox(width: 8),

            // Close / Stop Button
            IconButton(
              icon: const Icon(Icons.close_rounded, color: AppTheme.mysticalTextSecondary, size: 20),
              onPressed: () {
                HapticFeedback.lightImpact();
                notifier.stop();
              },
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              tooltip: 'Dừng đọc',
            ),
          ],
        ),
      ),
    );
  }
}
