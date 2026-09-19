import 'package:flutter/material.dart';

/// Design tokens and Celestial Luxury Design System for Tử Vi Toàn Tập Mobile.
class AppTheme {
  static const Color paperCanvas = Color(0xFFF4F0EB);
  static const Color ink = Color(0xFF2C2C2C);
  static const Color inkMuted = Color(0xFF555555);
  static const Color taupe = Color(0xFF8A7E71);

  // Deep Cosmos Universe Palette
  static const Color cosmosDark = Color(0xFF08060F); // Deep space absolute background
  static const Color cosmosDeep = Color(0xFF0D0B18); // Primary dark canvas
  static const Color cosmosSurface = Color(0xFF141026); // Card surface base
  static const Color cosmosElevated = Color(0xFF1C1733); // Elevated floating cards
  static const Color cosmosHighlight = Color(0xFF2A224D); // Highlighted / hover state

  // Imperial Gold & Celestial Glow Accents
  static const Color goldBright = Color(0xFFFFDF79); // Highlight top gold
  static const Color mysticalGold = Color(0xFFE8C37D); // Classic Imperial Gold
  static const Color goldDeep = Color(0xFF996515); // Rich bronze-gold shadow
  static const Color goldGlow = Color(0xFFFACC15); // Radiant gold glow

  // Nebula & Astral Accents
  static const Color nebulaPurple = Color(0xFF7C4DFF); // Mystical violet glow
  static const Color nebulaCyan = Color(0xFF00E5FF); // Cosmic cyan electric
  static const Color nebulaPink = Color(0xFFFF4081); // Astral magenta
  static const Color starlight = Color(0xFFE2E8F0); // Shimmering star white

  // Imperial Sacred Accents (Khâm Thiên Giám & Cát/Sát Tinh - Stitch MCP Royal Celestial)
  static const Color cinnabarCrimson = Color(0xFF8B1D1D); // Triện son Khâm Thiên Giám, Sát tinh
  static const Color cinnabarLight = Color(0xFFB82B2B); // Đỏ son tương tác, huy hiệu hoàng triều
  static const Color nephriteJade = Color(0xFF1D6355); // Ngọc bích, Cát tinh, Sinh khí
  static const Color etherealJade = Color(0xFF298A77); // Hào quang ngọc bích phát sáng

  /// Touch Target Minimum (48x48dp) adhering strictly to /mobile-design thumb ergonomics
  static const double touchTargetMin = 48.0;

  // Backwards-compatible aliases
  static const Color mysticalBg = cosmosDark;
  static const Color mysticalElevated = cosmosSurface;
  static const Color mysticalInput = Color(0xFF1A162B);
  static const Color mysticalAccent = nebulaPurple;
  static const Color mysticalText = Color(0xFFF8F9FA); // Pure bright celestial text
  static const Color mysticalTextSecondary = Color(0xFFA0AAB2); // Soft starlight grey
  static const Color glassBorder = Color(0x26FFFFFF); // 15% white translucent border
  static const Color glassBorderGold = Color(0x40E8C37D); // Translucent gold border
  static const Color glassFill = Color(0x00FFFFFF);

  // Local Unicode Font Families
  static const String fontSans = 'BeVietnamPro';
  static const String fontSerif = 'PlayfairDisplay';

  /// Helper tạo Typography Serif hoàng gia hỗ trợ 100% tiếng Việt Unicode (Playfair Display)
  static TextStyle titleFont({
    Color? color,
    double? fontSize,
    FontWeight? fontWeight,
    double? letterSpacing,
    double? height,
    FontStyle? fontStyle,
  }) {
    return TextStyle(
      fontFamily: fontSerif,
      color: color,
      fontSize: fontSize,
      fontWeight: fontWeight ?? FontWeight.w700,
      letterSpacing: letterSpacing,
      height: height,
      fontStyle: fontStyle,
    );
  }

  /// Helper tạo Typography Sans-serif tối ưu tiếng Việt Unicode (Be Vietnam Pro)
  static TextStyle bodyFont({
    Color? color,
    double? fontSize,
    FontWeight? fontWeight,
    double? letterSpacing,
    double? height,
    FontStyle? fontStyle,
  }) {
    return TextStyle(
      fontFamily: fontSans,
      color: color,
      fontSize: fontSize,
      fontWeight: fontWeight ?? FontWeight.normal,
      letterSpacing: letterSpacing,
      height: height,
      fontStyle: fontStyle,
    );
  }

