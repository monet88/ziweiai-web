import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

class PremiumTextField extends StatefulWidget {
  final TextEditingController controller;
  final String labelText;
  final IconData? prefixIcon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final TextAlign textAlign;

  const PremiumTextField({
    super.key,
    required this.controller,
    required this.labelText,
    this.prefixIcon,
    this.keyboardType,
    this.obscureText = false,
    this.textAlign = TextAlign.start,
  });

  @override
  State<PremiumTextField> createState() => _PremiumTextFieldState();
}

class _PremiumTextFieldState extends State<PremiumTextField> {
  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      setState(() {
        _isFocused = _focusNode.hasFocus;
      });
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: AppTheme.mysticalInput,
        border: Border.all(
          color: _isFocused ? AppTheme.mysticalGold : Colors.transparent,
          width: 1.0,
        ),
      ),
      child: TextFormField(
        controller: widget.controller,
        focusNode: _focusNode,
        keyboardType: widget.keyboardType,
        obscureText: widget.obscureText,
        textAlign: widget.textAlign,
        style: const TextStyle(color: AppTheme.mysticalText),
        decoration: InputDecoration(
          labelText: widget.labelText,
          labelStyle: TextStyle(
            color: _isFocused ? AppTheme.mysticalGold : AppTheme.mysticalTextSecondary,
          ),
          prefixIcon: widget.prefixIcon != null
              ? Icon(
                  widget.prefixIcon,
                  color: _isFocused ? AppTheme.mysticalGold : AppTheme.mysticalTextSecondary,
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
    );
  }
}
