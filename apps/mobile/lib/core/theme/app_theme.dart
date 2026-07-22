import 'package:flutter/material.dart';

/// Design tokens aligned with web Phase 11 Ticket 2 glass / mystical polish.
class AppTheme {
  static const Color paperCanvas = Color(0xFFF4F0EB);
  static const Color ink = Color(0xFF2C2C2C);
  static const Color inkMuted = Color(0xFF555555);
  static const Color taupe = Color(0xFF8A7E71);

  // Mystical / glass palette (chart detail)
  static const Color mysticalBg = Color(0xFF0C0B12);
  static const Color mysticalElevated = Color(0xFF15131D);
  static const Color mysticalGold = Color(0xFFD4AF37);
  static const Color mysticalText = Color(0xFFF5F1E8);
  static const Color mysticalTextSecondary = Color(0xFFCFC7BA);
  static const Color glassBorder = Color(0x29FFFFFF);
  static const Color glassFill = Color(0x12FFFFFF);

  static ThemeData get paperCalm {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: paperCanvas,
        primary: ink,
        secondary: taupe,
      ),
      scaffoldBackgroundColor: paperCanvas,
      textTheme: const TextTheme(
        displayLarge: TextStyle(color: ink, fontWeight: FontWeight.bold),
        bodyLarge: TextStyle(color: ink),
        bodyMedium: TextStyle(color: inkMuted),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: ink),
        titleTextStyle: TextStyle(
          color: ink,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  /// Dark mystical theme for chart detail (glass surfaces + gold accent).
  static ThemeData get mystical {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: const ColorScheme.dark(
        primary: mysticalGold,
        onPrimary: Color(0xFF14110C),
        secondary: taupe,
        surface: mysticalElevated,
        onSurface: mysticalText,
      ),
      scaffoldBackgroundColor: mysticalBg,
      textTheme: const TextTheme(
        displayLarge: TextStyle(color: mysticalText, fontWeight: FontWeight.bold),
        titleLarge: TextStyle(color: mysticalText, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(color: mysticalText),
        bodyMedium: TextStyle(color: mysticalTextSecondary),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        foregroundColor: mysticalText,
        iconTheme: IconThemeData(color: mysticalText),
        titleTextStyle: TextStyle(
          color: mysticalText,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: mysticalGold,
        foregroundColor: Color(0xFF14110C),
      ),
    );
  }
}
