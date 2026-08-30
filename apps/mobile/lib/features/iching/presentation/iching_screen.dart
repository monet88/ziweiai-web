import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/iching_provider.dart';
import '../data/models/iching_models.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../ui/animated_background.dart';
import '../../../../ui/glass_panel.dart';

class IChingScreen extends ConsumerStatefulWidget {
  const IChingScreen({super.key});

  @override
  ConsumerState<IChingScreen> createState() => _IChingScreenState();
}

class _IChingScreenState extends ConsumerState<IChingScreen> with SingleTickerProviderStateMixin {
  final _questionController = TextEditingController();
  late AnimationController _shakeController;
  
  final List<int> _castArray = [];
  bool _isTossing = false;
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    _shakeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
  }

  @override
  void dispose() {
    _questionController.dispose();
    _shakeController.dispose();
    super.dispose();
  }

  void _tossCoins() async {
    if (_questionController.text.trim().isEmpty) {
      _questionController.text = 'Công việc / kinh doanh tháng này có thuận lợi không?';
    }

    if (_castArray.length >= 6 || _isTossing) return;

    FocusScope.of(context).unfocus();
    HapticFeedback.mediumImpact();
    
    setState(() {
      _isTossing = true;
    });
    
    // Play shake animation
    _shakeController.forward(from: 0.0);
    
    // Simulate coin toss friction
    await Future.delayed(const Duration(milliseconds: 1200));
    
    if (!mounted) return;

    // 3 coins: heads(Ngửa) = 3, tails(Sấp) = 2
    int coin1 = _random.nextBool() ? 3 : 2;
    int coin2 = _random.nextBool() ? 3 : 2;
    int coin3 = _random.nextBool() ? 3 : 2;
    int total = coin1 + coin2 + coin3; // Will be 6, 7, 8, or 9
    
    HapticFeedback.heavyImpact();

    setState(() {
      _castArray.add(total);
      _isTossing = false;
    });

    if (_castArray.length == 6) {
      // All 6 lines drawn, send to backend
      ref.read(ichingNotifierProvider.notifier).draw(_questionController.text, _castArray);
    }
  }

  void _reset() {
    HapticFeedback.lightImpact();
    _questionController.clear();
    setState(() {
      _castArray.clear();
      _isTossing = false;
    });
    ref.read(ichingNotifierProvider.notifier).reset();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ichingNotifierProvider);

    ref.listen(ichingNotifierProvider, (previous, next) {
      if (next.hasError) {
        final error = next.error;
        if (error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error.toString())),
          );
        }
      }
    });

    final hasResult = state.hasValue && state.value != null;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text(
          'Gieo Quẻ Kinh Dịch',
          style: GoogleFonts.cinzel(
            fontWeight: FontWeight.w700,
            color: AppTheme.goldBright,
            letterSpacing: 1.2,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.goldBright),
            onPressed: _reset,
            tooltip: 'Gieo lại',
          ),
        ],
      ),
      body: AnimatedBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20.0, 16.0, 20.0, 40.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 400),
                  child: hasResult || _castArray.isNotEmpty
                      ? const SizedBox.shrink()
                      : _buildInputSection(),
                ),
                const SizedBox(height: 24),
                
                // Active Hexagram being drawn manually
                if (!hasResult && _castArray.isNotEmpty)
                  _buildManualHexagramBuilder(),

                if (!hasResult && _castArray.isNotEmpty)
                  const SizedBox(height: 24),

                // Shake and coin container
                if (!hasResult)
                  GestureDetector(
                    onTap: (!state.isLoading && !_isTossing && _castArray.length < 6) ? _tossCoins : null,
                    child: Center(
                      child: AnimatedBuilder(
                        animation: _shakeController,
                        builder: (context, child) {
                          final sineValue = sin(_shakeController.value * 4 * pi);
                          final offset = (_isTossing || state.isLoading) ? sineValue * 16 : 0.0;
                          return Transform.translate(
                            offset: Offset(offset, 0),
                            child: child,
                          );
                        },
                        child: _buildCoinCup(_isTossing, state.isLoading),
                      ),
                    ),
                  ),
                
                if (hasResult) 
                  _buildHexagramResult(state.value!),

                const SizedBox(height: 32),
                
                // Result Narrative
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 600),
                  child: hasResult
                      ? _buildResultNarrative(state.value!.narrative)
                      : const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInputSection() {
    final quickQuestions = [
      '💼 Công việc / kinh doanh tháng này có thuận lợi không?',
      '❤️ Chuyện tình duyên / gia đạo sắp tới ra sao?',
      '💰 Tài lộc & đầu tư có cơ hội khởi sắc không?',
      '🌱 Sức khỏe & bình an của bản thân và gia đình?',
    ];

    return GlassPanel(
      padding: const EdgeInsets.all(20),
      borderGradient: CelestialGradients.goldBorder,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Thiết Lập Câu Hỏi',
            style: GoogleFonts.cinzel(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppTheme.goldBright,
              letterSpacing: 1.2,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          const Text(
            'Thành tâm đặt câu hỏi hoặc chọn câu hỏi mẫu bên dưới, sau đó gieo 3 đồng xu cổ 6 lần để tạo lập Quẻ.',
            style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 14, height: 1.4),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _questionController,
            maxLines: 2,
            style: const TextStyle(color: AppTheme.mysticalText),
            decoration: InputDecoration(
              hintText: 'Nhập câu hỏi bạn đang băn khoăn...',
              hintStyle: const TextStyle(color: Colors.white30),
              filled: true,
              fillColor: AppTheme.cosmosElevated.withValues(alpha: 0.6),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: AppTheme.mysticalGold.withValues(alpha: 0.3), width: 1),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: AppTheme.mysticalGold.withValues(alpha: 0.2), width: 1),
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
                side: BorderSide(color: AppTheme.mysticalGold.withValues(alpha: 0.35)),
                label: Text(
                  q,
                  style: const TextStyle(
                    color: AppTheme.goldBright,
                    fontSize: 12,
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

  Widget _buildManualHexagramBuilder() {
    return GlassPanel(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      borderGradient: CelestialGradients.starlightBorder,
      child: Column(
        children: [
          Text(
            'Đang gieo quẻ... (${_castArray.length}/6 hào)',
            style: GoogleFonts.cinzel(
              color: AppTheme.goldBright,
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 16),
          // Draw lines from bottom to top (5 is top, 0 is bottom)
          ...List.generate(6, (index) {
            final lineIndex = 5 - index;
            if (lineIndex < _castArray.length) {
              return _buildSingleLine(_castArray[lineIndex]);
            } else {
              return _buildEmptyLine();
            }
          }),
        ],
      ),
    );
  }

  Widget _buildEmptyLine() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Container(
        width: 110,
        height: 10,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(5),
        ),
      ),
    );
  }

  Widget _buildCoinCup(bool isTossing, bool isLoading) {
    int tossCount = _castArray.length;
    String actionText = tossCount < 6 ? 'Gieo Hào (${tossCount + 1}/6)' : 'Đang Giải Quẻ...';

    return Container(
      width: 210,
      height: 210,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.8), width: 2),
        gradient: const RadialGradient(
          colors: [
            Color(0xFF8B1E3F),
            Color(0xFF3B0B1E),
            Color(0xFF14050D),
          ],
          stops: [0.0, 0.6, 1.0],
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.mysticalGold.withValues(alpha: 0.35),
            blurRadius: 36,
            spreadRadius: 2,
          ),
          BoxShadow(
            color: AppTheme.nebulaPurple.withValues(alpha: 0.25),
            blurRadius: 20,
            spreadRadius: -4,
          ),
        ],
      ),
      child: Center(
        child: (isTossing || isLoading)
            ? const CircularProgressIndicator(color: AppTheme.goldBright)
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: CelestialGradients.imperialGold,
                      boxShadow: CelestialShadows.goldGlow,
                    ),
                    child: const Icon(Icons.monetization_on, color: Color(0xFF141026), size: 40),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    actionText,
                    style: GoogleFonts.cinzel(
                      color: AppTheme.goldBright,
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                      letterSpacing: 1.2,
                    ),
                  ),
                  if (tossCount == 5) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.mysticalGold.withValues(alpha: 0.4), width: 0.8),
                      ),
                      child: const Text(
                        'Tốn 5 XU (Hào Cuối)',
                        style: TextStyle(
                          color: AppTheme.goldBright,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
      ),
    );
  }

  Widget _buildHexagramResult(IChingDraw result) {
    return GlassPanel(
      padding: const EdgeInsets.all(20),
      borderGradient: CelestialGradients.goldBorder,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(child: _buildHexagramLines(result.baseHexagram, 'Quẻ Chủ')),
          if (result.changedHexagram != null) 
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 8.0),
              child: Icon(Icons.arrow_forward_rounded, color: AppTheme.goldBright, size: 28),
            ),
          if (result.changedHexagram != null) 
            Expanded(child: _buildHexagramLines(result.changedHexagram!, 'Quẻ Biến')),
        ],
      ),
    );
  }

  Widget _buildHexagramLines(IChingHexagram hexagram, String title) {
    return Column(
      children: [
        Text(
          title,
          style: GoogleFonts.cinzel(
            color: AppTheme.goldBright,
            fontWeight: FontWeight.w800,
            fontSize: 16,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          hexagram.name,
          style: const TextStyle(
            color: AppTheme.mysticalText,
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 14),
        ...hexagram.lines.reversed.map((line) => _buildSingleLine(line)),
      ],
    );
  }

  Widget _buildSingleLine(int lineValue) {
    // 6, 8: Âm
    // 7, 9: Dương
    final isYang = lineValue == 7 || lineValue == 9;
    final isChanging = lineValue == 6 || lineValue == 9;

    final lineColor = isChanging ? const Color(0xFFFF5252) : AppTheme.goldBright;

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
                child: const Icon(Icons.menu_book, color: Color(0xFF141026), size: 22),
              ),
              const SizedBox(width: 14),
              Text(
                'Lời Bàn Quẻ Kinh Dịch',
                style: GoogleFonts.cinzel(
                  color: AppTheme.goldBright,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          MarkdownBody(
            data: narrative,
            styleSheet: MarkdownStyleSheet(
              p: const TextStyle(color: AppTheme.mysticalText, fontSize: 15, height: 1.6, letterSpacing: 0.2),
              h1: GoogleFonts.cinzel(color: AppTheme.goldBright, fontSize: 20, fontWeight: FontWeight.bold),
              h2: GoogleFonts.cinzel(color: AppTheme.goldBright, fontSize: 18, fontWeight: FontWeight.bold),
              h3: const TextStyle(color: AppTheme.goldBright, fontSize: 16, fontWeight: FontWeight.bold),
              listBullet: const TextStyle(color: AppTheme.goldBright),
              strong: const TextStyle(color: AppTheme.goldBright, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
