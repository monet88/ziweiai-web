import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

import '../providers/numerology_provider.dart';

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
    
    FocusScope.of(context).unfocus();
    ref.read(numerologyProvider.notifier).calculate(
      _nameController.text.trim(),
      _selectedDate!,
    );
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime(2000),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFFFFD700),
              onPrimary: Colors.black,
              surface: Color(0xFF1E1B4B),
              onSurface: Colors.white,
            ),
            dialogTheme: const DialogThemeData(backgroundColor: Color(0xFF0F172A)),
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
        title: const Text('Thần Số Học', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              _nameController.clear();
              setState(() {
                _selectedDate = null;
              });
              ref.read(numerologyProvider.notifier).reset();
            },
          ),
        ],
      ),
      body: Container(
        height: double.infinity,
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
                if (calculatedResult == null) ...[
                  const Text(
                    'Khám phá bản thân',
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
                    'Nhập thông tin để tìm ra các con số chủ đạo của bạn theo trường phái Pythagoras.',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  TextField(
                    controller: _nameController,
                    style: const TextStyle(color: Colors.white),
                    textCapitalization: TextCapitalization.words,
                    decoration: _inputDecoration('Họ và tên đầy đủ', Icons.person),
                  ),
                  const SizedBox(height: 16),
                  GestureDetector(
                    onTap: () => _selectDate(context),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white24, width: 1),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.calendar_today, color: Colors.white.withValues(alpha: 0.5)),
                          const SizedBox(width: 16),
                          Text(
                            _selectedDate == null 
                                ? 'Ngày sinh' 
                                : '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}',
                            style: TextStyle(
                              color: _selectedDate == null ? Colors.white.withValues(alpha: 0.3) : Colors.white,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _calculate,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFFD700),
                      foregroundColor: const Color(0xFF0F172A),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      elevation: 5,
                    ),
                    child: const Text(
                      'TÍNH TOÁN NGAY',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                    ),
                  ),
                ] else ...[
                  // Results UI
                  const Text(
                    'Chỉ Số Của Bạn',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFFFD700),
                      letterSpacing: 1.2,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildNumberCard('Đường Đời', calculatedResult.lifePath),
                      _buildNumberCard('Sứ Mệnh', calculatedResult.destiny),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildNumberCard('Linh Hồn', calculatedResult.soulUrge),
                      _buildNumberCard('Nhân Cách', calculatedResult.personality),
                    ],
                  ),
                  const SizedBox(height: 40),
                  
                  if (!hasAIResult) ...[
                    state.explanation.isLoading 
                      ? const Center(child: CircularProgressIndicator(color: Color(0xFFFFD700)))
                      : ElevatedButton(
                          onPressed: _getAIExplanation,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF4C1D95), // Deep purple for premium
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                              side: BorderSide(color: const Color(0xFFFFD700).withValues(alpha: 0.5)),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.auto_awesome, color: Color(0xFFFFD700)),
                              const SizedBox(width: 8),
                              const Text(
                                'LUẬN GIẢI CHUYÊN SÂU',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.black45,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text(
                                  '10 XU',
                                  style: TextStyle(color: Color(0xFFFFD700), fontSize: 12),
                                ),
                              ),
                            ],
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

  Widget _buildNumberCard(String title, int number) {
    return Container(
      width: 150,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFFFD700).withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFFD700).withValues(alpha: 0.05),
            blurRadius: 20,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            title,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            number.toString(),
            style: const TextStyle(
              color: Color(0xFFFFD700),
              fontSize: 48,
              fontWeight: FontWeight.bold,
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
                'Chiêm Nghiệm',
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

  InputDecoration _inputDecoration(String hint, IconData icon) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
      prefixIcon: Icon(icon, color: Colors.white.withValues(alpha: 0.5)),
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
    );
  }
}
