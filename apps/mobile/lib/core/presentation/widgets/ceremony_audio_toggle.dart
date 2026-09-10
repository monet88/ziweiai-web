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
        child: IconButton(
          icon: Icon(
            isMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
            color: isMuted ? AppTheme.mysticalTextSecondary : const Color(0xFF141026),
            size: 20,
          ),
          tooltip: isMuted ? 'Bật âm thanh nghi lễ' : 'Tắt âm thanh nghi lễ',
          onPressed: () {
            HapticFeedback.lightImpact();
            ref.read(ritualAudioNotifierProvider.notifier).toggleMute();
            onToggled?.call();
          },
        ),
      );
    }

    return IconButton(
      icon: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
        child: Icon(
          isMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
          key: ValueKey<bool>(isMuted),
          color: isMuted ? AppTheme.mysticalTextSecondary : AppTheme.goldBright,
          size: 22,
        ),
      ),
      tooltip: isMuted ? 'Bật âm thanh nghi lễ' : 'Tắt âm thanh nghi lễ',
      onPressed: () {
        HapticFeedback.lightImpact();
        ref.read(ritualAudioNotifierProvider.notifier).toggleMute();
        onToggled?.call();
      },
    );
  }
}