  static ThemeData get paperCalm {
    return ThemeData(
      useMaterial3: true,
      fontFamily: fontSans,
      colorScheme: ColorScheme.fromSeed(
        seedColor: paperCanvas,
        primary: ink,
        secondary: taupe,
      ),
      scaffoldBackgroundColor: paperCanvas,
      textTheme: const TextTheme(
        displayLarge: TextStyle(color: ink, fontWeight: FontWeight.bold, fontFamily: fontSans),
        bodyLarge: TextStyle(color: ink, fontFamily: fontSans),
        bodyMedium: TextStyle(color: inkMuted, fontFamily: fontSans),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: ink),
        titleTextStyle: titleFont(
          color: ink,
          fontSize: 20,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  /// Celestial Luxury Dark theme (Glassmorphism + Imperial Gold + Nebula accents).
  static ThemeData get mystical {
    return ThemeData(
      useMaterial3: true,
      fontFamily: fontSans,
      brightness: Brightness.dark,
      colorScheme: const ColorScheme.dark(
        primary: mysticalGold,
        onPrimary: Color(0xFF14110C),
        secondary: nebulaPurple,
        surface: cosmosSurface,
        onSurface: mysticalText,
      ),
      scaffoldBackgroundColor: cosmosDark,
      textTheme: const TextTheme(
        displayLarge: TextStyle(color: mysticalText, fontWeight: FontWeight.bold, letterSpacing: -0.5, fontFamily: fontSans),
        titleLarge: TextStyle(color: mysticalText, fontWeight: FontWeight.w700, fontFamily: fontSans),
        titleMedium: TextStyle(color: mysticalText, fontWeight: FontWeight.w600, fontFamily: fontSans),
        bodyLarge: TextStyle(color: mysticalText, fontFamily: fontSans),
        bodyMedium: TextStyle(color: mysticalTextSecondary, fontFamily: fontSans),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        foregroundColor: mysticalGold,
        iconTheme: const IconThemeData(color: mysticalGold),
        titleTextStyle: titleFont(
          color: mysticalGold,
          fontSize: 20,
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

/// Gradients dedicated to Celestial Luxury Glassmorphism
class CelestialGradients {
  static const LinearGradient cosmosBg = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      AppTheme.cosmosDark,
      AppTheme.cosmosDeep,
      AppTheme.cosmosSurface,
    ],
  );

  static const LinearGradient imperialGold = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      AppTheme.goldBright,
      AppTheme.mysticalGold,
      AppTheme.goldDeep,
    ],
  );

  static const LinearGradient goldBorder = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0x99FFDF79),
      Color(0x33E8C37D),
      Color(0x10996515),
      Color(0x66FFDF79),
    ],
    stops: [0.0, 0.4, 0.7, 1.0],
  );

  static const LinearGradient starlightBorder = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0x66FFFFFF),
      Color(0x1AFFFFFF),
      Color(0x0DFFFFFF),
      Color(0x40FFFFFF),
    ],
  );

  static const LinearGradient glassCard = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0x381C1733),
      Color(0x22141026),
      Color(0x300D0B18),
    ],
  );

  static const LinearGradient nebulaCard = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0x307C4DFF),
      Color(0x1A141026),
      Color(0x2500E5FF),
    ],
  );

  static const LinearGradient goldShimmer = LinearGradient(
    begin: Alignment(-1.0, -0.3),
    end: Alignment(1.0, 0.3),
    colors: [
      Color(0xFFE8C37D),
      Color(0xFFFFF4D0),
      Color(0xFFE8C37D),
      Color(0xFFB38938),
    ],
    stops: [0.0, 0.35, 0.7, 1.0],
  );

  static const LinearGradient cinnabarImperial = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFFB82B2B),
      Color(0xFF8B1D1D),
      Color(0xFF5C1010),
    ],
  );

  static const LinearGradient jadeAuspicious = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF298A77),
      Color(0xFF1D6355),
      Color(0xFF134239),
    ],
  );
}

/// Shadows for depth and glowing aura
class CelestialShadows {
  static final List<BoxShadow> goldGlow = [
    BoxShadow(
      color: AppTheme.mysticalGold.withValues(alpha: 0.3),
      blurRadius: 18,
      spreadRadius: -2,
    ),
  ];

  static final List<BoxShadow> cinnabarGlow = [
    BoxShadow(
      color: AppTheme.cinnabarCrimson.withValues(alpha: 0.35),
      blurRadius: 18,
      spreadRadius: -2,
    ),
  ];

  static final List<BoxShadow> jadeGlow = [
    BoxShadow(
      color: AppTheme.etherealJade.withValues(alpha: 0.35),
      blurRadius: 18,
      spreadRadius: -2,
    ),
  ];

  static final List<BoxShadow> nebulaGlow = [
    BoxShadow(
      color: AppTheme.nebulaPurple.withValues(alpha: 0.35),
      blurRadius: 24,
      spreadRadius: -4,
    ),
  ];

  static final List<BoxShadow> glassElevation = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.4),
      blurRadius: 20,
      offset: const Offset(0, 8),
    ),
    BoxShadow(
      color: AppTheme.nebulaPurple.withValues(alpha: 0.08),
      blurRadius: 16,
      offset: const Offset(0, 2),
    ),
  ];
}
