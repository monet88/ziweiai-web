import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../data/models/vision_kind.dart';
import 'vision_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../ui/animated_background.dart';
import '../../../ui/glass_panel.dart';
import '../../subscription/providers/subscription_provider.dart';
import '../../wallet/providers/wallet_provider.dart';
import '../../../core/providers/paywall_provider.dart';

class VisionInputScreen extends ConsumerStatefulWidget {
  final VisionKind kind;

  const VisionInputScreen({super.key, required this.kind});

  @override
  ConsumerState<VisionInputScreen> createState() => _VisionInputScreenState();
}

class _VisionInputScreenState extends ConsumerState<VisionInputScreen>
    with SingleTickerProviderStateMixin {
  File? _selectedImage;
  final _questionController = TextEditingController();
  late AnimationController _scanAnimationController;
  late Animation<double> _scanAnimation;

  @override
  void initState() {
    super.initState();
    _scanAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);

    _scanAnimation = Tween<double>(begin: 0.05, end: 0.95).animate(
      CurvedAnimation(
        parent: _scanAnimationController,
        curve: Curves.easeInOut,
      ),
    );
  }

  @override
  void dispose() {
    _scanAnimationController.dispose();
    _questionController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    HapticFeedback.lightImpact();
    final file = await ref.read(visionProvider.notifier).pickAndProcessImage(source);
    if (file != null) {
      setState(() {
        _selectedImage = file;
      });
      HapticFeedback.mediumImpact();
    }
  }

  Future<void> _analyze() async {
    if (_selectedImage == null) return;
    HapticFeedback.mediumImpact();

    final isPro = ref.read(isProUserProvider);
    final balance = ref.read(walletBalanceProvider).value ?? 0;

    // Check balance if not Pro
    if (!isPro && balance < 10) {
      ref.read(paywallProvider.notifier).show(
        cost: 10,
        featureName: widget.kind.label,
      );
      return;
    }

    ref.read(visionProvider.notifier).analyzeImage(
      kind: widget.kind,
      imagePath: _selectedImage!.path,
      question: _questionController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(visionProvider);
    final isPro = ref.watch(isProUserProvider);
    final isFace = widget.kind == VisionKind.face;

    ref.listen<AsyncValue<Map<String, dynamic>?>>(visionProvider, (previous, next) {
      if (next.hasValue && next.value != null && !next.isLoading) {
        if (mounted) {
          context.pushReplacement('/vision/result', extra: next.value);
        }
      } else if (next.hasError) {
        final errorMsg = next.error.toString();
        if (errorMsg.contains('XU') || errorMsg.contains('số dư')) {
          ref.read(paywallProvider.notifier).show(
            cost: 10,
            featureName: widget.kind.label,
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Lỗi: $errorMsg'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      }
    });

    final screenTitle = isFace ? 'XEM TƯỚNG MẶT AI' : 'XEM CHỈ TAY AI';
    final subtitle = isFace
        ? 'Quét sinh trắc học Tam Đình, Ngũ Nhạc & 12 Cung Tướng Mạo'
        : 'Quét vân tay, định vị Sinh Đạo, Trí Đạo, Tâm Đạo & Các Gò Bàn Tay';

    return Scaffold(
      body: Stack(
        children: [
          // Animated Starfield Background
          const Positioned.fill(
            child: AnimatedBackground(child: SizedBox.shrink()),
          ),

          SafeArea(
            child: Column(
              children: [
                // Top AppBar Header
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
                      Column(
                        children: [
                          Text(
                            screenTitle,
                            style: GoogleFonts.cinzel(
                              color: AppTheme.goldBright,
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                              shadows: CelestialShadows.goldGlow,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF00E676),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'AI BIOMETRIC SCANNER',
                                style: GoogleFonts.cinzel(
                                  color: AppTheme.mysticalTextSecondary,
                                  fontSize: 10,
                                  letterSpacing: 1.2,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      isPro
                          ? Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                gradient: CelestialGradients.imperialGold,
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: CelestialShadows.goldGlow,
                              ),
                              child: const Text(
                                'VIP PRO',
                                style: TextStyle(
                                  color: Color(0xFF141026),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            )
                          : Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.cosmosElevated,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppTheme.mysticalGold.withValues(alpha: 0.3)),
                              ),
                              child: const Text(
                                '10 XU',
                                style: TextStyle(
                                  color: AppTheme.goldBright,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                    ],
                  ),
                ),

                // Main Scrollable Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Subtitle guide
                        Center(
                          child: Text(
                            subtitle,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: AppTheme.mysticalTextSecondary,
                              fontSize: 13,
                              height: 1.4,
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // HUD Scanner Viewport
                        _buildScannerViewport(isFace: isFace),

                        const SizedBox(height: 20),

                        // Actions for Camera / Gallery
                        _buildImagePickActions(state.isLoading),

                        const SizedBox(height: 24),

                        // Question Input Form (GlassPanel)
                        GlassPanel(
                          padding: const EdgeInsets.all(16.0),
                          borderGradient: CelestialGradients.goldBorder,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.help_outline, color: AppTheme.goldBright, size: 18),
                                  const SizedBox(width: 8),
                                  Text(
                                    'CÂU HỎI TRỌNG TÂM (TUỲ CHỌN)',
                                    style: GoogleFonts.cinzel(
                                      color: AppTheme.goldBright,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 1.0,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              TextField(
                                controller: _questionController,
                                style: const TextStyle(color: Colors.white, fontSize: 14),
                                decoration: InputDecoration(
                                  hintText: isFace
                                      ? 'Ví dụ: Tướng mạo này có thuận lợi đường công danh năm 2026 không?'
                                      : 'Ví dụ: Đường chỉ tay này cho thấy tài lộc và tình duyên ra sao?',
                                  hintStyle: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.35),
                                    fontSize: 13,
                                  ),
                                  filled: true,
                                  fillColor: AppTheme.cosmosDark.withValues(alpha: 0.6),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(
                                      color: AppTheme.mysticalGold.withValues(alpha: 0.3),
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(
                                      color: AppTheme.mysticalGold.withValues(alpha: 0.3),
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(
                                      color: AppTheme.goldBright,
                                      width: 1.5,
                                    ),
                                  ),
                                ),
                                maxLines: 3,
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),

                        // Analyze Button
                        _buildAnalyzeButton(state.isLoading, isPro),
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

  Widget _buildScannerViewport({required bool isFace}) {
    return Container(
      height: 320,
      decoration: BoxDecoration(
        color: AppTheme.cosmosElevated.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: AppTheme.goldBright.withValues(alpha: 0.5),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.goldBright.withValues(alpha: 0.15),
            blurRadius: 20,
            spreadRadius: 2,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          children: [
            // Image Preview or Empty Silhouette Placeholder
            Positioned.fill(
              child: _selectedImage != null
                  ? Image.file(
                      _selectedImage!,
                      fit: BoxFit.cover,
                    )
                  : Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isFace ? Icons.face_retouching_natural : Icons.pan_tool_outlined,
                            size: 80,
                            color: AppTheme.goldBright.withValues(alpha: 0.4),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            isFace ? 'ĐẶT KHUÔN MẶT TRONG KHUNG' : 'ĐẶT LÒNG BÀN TAY TRONG KHUNG',
                            style: GoogleFonts.cinzel(
                              color: AppTheme.goldBright,
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            isFace
                                ? 'Chụp thẳng góc, đủ ánh sáng, rõ trán và cằm'
                                : 'Mở phẳng bàn tay, rõ các nếp nhăn và chỉ tay',
                            style: const TextStyle(
                              color: AppTheme.mysticalTextSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
            ),

            // HUD Scanner Overlay (Corner Brackets & Crosshair)
            Positioned.fill(
              child: CustomPaint(
                painter: _HudScannerPainter(isFace: isFace),
              ),
            ),

            // Laser Scan Beam Animation
            AnimatedBuilder(
              animation: _scanAnimation,
              builder: (context, child) {
                return Positioned(
                  top: _scanAnimation.value * 300,
                  left: 20,
                  right: 20,
                  child: Container(
                    height: 3,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppTheme.goldBright.withValues(alpha: 0.0),
                          AppTheme.goldBright,
                          Colors.white,
                          AppTheme.goldBright,
                          AppTheme.goldBright.withValues(alpha: 0.0),
                        ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.goldBright.withValues(alpha: 0.8),
                          blurRadius: 10,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            // HUD Badges
            Positioned(
              top: 16,
              left: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.4)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.radar, color: AppTheme.goldBright, size: 14),
                    const SizedBox(width: 6),
                    Text(
                      isFace ? 'TAM ĐÌNH • NGŨ NHẠC' : 'TÂM ĐẠO • TRÍ ĐẠO • SINH ĐẠO',
                      style: GoogleFonts.cinzel(
                        color: AppTheme.goldBright,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePickActions(bool isLoading) {
    if (_selectedImage != null) {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              icon: const Icon(Icons.camera_alt, color: AppTheme.goldBright, size: 18),
              label: Text('CHỤP LẠI', style: GoogleFonts.cinzel(fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.goldBright,
                side: const BorderSide(color: AppTheme.mysticalGold),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: isLoading ? null : () => _pickImage(ImageSource.camera),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: OutlinedButton.icon(
              icon: const Icon(Icons.photo_library, color: AppTheme.goldBright, size: 18),
              label: Text('CHỌN LẠI', style: GoogleFonts.cinzel(fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.goldBright,
                side: const BorderSide(color: AppTheme.mysticalGold),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: isLoading ? null : () => _pickImage(ImageSource.gallery),
            ),
          ),
        ],
      );
    }

    return Row(
      children: [
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: CelestialGradients.imperialGold,
              boxShadow: CelestialShadows.goldGlow,
            ),
            child: ElevatedButton.icon(
              icon: const Icon(Icons.camera_alt, color: Color(0xFF141026)),
              label: Text(
                'MỞ CAMERA',
                style: GoogleFonts.cinzel(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF141026),
                  letterSpacing: 0.8,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                foregroundColor: const Color(0xFF141026),
                shadowColor: Colors.transparent,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onPressed: isLoading ? null : () => _pickImage(ImageSource.camera),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: OutlinedButton.icon(
            icon: const Icon(Icons.photo_library, color: AppTheme.goldBright),
            label: Text(
              'THƯ VIỆN',
              style: GoogleFonts.cinzel(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
              ),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.goldBright,
              side: const BorderSide(color: AppTheme.goldBright, width: 1.5),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            onPressed: isLoading ? null : () => _pickImage(ImageSource.gallery),
          ),
        ),
      ],
    );
  }

  Widget _buildAnalyzeButton(bool isLoading, bool isPro) {
    final hasImage = _selectedImage != null;

    return Container(
      width: double.infinity,
      height: 56,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: hasImage ? CelestialGradients.imperialGold : null,
        color: hasImage ? null : AppTheme.cosmosElevated,
        boxShadow: hasImage ? CelestialShadows.goldGlow : null,
      ),
      child: ElevatedButton(
        onPressed: (!hasImage || isLoading) ? null : _analyze,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: const Color(0xFF141026),
          disabledBackgroundColor: Colors.transparent,
          disabledForegroundColor: Colors.white24,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        ),
        child: isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: Color(0xFF141026),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.auto_awesome,
                    color: hasImage ? const Color(0xFF141026) : Colors.white24,
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    isPro ? 'BẮT ĐẦU GIẢI MÃ AI (VIP PRO)' : 'BẮT ĐẦU GIẢI MÃ AI (10 XU)',
                    style: GoogleFonts.cinzel(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      color: hasImage ? const Color(0xFF141026) : Colors.white24,
                      letterSpacing: 1.0,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

/// Painter vẽ HUD Scanner: 4 góc viền vàng, tâm ngắm và thước tỷ lệ
class _HudScannerPainter extends CustomPainter {
  final bool isFace;

  _HudScannerPainter({required this.isFace});

  @override
  void paint(Canvas canvas, Size size) {
    final bracketPaint = Paint()
      ..color = AppTheme.goldBright
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;

    final guidePaint = Paint()
      ..color = AppTheme.goldBright.withValues(alpha: 0.3)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    const cornerLength = 24.0;
    const margin = 16.0;

    // Top-Left
    canvas.drawLine(const Offset(margin, margin), const Offset(margin + cornerLength, margin), bracketPaint);
    canvas.drawLine(const Offset(margin, margin), const Offset(margin, margin + cornerLength), bracketPaint);

    // Top-Right
    canvas.drawLine(Offset(size.width - margin, margin), Offset(size.width - margin - cornerLength, margin), bracketPaint);
    canvas.drawLine(Offset(size.width - margin, margin), Offset(size.width - margin, margin + cornerLength), bracketPaint);

    // Bottom-Left
    canvas.drawLine(Offset(margin, size.height - margin), Offset(margin + cornerLength, size.height - margin), bracketPaint);
    canvas.drawLine(Offset(margin, size.height - margin), Offset(margin, size.height - margin - cornerLength), bracketPaint);

    // Bottom-Right
    canvas.drawLine(Offset(size.width - margin, size.height - margin), Offset(size.width - margin - cornerLength, size.height - margin), bracketPaint);
    canvas.drawLine(Offset(size.width - margin, size.height - margin), Offset(size.width - margin, size.height - margin - cornerLength), bracketPaint);

    // Central Guidelines
    if (isFace) {
      // 3 horizontal zones: Thượng Đình (1/3), Trung Đình (2/3)
      final h1 = size.height * 0.33;
      final h2 = size.height * 0.66;
      canvas.drawLine(Offset(margin + 20, h1), Offset(size.width - margin - 20, h1), guidePaint);
      canvas.drawLine(Offset(margin + 20, h2), Offset(size.width - margin - 20, h2), guidePaint);

      // Vertical symmetry axis
      canvas.drawLine(Offset(size.width / 2, margin + 20), Offset(size.width / 2, size.height - margin - 20), guidePaint);
    } else {
      // Palm Oval Target
      final rect = Rect.fromCenter(
        center: Offset(size.width / 2, size.height / 2),
        width: size.width * 0.65,
        height: size.height * 0.75,
      );
      canvas.drawOval(rect, guidePaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
