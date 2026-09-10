import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/app_theme.dart';
import '../../services/ritual_audio_service.dart';

/// Nút điều khiển nhanh Âm thanh Nghi lễ Hoàng Triều (Ceremony Audio Toggle)
/// Tích hợp trên AppBar hoặc Floating Bar tại các màn hình bốc quẻ / chiêm bái.
class CeremonyAudioToggle extends ConsumerWidget {
  final bool isFloating;
  final VoidCallback? onToggled;

  const CeremonyAudioToggle({
    super.key,
    this.isFloating = false,
    this.onToggled,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isMuted = ref.watch(ritualAudioNotifierProvider);
    final isOffline = ref.watch(offlineRitualModeProvider);

    final tooltipText = isMuted
        ? 'Bật âm thanh nghi lễ'
        : (isOffline ? 'Âm thanh nghi lễ • Chế độ Ngoại Tuyến (Preloaded)' : 'Tắt âm thanh nghi lễ (Nhấn giữ để bật Offline Mode)');

    Widget buildIconWithBadge(Icon iconWidget) {
      if (!isOffline || isMuted) return iconWidget;
      return Stack(
        clipBehavior: Clip.none,
        children: [
          iconWidget,
          Positioned(
            right: -2,
            top: -2,
            child: Container(
              width: 7,
              height: 7,
              decoration: const BoxDecoration(
                color: Color(0xFF4ADE80),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Color(0xFF4ADE80),
                    blurRadius: 4,
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    void handleLongPress() {
      HapticFeedback.mediumImpact();
      ref.read(offlineRitualModeProvider.notifier).toggle();
      final nowOffline = ref.read(offlineRitualModeProvider);
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            nowOffline
                ? '🎋 Đã kích hoạt Chế độ Nghi Lễ Ngoại Tuyến (Zero Latency)'
                : '☁️ Đã chuyển về chế độ âm thanh bình thường',
          ),
          duration: const Duration(seconds: 2),
        ),
      );
    }

    if (isFloating) {
      return Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: isMuted
              ? null
              : CelestialGradients.imperialGold,
          color: isMuted ? AppTheme.cosmosElevated.withValues(alpha: 0.8) : null,
          border: Border.all(
            color: isMuted ? AppTheme.mysticalGold.withValues(alpha: 0.3) : AppTheme.goldBright,
            width: 1.2,
          ),
          boxShadow: isMuted ? null : CelestialShadows.goldGlow,
        ),
        child: GestureDetector(
          onLongPress: handleLongPress,
          child: IconButton(
            icon: buildIconWithBadge(
              Icon(
                isMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                color: isMuted ? AppTheme.mysticalTextSecondary : const Color(0xFF141026),
                size: 20,
              ),
            ),
            tooltip: tooltipText,
            onPressed: () {
              HapticFeedback.lightImpact();
              ref.read(ritualAudioNotifierProvider.notifier).toggleMute();
              onToggled?.call();
            },
          ),
        ),
      );
    }

    return GestureDetector(
      onLongPress: handleLongPress,
      child: IconButton(
        icon: AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
          child: buildIconWithBadge(
            Icon(
              isMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
              key: ValueKey<String>('${isMuted}_$isOffline'),
              color: isMuted ? AppTheme.mysticalTextSecondary : AppTheme.goldBright,
              size: 22,
            ),
          ),
        ),
        tooltip: tooltipText,
        onPressed: () {
          HapticFeedback.lightImpact();
          ref.read(ritualAudioNotifierProvider.notifier).toggleMute();
          onToggled?.call();
        },
      ),
    );
  }
}
