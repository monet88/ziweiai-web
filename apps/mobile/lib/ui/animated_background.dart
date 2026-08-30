import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

/// CelestialBackground / AnimatedBackground:
/// Renders a Deep Cosmos gradient canvas with ambient Nebula auras and
/// a lightweight, GPU-accelerated twinkling Starfield.
class AnimatedBackground extends StatefulWidget {
  final Widget child;
  final bool showStars;
  final bool showNebula;

  const AnimatedBackground({
    super.key,
    required this.child,
    this.showStars = true,
    this.showNebula = true,
  });

  @override
  State<AnimatedBackground> createState() => _AnimatedBackgroundState();
}

class _AnimatedBackgroundState extends State<AnimatedBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // 1. Deep Cosmos Canvas
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: CelestialGradients.cosmosBg,
          ),
        ),

        // 2. Ambient Nebula Auras
        if (widget.showNebula) ...[
          Positioned(
            top: -100,
            right: -80,
            width: 320,
            height: 320,
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppTheme.nebulaPurple.withValues(alpha: 0.18),
                      AppTheme.nebulaPurple.withValues(alpha: 0.05),
                      Colors.transparent,
                    ],
                    stops: const [0.0, 0.5, 1.0],
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            top: 280,
            left: -120,
            width: 340,
            height: 340,
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppTheme.nebulaCyan.withValues(alpha: 0.12),
                      AppTheme.nebulaCyan.withValues(alpha: 0.03),
                      Colors.transparent,
                    ],
                    stops: const [0.0, 0.5, 1.0],
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 40,
            right: -60,
            width: 280,
            height: 280,
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppTheme.goldBright.withValues(alpha: 0.08),
                      Colors.transparent,
                    ],
                    stops: const [0.0, 1.0],
                  ),
                ),
              ),
            ),
          ),
        ],

        // 3. Twinkling Starfield
        if (widget.showStars)
          RepaintBoundary(
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, _) {
                return CustomPaint(
                  painter: _StarfieldPainter(progress: _controller.value),
                  size: Size.infinite,
                );
              },
            ),
          ),

        // 4. Foreground Content
        widget.child,
      ],
    );
  }
}

class _Star {
  final double xRatio;
  final double yRatio;
  final double radius;
  final double phase;
  final double speed;
  final Color color;

  const _Star({
    required this.xRatio,
    required this.yRatio,
    required this.radius,
    required this.phase,
    required this.speed,
    required this.color,
  });
}

class _StarfieldPainter extends CustomPainter {
  final double progress;

  // Pre-calculated deterministic stars
  static final List<_Star> _stars = List.generate(36, (i) {
    final rand = math.Random(i * 137);
    final isGold = i % 5 == 0;
    final isCyan = i % 7 == 0;
    return _Star(
      xRatio: rand.nextDouble(),
      yRatio: rand.nextDouble(),
      radius: 0.75 + rand.nextDouble() * 1.5,
      phase: rand.nextDouble() * 2 * math.pi,
      speed: 1.0 + rand.nextDouble() * 2.0,
      color: isGold
          ? AppTheme.goldBright
          : (isCyan ? AppTheme.nebulaCyan : Colors.white),
    );
  });

  _StarfieldPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    for (final star in _stars) {
      final opacity = (0.2 +
              0.8 *
                  ((math.sin(progress * 2 * math.pi * star.speed + star.phase) +
                          1) /
                      2))
          .clamp(0.1, 0.95);

      final paint = Paint()
        ..color = star.color.withValues(alpha: opacity)
        ..style = PaintingStyle.fill;

      final dx = star.xRatio * size.width;
      final dy = star.yRatio * size.height;

      canvas.drawCircle(Offset(dx, dy), star.radius, paint);
    }
  }

  @override
  bool shouldRepaint(_StarfieldPainter oldDelegate) =>
      oldDelegate.progress != progress;
}
