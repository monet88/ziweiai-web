import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../core/theme/app_theme.dart';

class PremiumButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final bool isPrimary;

  const PremiumButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.isLoading = false,
    this.isPrimary = true,
  });

  @override
  State<PremiumButton> createState() => _PremiumButtonState();
}

class _PremiumButtonState extends State<PremiumButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final bool disabled = widget.onPressed == null || widget.isLoading;

    final content = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.isLoading)
          const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: AppTheme.mysticalText,
            ),
          )
        else if (widget.icon != null) ...[
          Icon(
            widget.icon,
            color: widget.isPrimary ? AppTheme.mysticalBg : AppTheme.mysticalGold,
            size: 20,
          ),
          const SizedBox(width: 8),
        ],
        if (!widget.isLoading)
          Text(
            widget.label,
            style: TextStyle(
              color: widget.isPrimary ? AppTheme.mysticalBg : AppTheme.mysticalText,
              fontSize: 16,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
      ],
    );

    return GestureDetector(
      onTapDown: disabled ? null : (_) => setState(() => _isPressed = true),
      onTapUp: disabled ? null : (_) => setState(() => _isPressed = false),
      onTapCancel: disabled ? null : () => setState(() => _isPressed = false),
      onTap: disabled
          ? null
          : () {
              widget.onPressed?.call();
            },
      child: AnimatedContainer(
        duration: 150.ms,
        curve: Curves.easeInOut,
        transform: Matrix4.diagonal3Values(
          _isPressed ? 0.95 : 1.0,
          _isPressed ? 0.95 : 1.0,
          1.0,
        ),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: widget.isPrimary
              ? (disabled ? AppTheme.inkMuted : AppTheme.mysticalGold)
              : AppTheme.mysticalInput,
          border: widget.isPrimary
              ? null
              : Border.all(
                  color: disabled ? AppTheme.inkMuted : AppTheme.mysticalGold,
                  width: 1,
                ),
        ),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        child: Center(child: content),
      ),
    );
  }
}
