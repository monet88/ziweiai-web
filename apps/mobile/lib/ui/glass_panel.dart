import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';

/// GlassPanel 2.0: Frosted glass container with BackdropFilter, 
/// gradient border, soft glowing shadows, and built-in Haptic Feedback.
class GlassPanel extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius borderRadius;
  final double blurSigma;
  final Color? backgroundColor;
  final Gradient? backgroundGradient;
  final Gradient? borderGradient;
  final Color? borderColor;
  final double borderWidth;
  final List<BoxShadow>? shadows;
  final VoidCallback? onTap;
  final bool enableHaptics;

  const GlassPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.borderRadius = const BorderRadius.all(Radius.circular(20)),
    this.blurSigma = 16,
    this.backgroundColor,
    this.backgroundGradient,
    this.borderGradient,
    this.borderColor,
    this.borderWidth = 1.0,
    this.shadows,
    this.onTap,
    this.enableHaptics = true,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveBorderGradient = borderGradient ?? 
        (borderColor == null ? CelestialGradients.goldBorder : null);

    Widget content = Container(
      padding: padding,
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        color: backgroundGradient == null
            ? (backgroundColor ?? AppTheme.cosmosSurface.withValues(alpha: 0.75))
            : null,
        gradient: backgroundGradient ?? 
            (backgroundColor == null ? CelestialGradients.glassCard : null),
      ),
      child: child,
    );

    if (onTap != null) {
      content = Material(
        color: Colors.transparent,
        borderRadius: borderRadius,
        child: InkWell(
          borderRadius: borderRadius,
          onTap: () {
            if (enableHaptics) {
              HapticFeedback.lightImpact();
            }
            onTap!();
          },
          splashColor: AppTheme.mysticalGold.withValues(alpha: 0.12),
          highlightColor: AppTheme.mysticalGold.withValues(alpha: 0.06),
          child: content,
        ),
      );
    }

    Widget panel = ClipRRect(
      borderRadius: borderRadius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
        child: effectiveBorderGradient != null
            ? CustomPaint(
                foregroundPainter: _GradientBorderPainter(
                  strokeWidth: borderWidth,
                  radius: borderRadius,
                  gradient: effectiveBorderGradient,
                ),
                child: content,
              )
            : Container(
                decoration: BoxDecoration(
                  borderRadius: borderRadius,
                  border: Border.all(
                    color: borderColor ?? AppTheme.glassBorder,
                    width: borderWidth,
                  ),
                ),
                child: content,
              ),
      ),
    );

    if (shadows != null || margin != null) {
      return Container(
        margin: margin,
        decoration: BoxDecoration(
          borderRadius: borderRadius,
          boxShadow: shadows ?? CelestialShadows.glassElevation,
        ),
        child: panel,
      );
    }

    return Container(
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        boxShadow: CelestialShadows.glassElevation,
      ),
      child: panel,
    );
  }
}

class _GradientBorderPainter extends CustomPainter {
  final double strokeWidth;
  final BorderRadius radius;
  final Gradient gradient;

  _GradientBorderPainter({
    required this.strokeWidth,
    required this.radius,
    required this.gradient,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(
      strokeWidth / 2,
      strokeWidth / 2,
      size.width - strokeWidth,
      size.height - strokeWidth,
    );
    final rrect = radius.toRRect(rect);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..shader = gradient.createShader(rect);

    canvas.drawRRect(rrect, paint);
  }

  @override
  bool shouldRepaint(_GradientBorderPainter oldDelegate) =>
      oldDelegate.strokeWidth != strokeWidth ||
      oldDelegate.radius != radius ||
      oldDelegate.gradient != gradient;
}
