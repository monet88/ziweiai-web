import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/tarot_provider.dart';
import '../data/models/tarot_models.dart';
import 'widgets/royal_tarot_share_card.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/presentation/widgets/voice_audio_player_bar.dart';
import '../../../../ui/animated_background.dart';
import '../../../../ui/glass_panel.dart';



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
      duration: const Duration(milliseconds: 900),
    );
    _flipAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _flipController, curve: Curves.easeInOutCubic),
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
    
    HapticFeedback.mediumImpact();
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
        HapticFeedback.heavyImpact();
        _flipController.forward();
      } else if (next.isLoading) {
        _flipController.reverse();
      }
    });

    final hasResult = state.hasValue && state.value != null;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text(
          'Đọc Bài Tarot AI',
          style: GoogleFonts.cinzel(
            fontWeight: FontWeight.w700,
            color: AppTheme.goldBright,
            letterSpacing: 1.2,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          if (hasResult)
            IconButton(
              icon: const Icon(Icons.share_outlined, color: AppTheme.goldBright),
              onPressed: () {
                HapticFeedback.mediumImpact();
                RoyalTarotPreviewDialog.show(context, data: state.value!);
              },
              tooltip: 'Chia sẻ thiệp hoàng triều',
            ),
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.goldBright),
            onPressed: () {
              HapticFeedback.lightImpact();
              _questionController.clear();
              _flipController.reverse();
              ref.read(tarotProvider.notifier).reset();
            },
            tooltip: 'Rút lại',
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
                  child: hasResult
                      ? const SizedBox.shrink()
                      : GlassPanel(
                          padding: const EdgeInsets.all(20),
                          borderGradient: CelestialGradients.goldBorder,
                          child: Column(
                            children: [
                              Text(
                                'Thiết Lập Vấn Đề',
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
                                'Tập trung vào vấn đề bạn đang băn khoăn và đặt câu hỏi rõ ràng để kết nối trực giác với vũ trụ.',
                                style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 14, height: 1.4),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 20),
                              TextField(
                                controller: _questionController,
                                maxLines: 2,
                                style: const TextStyle(color: AppTheme.mysticalText),
                                decoration: InputDecoration(
                                  hintText: 'Chuyện tình cảm / định hướng sắp tới của tôi thế nào?',
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
                            ],
                          ),
                        ),
                ),
                const SizedBox(height: 32),
                
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
                
                const SizedBox(height: 36),
                
                // Result Narrative & Royal Share Button
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 600),
                  child: hasResult
                      ? Column(
                          children: [
                            _buildResultNarrative(state.value!.narrative),
                            const SizedBox(height: 20),
                            _buildRoyalShareButton(state.value!),
                          ],
                        )
                      : const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: const VoiceAudioPlayerBar(),
    );
  }



  Widget _buildCardBack(bool isLoading) {
    return Container(
      width: 230,
      height: 350,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.8), width: 2),
        gradient: const RadialGradient(
          center: Alignment(0.0, -0.2),
          radius: 1.0,
          colors: [
            Color(0xFF2C1654),
            Color(0xFF140D2E),
            Color(0xFF080614),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.mysticalGold.withValues(alpha: 0.3),
            blurRadius: 36,
            spreadRadius: 2,
          ),
          BoxShadow(
            color: AppTheme.nebulaPurple.withValues(alpha: 0.35),
            blurRadius: 24,
            spreadRadius: -4,
          ),
        ],
      ),
      child: Stack(
        children: [
          // Inner gold decorative frame
          Positioned.fill(
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppTheme.mysticalGold.withValues(alpha: 0.4),
                    width: 1,
                  ),
                ),
              ),
            ),
          ),
          Center(
            child: isLoading
                ? const CircularProgressIndicator(color: AppTheme.goldBright)
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: CelestialGradients.imperialGold,
                          boxShadow: CelestialShadows.goldGlow,
                        ),
                        child: const Icon(Icons.auto_awesome, color: Color(0xFF141026), size: 40),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Chạm Để\nRút Bài',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.cinzel(
                          color: AppTheme.goldBright,
                          fontWeight: FontWeight.w800,
                          fontSize: 20,
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.mysticalGold.withValues(alpha: 0.4), width: 0.8),
                        ),
                        child: const Text(
                          'Tốn 2 XU',
                          style: TextStyle(
                            color: AppTheme.goldBright,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
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

  Widget _buildCardFront(dynamic result) {
    if (result == null) return const SizedBox.shrink();
    final card = result.cards.first;
    
    return Container(
      width: 230,
      height: 350,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.goldBright, width: 2),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFFFBF8EE),
            const Color(0xFFEBE3D0),
            AppTheme.mysticalGold.withValues(alpha: 0.2),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.goldBright.withValues(alpha: 0.4),
            blurRadius: 40,
            spreadRadius: 4,
          ),
        ],
      ),
      child: Stack(
        children: [
          // Decorative border pattern
          Positioned.fill(
            child: Padding(
              padding: const EdgeInsets.all(10.0),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFD4AF37).withValues(alpha: 0.6), width: 1.2),
                  borderRadius: BorderRadius.circular(16),
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
                    style: GoogleFonts.cinzel(
                      color: const Color(0xFF1F2937),
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                if (card.reversed) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.redAccent.withValues(alpha: 0.5), width: 0.8),
                    ),
                    child: const Text(
                      'Ngược (Reversed)',
                      style: TextStyle(
                        color: Color(0xFFD32F2F),
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 28),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFFD4AF37).withValues(alpha: 0.15),
                    border: Border.all(color: const Color(0xFFD4AF37).withValues(alpha: 0.4), width: 1),
                  ),
                  child: Icon(
                    card.reversed ? Icons.wb_twilight : Icons.wb_sunny,
                    color: const Color(0xFFB8860B),
                    size: 54,
                  ),
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
                child: const Icon(Icons.auto_awesome, color: Color(0xFF141026), size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  'Lời Giải Mã Tarot AI',
                  style: GoogleFonts.cinzel(
                    color: AppTheme.goldBright,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
              VoicePlayIconButton(
                text: narrative,
                title: 'Giải Mã Tarot AI',
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

  Widget _buildRoyalShareButton(TarotDraw resultData) {
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
          RoyalTarotPreviewDialog.show(context, data: resultData);
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
