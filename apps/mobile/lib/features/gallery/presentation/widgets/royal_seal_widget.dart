import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/royal_share_item.dart';

/// Widget Hiển thị Ấn Triện Đỏ Son Hoàng Triều (Imperial Cinnabar Seal)
class RoyalSealWidget extends StatelessWidget {
  final RoyalSealType sealType;
  final String? customSealText;

  const RoyalSealWidget({
    super.key,
    this.sealType = RoyalSealType.khamThien,
    this.customSealText,
  });

  (String, String) get _sealLines {
    if (sealType == RoyalSealType.custom &&
        customSealText != null &&
        customSealText!.trim().isNotEmpty) {
      final text = customSealText!.trim().toUpperCase();
      final words = text.split(RegExp(r'\s+'));
      if (words.length >= 2) {
        final half = (words.length / 2).ceil();
        final line1 = words.take(half).join(' ');
        final line2 = words.skip(half).join(' ');
        return (line1, line2);
      } else {
        return (text, 'KÍNH BÚT');
      }
    }
    return sealType.lines;
  }

  @override
  Widget build(BuildContext context) {
    final lines = _sealLines;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFF8B0000).withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFFF3333), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFCC0000).withValues(alpha: 0.4),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            lines.$1,
            style: GoogleFonts.cinzel(
              color: const Color(0xFFFFD700),
              fontSize: 8.5,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.0,
            ),
          ),
          Text(
            lines.$2,
            style: GoogleFonts.cinzel(
              color: const Color(0xFFFFD700),
              fontSize: 8.5,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

/// Widget Hiển thị Thủy Ấn Hoàng Triều In Chìm (Royal Watermark)
class RoyalWatermarkWidget extends StatelessWidget {
  final String text;

  const RoyalWatermarkWidget({
    super.key,
    this.text = 'KHÂM THIÊN GIÁM • TỬ VI TOÀN TẬP',
  });

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: IgnorePointer(
        child: Center(
          child: Transform.rotate(
            angle: -0.35,
            child: Text(
              text,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: const Color(0xFFFFD700).withValues(alpha: 0.05),
                fontSize: 16,
                fontWeight: FontWeight.w900,
                letterSpacing: 3.5,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
