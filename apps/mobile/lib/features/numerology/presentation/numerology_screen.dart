import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/numerology_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../ui/animated_background.dart';
import '../../../../ui/glass_panel.dart';

class NumerologyScreen extends ConsumerStatefulWidget {
  const NumerologyScreen({super.key});

  @override
  ConsumerState<NumerologyScreen> createState() => _NumerologyScreenState();
}

class _NumerologyScreenState extends ConsumerState<NumerologyScreen> {
  final _nameController = TextEditingController();
  DateTime? _selectedDate;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _calculate() {
    if (_nameController.text.trim().isEmpty || _selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập họ tên và ngày sinh.')),
      );
      return;
    }
    
    HapticFeedback.mediumImpact();
    FocusScope.of(context).unfocus();
    ref.read(numerologyProvider.notifier).calculate(
      _nameController.text.trim(),
      _selectedDate!,
    );
  }

  Future<void> _selectDate(BuildContext context) async {
    HapticFeedback.selectionClick();
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime(2000),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppTheme.goldBright,
              onPrimary: Color(0xFF141026),
              surface: Color(0xFF1C1733),
              onSurface: Colors.white,
            ),
            dialogTheme: const DialogThemeData(backgroundColor: Color(0xFF0D0B18)),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
        ref.read(numerologyProvider.notifier).reset();
      });
    }
  }

  void _getAIExplanation() {
    final state = ref.read(numerologyProvider);
    if (state.calculatedResult == null) return;
    
    HapticFeedback.heavyImpact();
    ref.read(numerologyProvider.notifier).getExplanation(
      lifePath: state.calculatedResult!.lifePath,
      destiny: state.calculatedResult!.destiny,
      soulUrge: state.calculatedResult!.soulUrge,
      personality: state.calculatedResult!.personality,
      fullName: _nameController.text.trim(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(numerologyProvider);

    ref.listen(numerologyProvider, (previous, next) {
      if (next.explanation.hasError) {
        final error = next.explanation.error;
        if (error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error.toString())),
          );
        }
      }
    });

    final calculatedResult = state.calculatedResult;
    final hasAIResult = state.explanation.hasValue && state.explanation.value != null;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text(
          'Thần Số Học Pythagoras',
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
            onPressed: () {
              HapticFeedback.lightImpact();
              _nameController.clear();
              setState(() {
                _selectedDate = null;
              });
              ref.read(numerologyProvider.notifier).reset();
            },
            tooltip: 'Nhập lại',
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
                if (calculatedResult == null) ...[
                  GlassPanel(
                    padding: const EdgeInsets.all(20),
                    borderGradient: CelestialGradients.goldBorder,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Khám Phá Bản Thân',
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
                          'Nhập họ tên và ngày sinh để giải mã 4 con số định mệnh theo trường phái Pythagoras.',
                          style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 14, height: 1.4),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        TextField(
                          controller: _nameController,
                          style: const TextStyle(color: AppTheme.mysticalText),
                          textCapitalization: TextCapitalization.words,
                          decoration: _inputDecoration('Họ và tên đầy đủ', Icons.person_outline),
                        ),
                        const SizedBox(height: 16),
                        GestureDetector(
                          onTap: () => _selectDate(context),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            decoration: BoxDecoration(
                              color: AppTheme.cosmosElevated.withValues(alpha: 0.6),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppTheme.mysticalGold.withValues(alpha: 0.25), width: 1),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.calendar_month_outlined, color: AppTheme.goldBright),
                                const SizedBox(width: 14),
                                Text(
                                  _selectedDate == null 
                                      ? 'Chọn ngày sinh (Dương lịch)' 
                                      : '${_selectedDate!.day.toString().padLeft(2, '0')}/${_selectedDate!.month.toString().padLeft(2, '0')}/${_selectedDate!.year}',
                                  style: TextStyle(
                                    color: _selectedDate == null ? Colors.white30 : AppTheme.mysticalText,
                                    fontSize: 15,
                                    fontWeight: _selectedDate == null ? FontWeight.normal : FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 28),
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            gradient: CelestialGradients.imperialGold,
                            boxShadow: CelestialShadows.goldGlow,
                          ),
                          child: ElevatedButton(
                            onPressed: _calculate,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              foregroundColor: const Color(0xFF141026),
                              shadowColor: Colors.transparent,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: Text(
                              'TÍNH TOÁN NGAY',
                              style: GoogleFonts.cinzel(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  // Results UI
                  Text(
                    'Bộ Tứ Chỉ Số Cốt Lõi',
                    style: GoogleFonts.cinzel(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.goldBright,
                      letterSpacing: 1.2,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(child: _buildNumberCard('Đường Đời', calculatedResult.lifePath, Icons.alt_route_rounded)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildNumberCard('Sứ Mệnh', calculatedResult.destiny, Icons.flag_circle_rounded)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildNumberCard('Linh Hồn', calculatedResult.soulUrge, Icons.favorite_rounded)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildNumberCard('Nhân Cách', calculatedResult.personality, Icons.psychology_rounded)),
                    ],
                  ),
                  const SizedBox(height: 32),
                  
                  if (!hasAIResult) ...[
                    state.explanation.isLoading 
                      ? const Center(child: CircularProgressIndicator(color: AppTheme.goldBright))
                      : Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(18),
                            gradient: CelestialGradients.imperialGold,
                            boxShadow: CelestialShadows.goldGlow,
                          ),
                          child: ElevatedButton(
                            onPressed: _getAIExplanation,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              foregroundColor: const Color(0xFF141026),
                              shadowColor: Colors.transparent,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(18),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.auto_awesome, color: Color(0xFF141026)),
                                const SizedBox(width: 10),
                                Text(
                                  'LUẬN GIẢI CHUYÊN SÂU AI',
                                  style: GoogleFonts.cinzel(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF141026).withValues(alpha: 0.8),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text(
                                    '10 XU',
                                    style: TextStyle(
                                      color: AppTheme.goldBright,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                  ] else ...[
                    _buildResultNarrative(state.explanation.value!.narrative),
                  ],
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNumberCard(String title, int number, IconData icon) {
    return GlassPanel(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
      borderGradient: CelestialGradients.goldBorder,
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: AppTheme.goldBright, size: 16),
              const SizedBox(width: 6),
              Text(
                title,
                style: const TextStyle(
                  color: AppTheme.mysticalTextSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            number.toString(),
            style: GoogleFonts.cinzel(
              color: AppTheme.goldBright,
              fontSize: 44,
              fontWeight: FontWeight.w900,
              shadows: CelestialShadows.goldGlow,
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
              Text(
                'Chiêm Nghiệm Thần Số Học AI',
                style: GoogleFonts.cinzel(
                  color: AppTheme.goldBright,
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.0,
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

  InputDecoration _inputDecoration(String hint, IconData icon) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.white30),
      prefixIcon: Icon(icon, color: AppTheme.goldBright),
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
    );
  }
}
