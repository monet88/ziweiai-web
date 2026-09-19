import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/stick_provider.dart';
import '../data/models/stick_models.dart';
import 'widgets/royal_sacred_stick_share_card.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/services/ritual_audio_service.dart';
import '../../../../core/presentation/widgets/ceremony_audio_toggle.dart';
import '../../../../core/presentation/widgets/voice_audio_player_bar.dart';
import '../../../../ui/animated_background.dart';
import '../../../../ui/glass_panel.dart';

/// Royal Celestial Kwan Tai Fortune Sticks Screen (Linh Xăm Quan Thánh Đế Quân 3D)
/// Meets Stitch MCP Screen ID: 587ad2cf specification
/// Features 3D Bamboo Stick Cylinder, Yin-Yang Moon Blocks (Thoại Bôi),
/// Classical Four-Line Poem, 7-Domain Fortune Interpretation, and Imperial Audio TTS.
class StickScreen extends ConsumerStatefulWidget {
  const StickScreen({super.key});

  @override
  ConsumerState<StickScreen> createState() => _StickScreenState();
}

class _StickScreenState extends ConsumerState<StickScreen>
    with TickerProviderStateMixin {
  final _questionController = TextEditingController();
  late AnimationController _shakeController;
  late AnimationController _stickFallController;

  bool _isShaking = false;
  bool _blocksThrown = false;

  @override
  void initState() {
    super.initState();
    _shakeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _stickFallController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
  }

  @override
  void dispose() {
    _questionController.dispose();
    _shakeController.dispose();
    _stickFallController.dispose();
    super.dispose();
  }

  void _shakeAndDraw() async {
    if (_questionController.text.trim().isEmpty) {
      _questionController.text = 'Cầu gia đạo bình an, công việc kinh doanh năm nay đắc tài đắc lộc?';
    }

    if (_isShaking) return;

    FocusScope.of(context).unfocus();
    HapticFeedback.heavyImpact();

    // Phát âm thanh nghi lễ xóc ống thẻ xăm tre Quan Thánh
    ref.read(ritualAudioNotifierProvider.notifier).playStickShake();

    setState(() {
      _isShaking = true;
      _blocksThrown = false;
    });

    // Start 3D cylinder shaking animation
    _shakeController.forward(from: 0.0);

    // Vibration rhythm while shaking
    await Future.delayed(const Duration(milliseconds: 400));
    HapticFeedback.mediumImpact();
    await Future.delayed(const Duration(milliseconds: 400));
    HapticFeedback.heavyImpact();
    await Future.delayed(const Duration(milliseconds: 600));

    if (!mounted) return;

    // Stick emerges and falls, Moon blocks cast (1 Flat, 1 Curved = Divine Assent)
    _stickFallController.forward(from: 0.0);
    // Phát âm thanh chuông đồng Khâm Thiên Giám ngân nga chứng giám quẻ thẻ
    ref.read(ritualAudioNotifierProvider.notifier).playSingingBowl();

    setState(() {
      _blocksThrown = true;
      _isShaking = false;
    });

    HapticFeedback.vibrate();

    // Call backend API
    ref.read(stickNotifierProvider.notifier).draw(_questionController.text);
  }

  void _reset() {
    HapticFeedback.mediumImpact();
    _questionController.clear();
    setState(() {
      _isShaking = false;
      _blocksThrown = false;
    });
    _shakeController.reset();
    _stickFallController.reset();
    ref.read(stickNotifierProvider.notifier).reset();
  }

  Color _getLevelColor(String level) {
    if (level.contains('Thượng thượng') || level.contains('Đại Cát')) {
      return AppTheme.etherealJade;
    } else if (level.contains('Thượng')) {
      return AppTheme.goldBright;
    } else if (level.contains('Trung')) {
      return AppTheme.nebulaCyan;
    } else {
      return AppTheme.cinnabarLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(stickNotifierProvider);

    ref.listen(stickNotifierProvider, (previous, next) {
      if (next.hasError) {
        final error = next.error;
        if (error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(error.toString()),
              backgroundColor: AppTheme.cinnabarCrimson,
            ),
          );
        }
      }
    });

    final hasResult = state.hasValue && state.value != null;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text(
          'Linh Xăm Quan Thánh 3D',
          style: GoogleFonts.cinzel(
            fontWeight: FontWeight.w800,
            color: AppTheme.goldBright,
            letterSpacing: 1.5,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          const CeremonyAudioToggle(),
          if (hasResult)
            IconButton(
              icon: const Icon(Icons.share_outlined, color: AppTheme.goldBright),
              onPressed: () {
                HapticFeedback.mediumImpact();
                RoyalSacredStickPreviewDialog.show(context, data: state.value!);
              },
              tooltip: 'Chia sẻ thiệp hoàng triều',
            ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.goldBright),
            onPressed: _reset,
            tooltip: 'Gieo xăm lại',
          ),
        ],
      ),
      body: AnimatedBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 110.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Question Badge or Setup
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 350),
                  child: hasResult || _isShaking || _blocksThrown
                      ? _buildCompactQuestionHeader()
                      : _buildQuestionInputSection(),
                ),

                const SizedBox(height: 18),

                // 3D Bamboo Cylinder & Moon Blocks altar
                if (!hasResult) ...[
                  _buildBambooCylinderAltar(state.isLoading),
                  const SizedBox(height: 20),
                ],

                // Result Fortune Stick & Imperial Narrative
                if (hasResult) ...[
                  _buildStickResultCard(state.value!),
                  const SizedBox(height: 22),
                  _buildImperialCommentary(state.value!.narrative),
                  const SizedBox(height: 20),
                  _buildRoyalShareButton(state.value!),
                ],
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: const VoiceAudioPlayerBar(),
    );
  }

  Widget _buildCompactQuestionHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: AppTheme.cosmosElevated.withValues(alpha: 0.7),
        border: Border.all(color: AppTheme.glassBorderGold, width: 0.8),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: CelestialGradients.cinnabarImperial,
              boxShadow: CelestialShadows.goldGlow,
            ),
            child: const Icon(Icons.temple_buddhist, size: 16, color: AppTheme.goldBright),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'TÂM NGUYỆN CẦU THÁNH ĐẾ',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.mysticalGold,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _questionController.text.trim().isNotEmpty
                      ? _questionController.text
                      : 'Cầu gia đạo bình an, công danh đắc tài đắc lộc?',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.mysticalText,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.edit_outlined, size: 18, color: AppTheme.goldBright),
            onPressed: _reset,
            tooltip: 'Đổi tâm nguyện',
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionInputSection() {
    final sampleWishes = [
      '🎋 Cầu sự nghiệp, quan vận hanh thông đại cát?',
      '💰 Cầu tài lộc, kinh doanh buôn bán thuận buồm?',
      '❤️ Cầu gia đạo bình an, duyên lành viên mãn?',
      '🌱 Cầu tật bệnh tiêu trừ, tai qua nạn khỏi?',
    ];

    return GlassPanel(
      padding: const EdgeInsets.all(20),
      borderGradient: CelestialGradients.goldBorder,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: CelestialGradients.imperialGold,
                  boxShadow: CelestialShadows.goldGlow,
                ),
                child: const Icon(Icons.local_fire_department, size: 18, color: Color(0xFF141026)),
              ),
              const SizedBox(width: 10),
              Text(
                'THÀNH TÂM KHẤN NGUYỆN',
                style: GoogleFonts.cinzel(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.goldBright,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            'Thân chủ rửa tay tĩnh tâm, dâng tâm nguyện lên Quan Thánh Đế Quân rồi lắc ống xăm để xin quẻ linh ứng.',
            style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 13, height: 1.45),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _questionController,
            maxLines: 2,
            style: const TextStyle(color: AppTheme.mysticalText, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Nhập tâm nguyện hoặc sự việc cần xin xăm...',
              hintStyle: const TextStyle(color: Colors.white30, fontSize: 13),
              filled: true,
              fillColor: AppTheme.cosmosElevated.withValues(alpha: 0.6),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: AppTheme.mysticalGold.withValues(alpha: 0.3), width: 1),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: AppTheme.mysticalGold.withValues(alpha: 0.25), width: 1),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppTheme.goldBright, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: sampleWishes.map((wish) {
              return ActionChip(
                backgroundColor: AppTheme.cosmosElevated.withValues(alpha: 0.7),
                side: BorderSide(color: AppTheme.mysticalGold.withValues(alpha: 0.3)),
                label: Text(
                  wish,
                  style: const TextStyle(
                    color: AppTheme.goldBright,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                onPressed: () {
                  HapticFeedback.lightImpact();
                  setState(() {
                    _questionController.text = wish.substring(wish.indexOf(' ') + 1);
                  });
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildBambooCylinderAltar(bool isLoading) {
    return Column(
      children: [
        // 3D Bamboo Cylinder & Dragon carvings
        AnimatedBuilder(
          animation: _shakeController,
          builder: (context, child) {
            final sine = sin(_shakeController.value * 6 * pi);
            final shakeAngle = _isShaking ? sine * 0.15 : 0.0;
            final shakeOffset = _isShaking ? sine * 14 : 0.0;

            return Transform.translate(
              offset: Offset(shakeOffset, 0),
              child: Transform.rotate(
                angle: shakeAngle,
                alignment: Alignment.bottomCenter,
                child: child,
              ),
            );
          },
          child: Container(
            width: 200,
            height: 260,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(28),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF5D1D0A), // Antique Lacquer Rosewood
                  Color(0xFF330C03),
                  Color(0xFF1A0501),
                ],
              ),
              border: Border.all(color: AppTheme.goldBright, width: 2),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.goldBright.withValues(alpha: 0.35),
                  blurRadius: 36,
                  spreadRadius: 2,
                ),
                BoxShadow(
                  color: AppTheme.cinnabarCrimson.withValues(alpha: 0.5),
                  blurRadius: 24,
                  spreadRadius: -4,
                ),
              ],
            ),
            child: Stack(
              alignment: Alignment.topCenter,
              children: [
                // Top Bamboo Sticks Fan-out (100 Sticks)
                Positioned(
                  top: 15,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: List.generate(7, (i) {
                      final stickHeight = 55.0 + (i == 3 ? 15.0 : (3 - i).abs() * -4.0);
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 2.5),
                        width: 8,
                        height: stickHeight,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(4),
                          color: const Color(0xFFD7A15C),
                          border: Border.all(color: const Color(0xFF8B5A2B), width: 0.8),
                          boxShadow: const [
                            BoxShadow(color: Colors.black45, blurRadius: 4),
                          ],
                        ),
                        child: Align(
                          alignment: Alignment.topCenter,
                          child: Container(
                            width: 6,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppTheme.cinnabarCrimson,
                              borderRadius: BorderRadius.vertical(top: Radius.circular(3)),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ),

                // Center Dragon Medallion
                Positioned(
                  top: 105,
                  child: Container(
                    width: 70,
                    height: 70,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: CelestialGradients.imperialGold,
                      boxShadow: CelestialShadows.goldGlow,
                    ),
                    child: const Center(
                      child: Text(
                        '關', // Chữ QUAN (Quan Thánh)
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF141026),
                          fontFamily: 'serif',
                        ),
                      ),
                    ),
                  ),
                ),

                // Bottom Ornamental Gold Trim
                Positioned(
                  bottom: 12,
                  child: Text(
                    '100 QUẺ THÁNH ĐẾ',
                    style: GoogleFonts.cinzel(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.goldBright,
                      letterSpacing: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 18),

        // Yin-Yang Moon Blocks (Thoại Bôi) Altar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: AppTheme.cosmosElevated.withValues(alpha: 0.75),
            border: Border.all(color: AppTheme.glassBorderGold, width: 0.8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildMoonBlock(isFlat: true), // Ngửa
              const SizedBox(width: 14),
              _buildMoonBlock(isFlat: false), // Sấp
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _blocksThrown ? 'CẶP KEO: 1 NGỬA 1 SẤP' : 'CẶP KEO ÂM DƯƠNG',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: _blocksThrown ? AppTheme.etherealJade : AppTheme.goldBright,
                      letterSpacing: 0.8,
                    ),
                  ),
                  Text(
                    _blocksThrown ? 'Thánh Đế Ứng Chuẩn · Đắc Quẻ' : 'Gieo để xác tín lời Thánh',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.mysticalTextSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Giant Ergonomic Shake Button (>= 48dp Touch Target)
        SizedBox(
          width: double.infinity,
          height: 54,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              padding: EdgeInsets.zero,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 6,
              shadowColor: AppTheme.goldBright.withValues(alpha: 0.5),
            ),
            onPressed: (!_isShaking && !isLoading) ? _shakeAndDraw : null,
            child: Ink(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: CelestialGradients.imperialGold,
              ),
              child: Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.vibration, color: Color(0xFF141026), size: 22),
                    const SizedBox(width: 10),
                    Text(
                      isLoading
                          ? 'ĐANG THỈNH QUẺ THÁNH...'
                          : '🎋 LẮC ĐIỆN THOẠI HOẶC CHẠM ĐỂ GIEO XĂM',
                      style: GoogleFonts.cinzel(
                        color: const Color(0xFF141026),
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMoonBlock({required bool isFlat}) {
    // Semi-lunar Crescent Wood Block (Thoại Bôi)
    return Container(
      width: 32,
      height: 22,
      decoration: BoxDecoration(
        color: isFlat ? const Color(0xFFC0392B) : const Color(0xFF78281F),
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(16),
          topRight: const Radius.circular(16),
          bottomLeft: Radius.circular(isFlat ? 2 : 12),
          bottomRight: Radius.circular(isFlat ? 2 : 12),
        ),
        border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.7), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.4),
            blurRadius: 4,
            offset: const Offset(1, 2),
          ),
        ],
      ),
      child: Center(
        child: Text(
          isFlat ? '陽' : '陰',
          style: const TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w900,
            color: AppTheme.goldBright,
          ),
        ),
      ),
    );
  }

  Widget _buildStickResultCard(StickDraw draw) {
    final stick = draw.stick;
    final levelColor = _getLevelColor(stick.level);

    return GlassPanel(
      padding: const EdgeInsets.all(20),
      borderGradient: CelestialGradients.goldBorder,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header: Stick ID & Level Badges
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  gradient: CelestialGradients.cinnabarImperial,
                  boxShadow: CelestialShadows.goldGlow,
                ),
                child: Text(
                  'THẺ SỐ ${stick.id}',
                  style: GoogleFonts.cinzel(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.goldBright,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  color: levelColor.withValues(alpha: 0.2),
                  border: Border.all(color: levelColor, width: 1),
                ),
                child: Text(
                  stick.level.toUpperCase(),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: levelColor,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Stick Title (Ví dụ: ĐÔNG PHA ĐỀ THI)
          Text(
            stick.title,
            textAlign: TextAlign.center,
            style: GoogleFonts.cinzel(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppTheme.goldBright,
              letterSpacing: 1.5,
            ),
          ),

          const SizedBox(height: 16),

          // Four-Line Classical Poem (Thơ Quẻ)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: AppTheme.cosmosElevated.withValues(alpha: 0.6),
              border: Border.all(color: AppTheme.glassBorderGold, width: 0.8),
            ),
            child: Column(
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.auto_stories, size: 16, color: AppTheme.goldBright),
                    SizedBox(width: 8),
                    Text(
                      'THI THÁNH ĐẾ BAN',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.goldBright,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  stick.poem,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14.5,
                    fontStyle: FontStyle.italic,
                    height: 1.6,
                    color: AppTheme.mysticalText,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Interpretation & Advice
          _buildDetailItem('Ý NGHĨA QUẺ', stick.interpretation, Icons.lightbulb_outline, AppTheme.goldBright),
          const SizedBox(height: 10),
          _buildDetailItem('LỜI KHUYÊN THÁNH ĐẾ', stick.advice, Icons.verified_user_outlined, AppTheme.etherealJade),

          // Historical Story (Điển Tích)
          if (stick.story != null && stick.story!.isNotEmpty) ...[
            const SizedBox(height: 10),
            _buildDetailItem('ĐIỂN TÍCH XƯA', stick.story!, Icons.history_edu, AppTheme.nebulaCyan),
          ],

          // Detailed 7-Domain Interpretations (detailedInterpretations)
          if (stick.detailedInterpretations != null && stick.detailedInterpretations!.isNotEmpty) ...[
            const SizedBox(height: 16),
            _build7DomainGrid(stick.detailedInterpretations!),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailItem(String title, String content, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: AppTheme.cosmosSurface.withValues(alpha: 0.5),
        border: Border.all(color: color.withValues(alpha: 0.35), width: 0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 6),
              Text(
                title,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: color,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            content,
            style: const TextStyle(
              fontSize: 13,
              color: AppTheme.mysticalText,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }

  Widget _build7DomainGrid(Map<String, dynamic> details) {
    final domainLabels = {
      'home': 'Gia Đạo',
      'career': 'Công Danh',
      'wealth': 'Cầu Tài',
      'marriage': 'Hôn Nhân',
      'health': 'Tật Bệnh',
      'travel': 'Xuất Hành',
      'lawsuit': 'Kiện Tụng',
      'business': 'Kinh Doanh',
    };

    final activeEntries = details.entries
        .where((e) => e.value != null && e.value.toString().isNotEmpty)
        .toList();

    if (activeEntries.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.grid_view_rounded, size: 14, color: AppTheme.goldBright),
            const SizedBox(width: 6),
            Text(
              'CHIÊM ĐOÁN CÁC PHƯƠNG DIỆN',
              style: GoogleFonts.cinzel(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: AppTheme.goldBright,
                letterSpacing: 1.0,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: activeEntries.map((e) {
            final label = domainLabels[e.key] ?? e.key;
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: AppTheme.cosmosElevated,
                border: Border.all(color: AppTheme.glassBorderGold, width: 0.8),
              ),
              child: RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: '$label: ',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.goldBright,
                      ),
                    ),
                    TextSpan(
                      text: e.value.toString(),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.mysticalText,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildImperialCommentary(String narrative) {
    return GlassPanel(
      padding: const EdgeInsets.all(22),
      borderGradient: CelestialGradients.goldBorder,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: CelestialGradients.cinnabarImperial,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: CelestialShadows.goldGlow,
                ),
                child: const Icon(Icons.history_edu, color: AppTheme.goldBright, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'KHÂM THIÊN GIÁM NGỰ PHÊ',
                  style: GoogleFonts.cinzel(
                    color: AppTheme.goldBright,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
              VoicePlayIconButton(
                text: narrative,
                title: 'Lời Bình Linh Xăm Quan Thánh',
              ),
            ],
          ),
          const SizedBox(height: 18),
          MarkdownBody(
            data: narrative,
            styleSheet: MarkdownStyleSheet(
              p: const TextStyle(
                color: AppTheme.mysticalText,
                fontSize: 14.5,
                height: 1.6,
                letterSpacing: 0.2,
              ),
              h1: GoogleFonts.cinzel(color: AppTheme.goldBright, fontSize: 19, fontWeight: FontWeight.bold),
              h2: GoogleFonts.cinzel(color: AppTheme.goldBright, fontSize: 17, fontWeight: FontWeight.bold),
              h3: const TextStyle(color: AppTheme.goldBright, fontSize: 15, fontWeight: FontWeight.bold),
              listBullet: const TextStyle(color: AppTheme.goldBright),
              strong: const TextStyle(color: AppTheme.goldBright, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoyalShareButton(StickDraw resultData) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: CelestialGradients.imperialGold,
        boxShadow: CelestialShadows.goldGlow,
      ),
      child: ElevatedButton.icon(
        onPressed: () {
          HapticFeedback.mediumImpact();
          RoyalSacredStickPreviewDialog.show(context, data: resultData);
        },
        icon: const Icon(Icons.auto_awesome, color: Color(0xFF140D26), size: 18),
        label: Text(
          'XUẤT THIỆP HOÀNG TRIỀU (CHIA SẺ)',
          style: GoogleFonts.cinzel(
            color: const Color(0xFF140D26),
            fontWeight: FontWeight.w900,
            fontSize: 13,
            letterSpacing: 1.0,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }
}
