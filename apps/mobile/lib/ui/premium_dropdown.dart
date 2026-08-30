import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

class PremiumDropdown<T> extends StatelessWidget {
  final T value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;
  final String? labelText;
  final IconData? prefixIcon;

  const PremiumDropdown({
    super.key,
    required this.value,
    required this.items,
    required this.onChanged,
    this.labelText,
    this.prefixIcon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: AppTheme.mysticalInput,
        border: Border.all(color: Colors.transparent, width: 1.0),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (labelText != null) ...[
              const SizedBox(height: 8),
              Text(
                labelText!,
                style: const TextStyle(
                  color: AppTheme.mysticalTextSecondary,
                  fontSize: 12,
                ),
              ),
            ],
            Row(
              children: [
                if (prefixIcon != null) ...[
                  Icon(prefixIcon, color: AppTheme.mysticalTextSecondary),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<T>(
                      value: value,
                      isExpanded: true,
                      dropdownColor: AppTheme.mysticalElevated,
                      style: const TextStyle(color: AppTheme.mysticalText, fontSize: 16),
                      icon: const Icon(Icons.keyboard_arrow_down, color: AppTheme.mysticalTextSecondary),
                      items: items,
                      onChanged: onChanged,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
