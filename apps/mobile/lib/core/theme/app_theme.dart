import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData get paperCalm {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFFF4F0EB), // Paper base
        primary: const Color(0xFF2C2C2C), // Deep charcoal
        secondary: const Color(0xFF8A7E71), // Warm taupe
      ),
      scaffoldBackgroundColor: const Color(0xFFF4F0EB),
      textTheme: const TextTheme(
        displayLarge: TextStyle(color: Color(0xFF2C2C2C), fontWeight: FontWeight.bold),
        bodyLarge: TextStyle(color: Color(0xFF2C2C2C)),
        bodyMedium: TextStyle(color: Color(0xFF555555)),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: Color(0xFF2C2C2C)),
        titleTextStyle: TextStyle(
          color: Color(0xFF2C2C2C),
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
