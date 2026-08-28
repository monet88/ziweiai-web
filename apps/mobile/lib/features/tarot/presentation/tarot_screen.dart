import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../providers/tarot_provider.dart';

class TarotScreen extends ConsumerStatefulWidget {
  const TarotScreen({super.key});

  @override
  ConsumerState<TarotScreen> createState() => _TarotScreenState();
}

class _TarotScreenState extends ConsumerState<TarotScreen> with SingleTickerProviderStateMixin {
  final _questionController = TextEditingController();
  late AnimationController _flipController;
  late Animation<double> _flipAnimation;

  @override
  void initState() {
    super.initState();
    _flipController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _flipAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _flipController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _questionController.dispose();
    _flipController.dispose();
    super.dispose();
  }

  void _drawCard() {
    if (_questionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập câu hỏi của bạn.')),
      );
      return;
    }
    
    FocusScope.of(context).unfocus();
    ref.read(tarotProvider.notifier).drawCard(_questionController.text);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tarotProvider);

    ref.listen(tarotProvider, (previous, next) {
      if (next.hasError) {
        final error = next.error;
        if (error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error.toString())),
          );
        }
      }
      
      if (next.hasValue && next.value != null && !next.isLoading) {
        _flipController.forward();
      } else if (next.isLoading) {
        _flipController.reverse();
      }
    });

    final hasResult = state.hasValue && state.value != null;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('Đọc bài Tarot', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              _questionController.clear();
              _flipController.reverse();
              ref.read(tarotProvider.notifier).reset();
            },
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0F172A), Color(0xFF1E1B4B)],
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
                  child: hasResult
                      ? const SizedBox.shrink()
                      : Column(
                          children: [
                            const Text(
                              'Nhập câu hỏi của bạn',
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: 1.2,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Tập trung vào vấn đề bạn đang băn khoăn và đặt câu hỏi rõ ràng để vũ trụ hồi đáp.',
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 16),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            TextField(
                              controller: _questionController,
                              maxLines: 2,
                              style: const TextStyle(color: Colors.white),
                              decoration: InputDecoration(
                                hintText: 'Chuyện tình cảm của tôi tháng này?',
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
                                  borderSide: const BorderSide(color: Color(0xFFFFD700), width: 1),
                                ),
                              ),
                            ),
                          ],
                        ),
                ),
                const SizedBox(height: 40),
                
                // 3D Flipping Card
                GestureDetector(
                  onTap: (!hasResult && !state.isLoading) ? _drawCard : null,
                  child: Center(
                    child: AnimatedBuilder(
                      animation: _flipAnimation,
                      builder: (context, child) {
                        final value = _flipAnimation.value;
                        final isBackFlipping = value < 0.5;
                        final rotationY = value * pi;
                        
                        return Transform(
                          transform: Matrix4.identity()
                            ..setEntry(3, 2, 0.001)
                            ..rotateY(rotationY),
                          alignment: Alignment.center,
                          child: isBackFlipping
                              ? _buildCardBack(state.isLoading)
                              : Transform(
                                  transform: Matrix4.identity()..rotateY(pi),
                                  alignment: Alignment.center,
                                  child: _buildCardFront(state.value),
                                ),
                        );
                      },
                    ),
                  ),
                ),
                
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

  Widget _buildCardBack(bool isLoading) {
    return Container(
      width: 220,
      height: 340,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFFFD700).withValues(alpha: 0.8), width: 2),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1E3A8A), Color(0xFF4C1D95)],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFFD700).withValues(alpha: 0.2),
            blurRadius: 30,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Center(
        child: isLoading
            ? const CircularProgressIndicator(color: Color(0xFFFFD700))
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.auto_awesome, color: Color(0xFFFFD700), size: 56),
                  const SizedBox(height: 24),
                  const Text(
                    'Chạm để\nRút Bài',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFFFFD700),
                      fontWeight: FontWeight.bold,
                      fontSize: 22,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black45,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'Tốn 2 XU',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildCardFront(dynamic result) {
    if (result == null) return const SizedBox.shrink();
    final card = result.cards.first;
    
    return Container(
      width: 220,
      height: 340,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFFFD700), width: 2),
        color: const Color(0xFFF8F9FA),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFFD700).withValues(alpha: 0.4),
            blurRadius: 40,
            spreadRadius: 5,
          ),
        ],
      ),
      child: Stack(
        children: [
          // Decorative border pattern
          Positioned.fill(
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFD4AF37).withValues(alpha: 0.5), width: 1),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Text(
                    card.name,
                    style: const TextStyle(
                      color: Color(0xFF1F2937),
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                if (card.reversed) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'Ngược (Reversed)',
                      style: TextStyle(
                        color: Colors.redAccent,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 32),
                Icon(
                  card.reversed ? Icons.wb_twilight : Icons.wb_sunny,
                  color: const Color(0xFFD4AF37),
                  size: 64,
                ),
              ],
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
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white10),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
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
                  color: const Color(0xFFFFD700).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.auto_awesome, color: Color(0xFFFFD700), size: 24),
              ),
              const SizedBox(width: 16),
              const Text(
                'Lời Giải Mã',
                style: TextStyle(
                  color: Color(0xFFFFD700),
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
              p: const TextStyle(color: Colors.white, fontSize: 17, height: 1.6, letterSpacing: 0.3),
              h1: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
              h2: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              h3: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              listBullet: const TextStyle(color: Color(0xFFFFD700)),
              strong: const TextStyle(color: Color(0xFFFFD700), fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
