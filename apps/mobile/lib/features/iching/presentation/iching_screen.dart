import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../providers/iching_provider.dart';
import '../data/models/iching_models.dart';

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
      duration: const Duration(milliseconds: 1500),
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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập câu hỏi để gieo quẻ.')),
      );
      return;
    }

    if (_castArray.length >= 6 || _isTossing) return;

    FocusScope.of(context).unfocus();
    HapticFeedback.heavyImpact();
    
    setState(() {
      _isTossing = true;
    });
    
    // Play shake animation
    _shakeController.forward(from: 0.0);
    
    // Simulate coin toss friction
    await Future.delayed(const Duration(milliseconds: 1500));
    
    if (!mounted) return;

    // 3 coins: heads(Ngửa) = 3, tails(Sấp) = 2
    int coin1 = _random.nextBool() ? 3 : 2;
    int coin2 = _random.nextBool() ? 3 : 2;
    int coin3 = _random.nextBool() ? 3 : 2;
    int total = coin1 + coin2 + coin3; // Will be 6, 7, 8, or 9
    
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
        title: const Text('Gieo Quẻ Kinh Dịch', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _reset,
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF2C3E50), Color(0xFF000000)],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 400),
                  child: hasResult || _castArray.isNotEmpty
                      ? const SizedBox.shrink()
                      : _buildInputSection(),
                ),
                const SizedBox(height: 30),
                
                // Active Hexagram being drawn manually
                if (!hasResult && _castArray.isNotEmpty)
                  _buildManualHexagramBuilder(),

                if (!hasResult && _castArray.isNotEmpty)
                  const SizedBox(height: 30),

                // Shake and coin container
                if (!hasResult)
                  GestureDetector(
                    onTap: (!state.isLoading && !_isTossing && _castArray.length < 6) ? _tossCoins : null,
                    child: Center(
                      child: AnimatedBuilder(
                        animation: _shakeController,
                        builder: (context, child) {
                          final sineValue = sin(_shakeController.value * 4 * pi);
                          final offset = (_isTossing || state.isLoading) ? sineValue * 15 : 0.0;
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

                const SizedBox(height: 40),
                
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
    return Column(
      children: [
        const Text(
          'Thiết Lập Câu Hỏi',
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            letterSpacing: 1.2,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        Text(
          'Thành tâm đặt câu hỏi, sau đó gieo đồng xu 6 lần để tạo lập quẻ.',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 16),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        TextField(
          controller: _questionController,
          maxLines: 2,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Dự án này có thuận lợi không?',
            hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.05),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: const BorderSide(color: Colors.white24, width: 1),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: const BorderSide(color: Colors.white10, width: 1),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: const BorderSide(color: Color(0xFFD4AF37), width: 1),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildManualHexagramBuilder() {
    return Column(
      children: [
        const Text(
          'Đang gieo quẻ...',
          style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 18),
        ),
        const SizedBox(height: 16),
        // Draw lines from bottom to top, but visually top to bottom means reversing.
        // The array has index 0 as bottom. We want index 5 at top.
        // For UI, we pad the array up to 6 with empty, then reverse so top is first.
        ...List.generate(6, (index) {
          final lineIndex = 5 - index; // 5 is top, 0 is bottom
          if (lineIndex < _castArray.length) {
            return _buildSingleLine(_castArray[lineIndex]);
          } else {
            return _buildEmptyLine();
          }
        }),
      ],
    );
  }

  Widget _buildEmptyLine() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Container(
        width: 100,
        height: 12,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(4),
        ),
      ),
    );
  }

  Widget _buildCoinCup(bool isTossing, bool isLoading) {
    int tossCount = _castArray.length;
    String actionText = tossCount < 6 ? 'Gieo Hào (${tossCount + 1}/6)' : 'Đang Giải Quẻ...';

    return Container(
      width: 200,
      height: 200,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFD4AF37).withValues(alpha: 0.8), width: 2),
        gradient: const RadialGradient(
          colors: [Color(0xFF8B0000), Color(0xFF3E0000)],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFD4AF37).withValues(alpha: 0.2),
            blurRadius: 30,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Center(
        child: (isTossing || isLoading)
            ? const CircularProgressIndicator(color: Color(0xFFD4AF37))
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.monetization_on, color: Color(0xFFD4AF37), size: 56),
                  const SizedBox(height: 16),
                  Text(
                    actionText,
                    style: const TextStyle(
                      color: Color(0xFFD4AF37),
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      letterSpacing: 1.2,
                    ),
                  ),
                  if (tossCount == 5) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black45,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text(
                        'Tốn 5 XU (Hào Cuối)',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
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
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        _buildHexagramLines(result.baseHexagram, 'Quẻ Chủ'),
        if (result.changedHexagram != null) 
          const Icon(Icons.arrow_forward, color: Color(0xFFD4AF37), size: 32),
        if (result.changedHexagram != null) 
          _buildHexagramLines(result.changedHexagram!, 'Quẻ Biến'),
      ],
    );
  }

  Widget _buildHexagramLines(IChingHexagram hexagram, String title) {
    return Column(
      children: [
        Text(
          title,
          style: const TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 18),
        ),
        const SizedBox(height: 8),
        Text(
          hexagram.name,
          style: const TextStyle(color: Colors.white, fontSize: 16),
        ),
        const SizedBox(height: 16),
        ...hexagram.lines.reversed.map((line) => _buildSingleLine(line)),
      ],
    );
  }

  Widget _buildSingleLine(int lineValue) {
    // 6, 8: Âm
    // 7, 9: Dương
    final isYang = lineValue == 7 || lineValue == 9;
    final isChanging = lineValue == 6 || lineValue == 9;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: isYang 
        ? Container(
            width: 100,
            height: 12,
            decoration: BoxDecoration(
              color: isChanging ? Colors.red : Colors.white,
              borderRadius: BorderRadius.circular(4),
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 45,
                height: 12,
                decoration: BoxDecoration(
                  color: isChanging ? Colors.red : Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(width: 10),
              Container(
                width: 45,
                height: 12,
                decoration: BoxDecoration(
                  color: isChanging ? Colors.red : Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ],
          ),
    );
  }

  Widget _buildResultNarrative(String narrative) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white10),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFD4AF37).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.menu_book, color: Color(0xFFD4AF37), size: 24),
              ),
              const SizedBox(width: 16),
              const Text(
                'Lời Bàn',
                style: TextStyle(
                  color: Color(0xFFD4AF37),
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          MarkdownBody(
            data: narrative,
            styleSheet: MarkdownStyleSheet(
              p: const TextStyle(color: Colors.white, fontSize: 16, height: 1.6, letterSpacing: 0.3),
              h1: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
              h2: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.bold),
              h3: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
              listBullet: const TextStyle(color: Color(0xFFD4AF37)),
              strong: const TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
