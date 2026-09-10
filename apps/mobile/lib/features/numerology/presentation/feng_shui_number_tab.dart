import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/features/numerology/domain/feng_shui_number_calculator.dart';

class FengShuiNumberTab extends StatefulWidget {
  const FengShuiNumberTab({super.key});

  @override
  State<FengShuiNumberTab> createState() => _FengShuiNumberTabState();
}

class _FengShuiNumberTabState extends State<FengShuiNumberTab> {
  final TextEditingController _controller = TextEditingController();
  FengShuiNumberResult? _result;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _calculate() {
    final text = _controller.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập số điện thoại hoặc biển số xe')),
      );
      return;
    }

    HapticFeedback.mediumImpact();
    FocusScope.of(context).unfocus();

    setState(() {
      _result = FengShuiNumberCalculator.calculate(text);
    });
  }

  Color _getRatingColor(String rating) {
    if (rating.contains('Đại Cát')) return AppTheme.goldBright;
    if (rating.contains('Cát')) return const Color(0xFF10B981);
    if (rating.contains('Hung')) return AppTheme.cinnabarCrimson;
    return AppTheme.mysticalTextSecondary;
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Banner Khâm Thiên Giám
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1B1238), Color(0xFF130D2E)],
              ),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.35)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.dialpad, color: AppTheme.goldBright, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'BÁCH KHOA LINH SỐ PHONG THỦY',
                      style: GoogleFonts.cinzel(
                        color: AppTheme.goldBright,
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Tra cứu cát hung 80 linh số của Số Điện Thoại, Biển Số Xe, Số Tài Khoản Ngân Hàng theo dịch học Đông Phương cổ truyền.',
                  style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 12, height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Khung Nhập Số
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppTheme.cosmosSurface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.25)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'NHẬP DÃY SỐ CẦN TRA CỨU',
                  style: TextStyle(
                    color: AppTheme.goldBright,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _controller,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(
                    color: AppTheme.mysticalText,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Ví dụ: 0988.123.456 hoặc 30A-999.88',
                    hintStyle: TextStyle(
                      color: AppTheme.mysticalTextSecondary.withValues(alpha: 0.4),
                      fontSize: 13,
                      letterSpacing: 0.5,
                    ),
                    filled: true,
                    fillColor: const Color(0xFF0F0B1E),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: AppTheme.mysticalGold),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: AppTheme.goldBright.withValues(alpha: 0.3)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: AppTheme.goldBright, width: 1.8),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                ElevatedButton.icon(
                  onPressed: _calculate,
                  icon: const Icon(Icons.auto_awesome, size: 18),
                  label: const Text(
                    'Luận Đoán Phong Thủy',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.goldBright,
                    foregroundColor: const Color(0xFF141026),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Kết quả Luận Đoán Cát Hung
          if (_result != null) ...[
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF1F163D), Color(0xFF130D2E)],
                ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: _getRatingColor(_result!.rating),
                  width: 1.8,
                ),
                boxShadow: [
                  BoxShadow(
                    color: _getRatingColor(_result!.rating).withValues(alpha: 0.2),
                    blurRadius: 24,
                    spreadRadius: 1,
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Hàng Tiêu Đề & Badge Cát Hung
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'LINH SỐ QUẺ ${_result!.luckyIndex}',
                        style: GoogleFonts.spaceGrotesk(
                          color: AppTheme.mysticalTextSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.5,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getRatingColor(_result!.rating).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: _getRatingColor(_result!.rating)),
                        ),
                        child: Text(
                          _result!.rating.toUpperCase(),
                          style: TextStyle(
                            color: _getRatingColor(_result!.rating),
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Ngũ Hành Con Số
                  Row(
                    children: [
                      const Icon(Icons.waves, color: AppTheme.goldBright, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        'Ngũ Hành: ${_result!.element}',
                        style: const TextStyle(
                          color: AppTheme.goldBright,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const Divider(color: Color(0x33D4AF37), height: 24),

                  // Ý Nghĩa Cung Đình
                  Text(
                    'Ý NGHĨA LINH ỨNG',
                    style: GoogleFonts.cinzel(
                      color: AppTheme.goldBright,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _result!.meaning,
                    style: const TextStyle(
                      color: AppTheme.mysticalText,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Lời Khuyên Phong Thủy
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F0B1E),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.mysticalGold.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.lightbulb_outline, color: AppTheme.goldBright, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _result!.advice,
                            style: const TextStyle(
                              color: AppTheme.mysticalTextSecondary,
                              fontSize: 13,
                              height: 1.35,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 30),
        ],
      ),
    );
  }
}
