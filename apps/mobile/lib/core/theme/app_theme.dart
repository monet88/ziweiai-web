import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Design tokens aligned with web Phase 11 Ticket 2 glass / mystical polish.
class AppTheme {
  static const Color paperCanvas = Color(0xFFF4F0EB);
  static const Color ink = Color(0xFF2C2C2C);
  static const Color inkMuted = Color(0xFF555555);
  static const Color taupe = Color(0xFF8A7E71);

  // Premium Mystical / glass palette
  static const Color mysticalBg = Color(0xFF0D0B14); // Deep dark blue/purple
  static const Color mysticalElevated = Color(0xFF171421); // Card surface
  static const Color mysticalInput = Color(0xFF1F1C2C); // Input field surface
  static const Color mysticalGold = Color(0xFFE8C37D); // Premium Gold
  static const Color mysticalAccent = Color(0xFF8A2BE2); // Neon Purple hint
  static const Color mysticalText = Color(0xFFF8F9FA); // Very bright white
  static const Color mysticalTextSecondary = Color(0xFFA0AAB2); // Soft blue-grey
  static const Color glassBorder = Color(0x1AFFFFFF); // 10% white for subtle border
  static const Color glassFill = Color(0x00FFFFFF); // Transparent, relies on mysticalElevated

  static ThemeData get paperCalm {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: paperCanvas,
        primary: ink,
        secondary: taupe,
      ),
      scaffoldBackgroundColor: paperCanvas,
      textTheme: GoogleFonts.interTextTheme(const TextTheme(
        displayLarge: TextStyle(color: ink, fontWeight: FontWeight.bold),
        bodyLarge: TextStyle(color: ink),
        bodyMedium: TextStyle(color: inkMuted),
      )),
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
      textTheme: GoogleFonts.interTextTheme(const TextTheme(
        displayLarge: TextStyle(color: mysticalText, fontWeight: FontWeight.bold),
        titleLarge: TextStyle(color: mysticalText, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(color: mysticalText),
        bodyMedium: TextStyle(color: mysticalTextSecondary),
      )),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        foregroundColor: mysticalGold,
        iconTheme: const IconThemeData(color: mysticalGold),
        titleTextStyle: GoogleFonts.playfairDisplay(
          color: mysticalGold,
          fontSize: 22,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.2,
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: mysticalGold,
        foregroundColor: Color(0xFF14110C),
      ),
    );
  }
}
