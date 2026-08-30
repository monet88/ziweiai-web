import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/theme/app_theme.dart';
import '../../../ui/animated_background.dart';
import '../../../ui/glass_panel.dart';

class VisionResultScreen extends StatelessWidget {
  final Map<String, dynamic> result;

  const VisionResultScreen({
    super.key,
    required this.result,
  });

  @override
  Widget build(BuildContext context) {
    final narrative = result['narrative'] as String? ??
        result['explanation'] as String? ??
        'Không có dữ liệu luận giải.';

    final kindString = result['kind'] as String?;
    String title = 'LUẬN GIẢI SINH TRẮC HỌC AI';
    String subtitle = 'Bản Phân Tích Chuyên Sâu';
    IconData iconData = Icons.auto_awesome;

    if (kindString == 'face') {
      title = 'TƯỚNG MẠO TẬP THÀNH';
      subtitle = 'Luận Giải Tam Đình & Ngũ Nhạc';
      iconData = Icons.face_retouching_natural;
    } else if (kindString == 'palm') {
      title = 'CHỈ TAY ĐỊNH MỆNH';
      subtitle = 'Luận Giải Sinh Đạo, Trí Đạo, Tâm Đạo';
      iconData = Icons.pan_tool_outlined;
    } else if (kindString == 'tarot') {
      title = 'KẾT QUẢ ĐỌC BÀI TAROT';
      subtitle = 'Thông Điệp Huyền Học Vũ Trụ';
      iconData = Icons.style;
    }

    return Scaffold(
      body: Stack(
        children: [
          // Background Starfield
          const Positioned.fill(
            child: AnimatedBackground(child: SizedBox.shrink()),
          ),

          SafeArea(
            child: Column(
              children: [
                // Top Custom Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios_new, color: AppTheme.goldBright),
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          context.pop();
                        },
                      ),
                      Text(
                        'KẾT QUẢ PHÂN TÍCH',
                        style: GoogleFonts.cinzel(
                          color: AppTheme.goldBright,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.5,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.share_outlined, color: AppTheme.goldBright),
                        onPressed: () async {
                          HapticFeedback.lightImpact();
                          await SharePlus.instance.share(
                            ShareParams(
                              text:
                                  '🔮 Luận giải $title từ Tử Vi Toàn Tập AI:\n\n$narrative\n\nXem thêm tại: https://tuvitoantap.vercel.app',
                            ),
                          );
                        },
                        tooltip: 'Chia sẻ luận giải',
                      ),
                    ],
                  ),
                ),

                // Main Narrative Body
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Header Card
                        Container(
                          padding: const EdgeInsets.all(20.0),
                          decoration: BoxDecoration(
                            gradient: CelestialGradients.imperialGold,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: CelestialShadows.goldGlow,
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 56,
                                height: 56,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF141026),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: AppTheme.goldBright,
                                    width: 1.5,
                                  ),
                                ),
                                child: Center(
                                  child: Icon(
                                    iconData,
                                    color: AppTheme.goldBright,
                                    size: 30,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      title,
                                      style: GoogleFonts.cinzel(
                                        color: const Color(0xFF141026),
                                        fontSize: 16,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 1.0,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      subtitle,
                                      style: const TextStyle(
                                        color: Color(0xFF141026),
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // Markdown Narrative in GlassPanel
                        GlassPanel(
                          padding: const EdgeInsets.all(20.0),
                          borderGradient: CelestialGradients.goldBorder,
                          child: MarkdownBody(
                            data: narrative,
                            selectable: true,
                            styleSheet: MarkdownStyleSheet(
                              p: const TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                height: 1.65,
                                letterSpacing: 0.2,
                              ),
                              h1: GoogleFonts.cinzel(
                                color: AppTheme.goldBright,
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                height: 1.5,
                              ),
                              h2: GoogleFonts.cinzel(
                                color: AppTheme.goldBright,
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                                height: 1.5,
                              ),
                              h3: GoogleFonts.cinzel(
                                color: AppTheme.goldBright,
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                height: 1.4,
                              ),
                              strong: const TextStyle(
                                color: AppTheme.goldBright,
                                fontWeight: FontWeight.bold,
                              ),
                              listBullet: const TextStyle(
                                color: AppTheme.goldBright,
                                fontSize: 15,
                              ),
                              blockquote: const TextStyle(
                                color: AppTheme.mysticalTextSecondary,
                                fontStyle: FontStyle.italic,
                              ),
                              blockquoteDecoration: BoxDecoration(
                                color: Colors.black26,
                                border: const Border(
                                  left: BorderSide(
                                    color: AppTheme.goldBright,
                                    width: 3,
                                  ),
                                ),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 28),

                        // Action Buttons
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                icon: const Icon(Icons.refresh, color: AppTheme.goldBright, size: 18),
                                label: Text(
                                  'QUÉT ẢNH MỚI',
                                  style: GoogleFonts.cinzel(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppTheme.goldBright,
                                  side: const BorderSide(color: AppTheme.mysticalGold),
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                onPressed: () {
                                  HapticFeedback.lightImpact();
                                  context.pop();
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  gradient: CelestialGradients.imperialGold,
                                  boxShadow: CelestialShadows.goldGlow,
                                ),
                                child: ElevatedButton.icon(
                                  icon: const Icon(Icons.home, color: Color(0xFF141026), size: 18),
                                  label: Text(
                                    'TRANG CHỦ',
                                    style: GoogleFonts.cinzel(
                                      fontWeight: FontWeight.w900,
                                      color: const Color(0xFF141026),
                                      fontSize: 13,
                                    ),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.transparent,
                                    foregroundColor: const Color(0xFF141026),
                                    shadowColor: Colors.transparent,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                  onPressed: () {
                                    HapticFeedback.lightImpact();
                                    context.go('/');
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
