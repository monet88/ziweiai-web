import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/iching_provider.dart';
import '../data/models/iching_models.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/presentation/widgets/voice_audio_player_bar.dart';
import '../../../../ui/animated_background.dart';
import '../../../../ui/glass_panel.dart';

/// Royal Celestial I Ching 3D Screen (Lục Hào Chiêm Bốc Hoàng Gia)
/// Meets Stitch MCP Screen ID: d028a9a3 specification
/// Features 3 Ancient Kangxi Coins with 3D flip physics, 6-line Hexagram Stupa,
/// Auspicious/Inauspicious Mutagens, and Imperial Commentary.
class IChingScreen extends ConsumerStatefulWidget {
  const IChingScreen({super.key});

  @override
  ConsumerState<IChingScreen> createState() => _IChingScreenState();
}

class _IChingScreenState extends ConsumerState<IChingScreen>
    with TickerProviderStateMixin {
  final _questionController = TextEditingController();
  late AnimationController _shakeController;
  late AnimationController _flipController;

  final List<int> _castArray = [];
  final List<List<int>> _coinHistory = []; // Track individual 3 coins [c1, c2, c3]
  bool _isTossing = false;
  final Random _random = Random();

  List<int> _currentCoins = [3, 3, 2]; // Default display coins

  @override
  void initState() {
    super.initState();
    _shakeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _flipController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
  }

  @override
  void dispose() {
    _questionController.dispose();
    _shakeController.dispose();
    _flipController.dispose();
    super.dispose();
  }

  void _tossCoins() async {
    if (_questionController.text.trim().isEmpty) {
      _questionController.text = 'Công việc / kinh doanh tháng này có hanh thông, đại cát không?';
    }

    if (_castArray.length >= 6 || _isTossing) return;

    FocusScope.of(context).unfocus();
    HapticFeedback.heavyImpact();

    setState(() {
      _isTossing = true;
    });

    // Start 3D coin flip and plate shake
    _shakeController.forward(from: 0.0);
    _flipController.forward(from: 0.0);

    // Simulate coin spinning & settling
    await Future.delayed(const Duration(milliseconds: 900));

    if (!mounted) return;

    // 3 Kangxi Coins: heads(Ngửa) = 3, tails(Sấp) = 2
    final coin1 = _random.nextBool() ? 3 : 2;
    final coin2 = _random.nextBool() ? 3 : 2;
    final coin3 = _random.nextBool() ? 3 : 2;
    final total = coin1 + coin2 + coin3; // 6 (Lão Âm), 7 (Thiếu Dương), 8 (Thiếu Âm), 9 (Lão Dương)

    HapticFeedback.vibrate();

    setState(() {
      _currentCoins = [coin1, coin2, coin3];
      _coinHistory.add([coin1, coin2, coin3]);
      _castArray.add(total);
      _isTossing = false;
    });

    if (_castArray.length == 6) {
      // 6 Lines complete, dispatch to backend
      ref.read(ichingNotifierProvider.notifier).draw(_questionController.text, _castArray);
    }
  }

  void _reset() {
    HapticFeedback.mediumImpact();
    _questionController.clear();
    setState(() {
      _castArray.clear();
      _coinHistory.clear();
      _isTossing = false;
      _currentCoins = [3, 3, 2];
    });
    ref.read(ichingNotifierProvider.notifier).reset();
  }

  String _getLineLabel(int value) {
    switch (value) {
      case 6:
        return 'Lão Âm (Biến Dương)';
      case 7:
        return 'Thiếu Dương (Bất Biến)';
      case 8:
        return 'Thiếu Âm (Bất Biến)';
      case 9:
        return 'Lão Dương (Biến Âm)';
      default:
        return '';
    }
  }

  String _getHaoPositionName(int index) {
    switch (index) {
      case 0:
        return 'Sơ Hào (Dưới cùng)';
      case 1:
        return 'Nhị Hào';
      case 2:
        return 'Tam Hào';
      case 3:
        return 'Tứ Hào';
      case 4:
        return 'Ngũ Hào (Quân Vị)';
      case 5:
        return 'Thượng Hào (Trên cùng)';
      default:
        return 'Hào ${index + 1}';
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ichingNotifierProvider);

    ref.listen(ichingNotifierProvider, (previous, next) {
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
          'Lục Hào Chiêm Bốc 3D',
          style: GoogleFonts.cinzel(
            fontWeight: FontWeight.w800,
            color: AppTheme.goldBright,
            letterSpacing: 1.5,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.goldBright),
            onPressed: _reset,
            tooltip: 'Thiết lập lại',
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
                // Section 1: Question Input (Hidden once casting starts)
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 350),
                  child: hasResult || _castArray.isNotEmpty
                      ? _buildQuestionCompactBadge()
                      : _buildInputSection(),
                ),

                const SizedBox(height: 18),

                // Section 2: Hexagram Line Stupa (Shown during or after casting)
                if (_castArray.isNotEmpty) ...[
                  _buildHexagramStupa(hasResult),
                  const SizedBox(height: 20),
                ],

                // Section 3: 3D Royal Coin Plate & Casting Interaction
                if (!hasResult) ...[
                  _buildCoinCastingPlate(state.isLoading),
                  const SizedBox(height: 20),
                ],

                // Section 4: Result Hexagrams & Imperial Narrative
                if (hasResult) ...[
                  _buildHexagramResult(state.value!),
                  const SizedBox(height: 22),
                  _buildResultNarrative(state.value!.narrative),
                ],
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: const VoiceAudioPlayerBar(),
    );
  }

  Widget _buildQuestionCompactBadge() {
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
              gradient: CelestialGradients.imperialGold,
              boxShadow: CelestialShadows.goldGlow,
            ),
            child: const Icon(Icons.help_outline, size: 16, color: Color(0xFF141026)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'SỰ VIỆC CẦN CHIÊM BỐC',
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
                      : 'Công việc / kinh doanh tháng này có thuận lợi không?',
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
            tooltip: 'Đổi câu hỏi',
          ),
        ],
      ),
    );
  }

  Widget _buildInputSection() {
    final quickQuestions = [
      '💼 Công việc tháng này có hanh thông, thăng tiến?',
      '💰 Tài lộc kinh doanh có đón vận may đắc lợi?',
      '❤️ Chuyện tình cảm, hôn nhân có hòa hợp như ý?',
      '🌱 Sức khỏe gia đạo năm 2026 có bình an cát tường?',
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
                  gradient: CelestialGradients.cinnabarImperial,
                ),
                child: const Icon(Icons.auto_awesome, size: 18, color: AppTheme.goldBright),
              ),
              const SizedBox(width: 10),
              Text(
                'THÀNH TÂM KHỞI QUẺ',
                style: GoogleFonts.cinzel(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.goldBright,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            'Tĩnh tâm niệm sự việc cần hỏi, sau đó gieo 3 đồng tiền cổ Khang Hy đúng 6 lần để cấu thành Lục Hào Tiên Thiên.',
            style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 13, height: 1.45),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _questionController,
            maxLines: 2,
            style: const TextStyle(color: AppTheme.mysticalText, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Nhập tâm niệm hoặc câu hỏi của thân chủ...',
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
            children: quickQuestions.map((q) {
              return ActionChip(
                backgroundColor: AppTheme.cosmosElevated.withValues(alpha: 0.7),
                side: BorderSide(color: AppTheme.mysticalGold.withValues(alpha: 0.3)),
                label: Text(
                  q,
                  style: const TextStyle(
                    color: AppTheme.goldBright,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                onPressed: () {
                  HapticFeedback.lightImpact();
                  setState(() {
                    _questionController.text = q.substring(q.indexOf(' ') + 1);
                  });
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildHexagramStupa(bool hasResult) {
    return GlassPanel(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      borderGradient: CelestialGradients.goldBorder,
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                hasResult ? 'ĐÀI LỤC HÀO THÀNH QUẺ' : 'TIẾN TRÌNH KHỞI HÀO (${_castArray.length}/6)',
                style: GoogleFonts.cinzel(
                  color: AppTheme.goldBright,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                  letterSpacing: 1.0,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  color: AppTheme.cosmosElevated,
                  border: Border.all(color: AppTheme.glassBorderGold, width: 0.8),
                ),
                child: Text(
                  '${_castArray.length}/6 Hào',
                  style: const TextStyle(
                    color: AppTheme.goldBright,
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Draw lines from bottom to top (5 is top, 0 is bottom)
          ...List.generate(6, (index) {
            final lineIndex = 5 - index;
            final isCurrent = lineIndex == _castArray.length - 1;

            if (lineIndex < _castArray.length) {
              final val = _castArray[lineIndex];
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4.0),
                child: Row(
                  children: [
                    SizedBox(
                      width: 90,
                      child: Text(
                        _getHaoPositionName(lineIndex),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: isCurrent ? FontWeight.w800 : FontWeight.w600,
                          color: isCurrent ? AppTheme.goldBright : AppTheme.mysticalTextSecondary,
                        ),
                      ),
                    ),
                    Expanded(child: Center(child: _buildSingleLine(val))),
                    SizedBox(
                      width: 120,
                      child: Text(
                        _getLineLabel(val),
                        textAlign: TextAlign.end,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: (val == 6 || val == 9)
                              ? AppTheme.cinnabarLight
                              : AppTheme.mysticalGold,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            } else {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4.0),
                child: Row(
                  children: [
                    SizedBox(
                      width: 90,
                      child: Text(
                        _getHaoPositionName(lineIndex),
                        style: const TextStyle(
                          fontSize: 11,
                          color: Colors.white24,
                        ),
                      ),
                    ),
                    Expanded(child: Center(child: _buildEmptyLine())),
                    const SizedBox(width: 120),
                  ],
                ),
              );
            }
          }),
        ],
      ),
    );
  }

  Widget _buildEmptyLine() {
    return Container(
      width: 110,
      height: 10,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(5),
      ),
    );
  }

  Widget _buildCoinCastingPlate(bool isLoading) {
    final tossCount = _castArray.length;
    final isDone = tossCount >= 6;

    return Column(
      children: [
        // 3D Ancient Coin Plate
        AnimatedBuilder(
          animation: _shakeController,
          builder: (context, child) {
            final sine = sin(_shakeController.value * 5 * pi);
            final shakeOffset = _isTossing ? sine * 12 : 0.0;
            return Transform.translate(
              offset: Offset(shakeOffset, 0),
              child: child,
            );
          },
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const RadialGradient(
                center: Alignment.center,
                radius: 0.95,
                colors: [
                  Color(0xFF330C18), // Deep velvet cinnabar
                  Color(0xFF1E0710),
                  Color(0xFF0C0307),
                ],
              ),
              border: Border.all(color: AppTheme.goldBright, width: 2),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.goldBright.withValues(alpha: 0.3),
                  blurRadius: 32,
                  spreadRadius: 2,
                ),
                BoxShadow(
                  color: AppTheme.cinnabarCrimson.withValues(alpha: 0.4),
                  blurRadius: 20,
                  spreadRadius: -4,
                ),
              ],
            ),
            child: SizedBox(
              width: 220,
              height: 220,
              child: Center(
                child: (isLoading || (_isTossing && tossCount == 5))
                    ? Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const CircularProgressIndicator(color: AppTheme.goldBright),
                          const SizedBox(height: 14),
                          Text(
                            'Khâm Thiên Giám\nĐang Khởi Quẻ...',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.cinzel(
                              color: AppTheme.goldBright,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _build3DKangxiCoin(_currentCoins[0], 0),
                          const SizedBox(width: 10),
                          _build3DKangxiCoin(_currentCoins[1], 1),
                          const SizedBox(width: 10),
                          _build3DKangxiCoin(_currentCoins[2], 2),
                        ],
                      ),
              ),
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Last coin toss outcome label
        if (_coinHistory.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: AppTheme.cosmosElevated.withValues(alpha: 0.8),
              border: Border.all(color: AppTheme.mysticalGold.withValues(alpha: 0.4), width: 0.8),
            ),
            child: Text(
              'Lần ${_coinHistory.length}: '
              '${_currentCoins[0] == 3 ? "Ngửa" : "Sấp"} · '
              '${_currentCoins[1] == 3 ? "Ngửa" : "Sấp"} · '
              '${_currentCoins[2] == 3 ? "Ngửa" : "Sấp"} '
              '= ${_castArray.last} (${_getLineLabel(_castArray.last)})',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppTheme.goldBright,
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Giant Ergonomic Cast Button (>= 48dp Touch Target)
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              padding: EdgeInsets.zero,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 6,
              shadowColor: AppTheme.goldBright.withValues(alpha: 0.5),
            ),
            onPressed: (!_isTossing && !isLoading && !isDone) ? _tossCoins : null,
            child: Ink(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: CelestialGradients.imperialGold,
              ),
              child: Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.monetization_on_outlined, color: Color(0xFF141026), size: 22),
                    const SizedBox(width: 10),
                    Text(
                      isDone
                          ? 'ĐÃ HOÀN THÀNH 6 HÀO'
                          : 'GIEO HÀO ${tossCount + 1}/6 (CHẠM ĐỂ GIEO)',
                      style: GoogleFonts.cinzel(
                        color: const Color(0xFF141026),
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
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

  Widget _build3DKangxiCoin(int value, int index) {
    // 3 = Heads (Ngửa - Khang Hy Thông Bảo), 2 = Tails (Sấp - Họa tiết cổ phong)
    final isHeads = value == 3;

    return AnimatedBuilder(
      animation: _flipController,
      builder: (context, child) {
        // Multi-axis rotation flip
        final angle = _isTossing
            ? _flipController.value * pi * 4 + (index * 0.4)
            : 0.0;

        return Transform(
          transform: Matrix4.identity()
            ..setEntry(3, 2, 0.002) // Perspective 3D
            ..rotateY(angle),
          alignment: Alignment.center,
          child: Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const RadialGradient(
                colors: [
                  Color(0xFFFFE082), // Brilliant gold
                  Color(0xFFD4AF37),
                  Color(0xFF8C6D1F), // Antique bronze rim
                ],
              ),
              border: Border.all(color: const Color(0xFFFFF8E1), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.6),
                  blurRadius: 8,
                  offset: const Offset(2, 4),
                ),
              ],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Inner concentric gold ring
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF705214), width: 1),
                  ),
                ),

                // Square hole of ancient Chinese coin
                Container(
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A0E08),
                    borderRadius: BorderRadius.circular(2),
                    border: Border.all(color: const Color(0xFFFFECB3), width: 1),
                  ),
                ),

                // Kangxi / Dragon markings
                if (isHeads) ...[
                  const Positioned(top: 4, child: Text('康', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFF3E2723)))),
                  const Positioned(bottom: 4, child: Text('熙', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFF3E2723)))),
                  const Positioned(left: 4, child: Text('通', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFF3E2723)))),
                  const Positioned(right: 4, child: Text('寶', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFF3E2723)))),
                ] else ...[
                  const Positioned(top: 5, child: Icon(Icons.shield, size: 8, color: Color(0xFF3E2723))),
                  const Positioned(bottom: 5, child: Icon(Icons.shield, size: 8, color: Color(0xFF3E2723))),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildHexagramResult(IChingDraw result) {
    return GlassPanel(
      padding: const EdgeInsets.all(20),
      borderGradient: CelestialGradients.goldBorder,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              gradient: CelestialGradients.imperialGold,
              boxShadow: CelestialShadows.goldGlow,
            ),
            child: const Text(
              'KẾT QUẢ KHỞI THÀNH QUẺ KINH DỊCH',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 12,
                color: Color(0xFF141026),
                letterSpacing: 1.0,
              ),
            ),
          ),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(child: _buildHexagramCard(result.baseHexagram, 'QUẺ CHỦ (TIÊN THIÊN)', isBase: true)),
              if (result.changedHexagram != null) ...[
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppTheme.cosmosElevated,
                    border: Border.all(color: AppTheme.mysticalGold, width: 1),
                  ),
                  child: const Icon(Icons.sync_alt_rounded, color: AppTheme.goldBright, size: 22),
                ),
                Expanded(child: _buildHexagramCard(result.changedHexagram!, 'QUẺ BIẾN (HẬU THIÊN)', isBase: false)),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHexagramCard(IChingHexagram hexagram, String title, {required bool isBase}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: AppTheme.cosmosElevated.withValues(alpha: 0.6),
        border: Border.all(
          color: isBase ? AppTheme.goldBright.withValues(alpha: 0.5) : AppTheme.etherealJade.withValues(alpha: 0.5),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Text(
            title,
            style: TextStyle(
              color: isBase ? AppTheme.goldBright : AppTheme.etherealJade,
              fontWeight: FontWeight.w800,
              fontSize: 11,
              letterSpacing: 0.8,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            hexagram.name,
            style: GoogleFonts.cinzel(
              color: AppTheme.goldBright,
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          ...hexagram.lines.reversed.map((line) => _buildSingleLine(line)),
        ],
      ),
    );
  }

  Widget _buildSingleLine(int lineValue) {
    // 6, 8: Âm (Đứt)
    // 7, 9: Dương (Liền)
    final isYang = lineValue == 7 || lineValue == 9;
    final isChanging = lineValue == 6 || lineValue == 9;

    final lineColor = isChanging
        ? AppTheme.cinnabarLight
        : (isYang ? AppTheme.goldBright : AppTheme.etherealJade);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3.5),
      child: isYang
          ? Container(
              width: 100,
              height: 10,
              decoration: BoxDecoration(
                color: lineColor,
                borderRadius: BorderRadius.circular(4),
                boxShadow: [
                  BoxShadow(
                    color: lineColor.withValues(alpha: 0.4),
                    blurRadius: 6,
                  ),
                ],
              ),
            )
          : Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 45,
                  height: 10,
                  decoration: BoxDecoration(
                    color: lineColor,
                    borderRadius: BorderRadius.circular(4),
                    boxShadow: [
                      BoxShadow(
                        color: lineColor.withValues(alpha: 0.4),
                        blurRadius: 6,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  width: 45,
                  height: 10,
                  decoration: BoxDecoration(
                    color: lineColor,
                    borderRadius: BorderRadius.circular(4),
                    boxShadow: [
                      BoxShadow(
                        color: lineColor.withValues(alpha: 0.4),
                        blurRadius: 6,
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildResultNarrative(String narrative) {
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
                  gradient: CelestialGradients.imperialGold,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: CelestialShadows.goldGlow,
                ),
                child: const Icon(Icons.auto_stories, color: Color(0xFF141026), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'KHÂM THIÊN GIÁM LUẬN QUẺ',
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
                title: 'Lời Bàn Quẻ Kinh Dịch',
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
}
