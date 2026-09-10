import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/ui/animated_background.dart';
import 'package:ziweiai_mobile/ui/glass_panel.dart';
import 'package:ziweiai_mobile/ui/premium_button.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';
import 'package:ziweiai_mobile/core/api/api_provider.dart';
import '../../domain/models/compatibility_models.dart';
import '../../domain/services/compatibility_calculator.dart';
import '../widgets/royal_compatibility_card.dart';

class CompatibilityScreen extends ConsumerStatefulWidget {
  const CompatibilityScreen({super.key});

  @override
  ConsumerState<CompatibilityScreen> createState() => _CompatibilityScreenState();
}

class _CompatibilityScreenState extends ConsumerState<CompatibilityScreen> {
  final _name1Controller = TextEditingController(text: 'Trọng Thủy');
  final _year1Controller = TextEditingController(text: '1990');
  String _gender1 = 'male';

  final _name2Controller = TextEditingController(text: 'Mỵ Châu');
  final _year2Controller = TextEditingController(text: '1995');
  String _gender2 = 'female';

  CompatibilityCategory _category = CompatibilityCategory.love;
  CompatibilityResult? _result;
  bool _isUnlockedAI = false;
  bool _isLoadingAI = false;
  String? _aiCustomExplanation;
  final GlobalKey _cardKey = GlobalKey();

  @override
  void dispose() {
    _name1Controller.dispose();
    _year1Controller.dispose();
    _name2Controller.dispose();
    _year2Controller.dispose();
    super.dispose();
  }

  void _calculateCompatibility() {
    HapticFeedback.mediumImpact();
    final y1 = int.tryParse(_year1Controller.text.trim()) ?? 1990;
    final y2 = int.tryParse(_year2Controller.text.trim()) ?? 1995;

    final p1 = CompatibilityPerson(
      name: _name1Controller.text.trim().isEmpty ? 'Người thứ nhất' : _name1Controller.text.trim(),
      year: y1,
      gender: _gender1,
    );

    final p2 = CompatibilityPerson(
      name: _name2Controller.text.trim().isEmpty ? 'Người thứ hai' : _name2Controller.text.trim(),
      year: y2,
      gender: _gender2,
    );

    setState(() {
      _result = CompatibilityCalculator.calculate(
        person1: p1,
        person2: p2,
        category: _category,
      );
      _isUnlockedAI = false;
    });
  }

  Future<void> _unlockAIExplanation() async {
    final balance = ref.read(walletBalanceProvider).value ?? 0;

    if (balance < 15) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF1B1238),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(color: AppTheme.goldBright, width: 1.2),
          ),
          title: Text(
            'Số Dư XU Không Đủ',
            style: GoogleFonts.cinzel(color: AppTheme.goldBright, fontWeight: FontWeight.bold),
          ),
          content: Text(
            'Để thỉnh ý Khâm Thiên Giám luận giải tương hợp chuyên sâu, Đại Ka cần 15 XU (Hiện có: $balance XU). Đại Ka có muốn nạp thêm không?',
            style: const TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Để Sau', style: TextStyle(color: Colors.white60)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.mysticalGold,
                foregroundColor: Colors.black,
              ),
              onPressed: () {
                Navigator.pop(ctx);
                context.push('/wallet');
              },
              child: const Text('Nạp XU Ngay 👑', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1B1238),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppTheme.goldBright, width: 1.2),
        ),
        title: Text(
          'Thỉnh Ý Khâm Thiên Giám',
          style: GoogleFonts.cinzel(color: AppTheme.goldBright, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Đại Ka có muốn thỉnh Khâm Thiên Giám AI xuất ngự bút luận giải bí truyền chi tiết về vận hạn, phối hôn và phong thủy hóa giải cho 2 người với giá 15 XU không?',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.cinnabarCrimson,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xác Nhận (15 XU)', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true && _result != null) {
      final res = _result!;
      setState(() {
        _isUnlockedAI = true;
        _isLoadingAI = true;
      });

      try {
        final apiClient = ref.read(apiClientProvider);
        final apiRes = await apiClient.explainCompatibility({
          'person1': {
            'name': res.person1.name,
            'birthYear': res.person1.year,
            'gender': res.person1.gender,
          },
          'person2': {
            'name': res.person2.name,
            'birthYear': res.person2.year,
            'gender': res.person2.gender,
          },
          'overallScore': res.totalScore,
          'verdictTitle': res.verdictTitle,
        });

        if (mounted) {
          setState(() {
            _aiCustomExplanation = apiRes['explanation'] as String?;
            _isLoadingAI = false;
          });
        }
        ref.invalidate(walletBalanceProvider);
      } catch (_) {
        if (mounted) {
          setState(() {
            _isLoadingAI = false;
          });
        }
      }
    }
  }

  void _showShareCardModal(CompatibilityResult result) {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Color(0xFF0F0B1E),
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'THẺ DUYÊN ĐỊNH CUNG ĐÌNH 9:16',
                style: GoogleFonts.cinzel(
                  color: AppTheme.goldBright,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(20),
                  child: Center(
                    child: SizedBox(
                      width: 320,
                      child: RoyalCompatibilityCard(
                        result: result,
                        boundaryKey: _cardKey,
                      ),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white70,
                          side: const BorderSide(color: Colors.white24),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        onPressed: () => Navigator.pop(ctx),
                        icon: const Icon(Icons.close, size: 18),
                        label: const Text('Đóng'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.mysticalGold,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        onPressed: () async {
                          HapticFeedback.mediumImpact();
                          final messenger = ScaffoldMessenger.of(context);
                          final navigator = Navigator.of(ctx);
                          final bytes = await RoyalCompatibilityCard.captureCard(_cardKey);
                          if (!mounted) return;
                          navigator.pop();
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text(
                                bytes != null
                                    ? 'Đã kết xuất thẻ Cung Đình 9:16 thành công!'
                                    : 'Đang chuẩn bị thẻ chia sẻ...',
                              ),
                              backgroundColor: AppTheme.cinnabarCrimson,
                            ),
                          );
                        },
                        icon: const Icon(Icons.share, size: 18),
                        label: const Text('Chia Sẻ Story 👑', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final balance = ref.watch(walletBalanceProvider).value ?? 0;

    return Scaffold(
      backgroundColor: AppTheme.cosmosDark,
      body: AnimatedBackground(
        child: SafeArea(
          child: Column(
            children: [
                // Top Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
                        onPressed: () => context.pop(),
                      ),
                      Column(
                        children: [
                          Text(
                            'DUYÊN ĐỊNH CUNG ĐÌNH',
                            style: GoogleFonts.cinzel(
                              color: AppTheme.goldBright,
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                            ),
                          ),
                          const Text(
                            'Hợp Hôn · Tương Hợp · Đồng Khí',
                            style: TextStyle(color: Colors.white60, fontSize: 10),
                          ),
                        ],
                      ),
                      // Wallet Badge
                      GestureDetector(
                        onTap: () => context.push('/wallet'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            color: AppTheme.goldBright.withValues(alpha: 0.15),
                            border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.5)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.monetization_on, color: AppTheme.goldBright, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                '$balance XU',
                                style: const TextStyle(
                                  color: AppTheme.goldBright,
                                  fontSize: 11,
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

                // Main Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Category Selector
                        Row(
                          children: CompatibilityCategory.values.map((cat) {
                            final isSelected = _category == cat;
                            return Expanded(
                              child: GestureDetector(
                                onTap: () {
                                  HapticFeedback.selectionClick();
                                  setState(() {
                                    _category = cat;
                                    if (_result != null) {
                                      _calculateCompatibility();
                                    }
                                  });
                                },
                                child: Container(
                                  margin: const EdgeInsets.symmetric(horizontal: 4),
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(12),
                                    color: isSelected
                                        ? AppTheme.cinnabarCrimson.withValues(alpha: 0.35)
                                        : Colors.white.withValues(alpha: 0.05),
                                    border: Border.all(
                                      color: isSelected ? AppTheme.goldBright : Colors.white12,
                                      width: isSelected ? 1.2 : 0.8,
                                    ),
                                  ),
                                  child: Text(
                                    cat.title.split(' ')[0], // Tình, Hợp, Bạn
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: isSelected ? AppTheme.goldBright : Colors.white70,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 16),

                        // Form nhập 2 người
                        GlassPanel(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Person 1
                              _buildPersonInput(
                                title: 'Người Thứ Nhất (Đại Ca / Nam / Đối tác)',
                                nameController: _name1Controller,
                                yearController: _year1Controller,
                                gender: _gender1,
                                onGenderChanged: (g) => setState(() => _gender1 = g),
                              ),
                              const Divider(color: Colors.white12, height: 28),
                              // Person 2
                              _buildPersonInput(
                                title: 'Người Thứ Hai (Ý Trung Nhân / Nữ / Tri Kỷ)',
                                nameController: _name2Controller,
                                yearController: _year2Controller,
                                gender: _gender2,
                                onGenderChanged: (g) => setState(() => _gender2 = g),
                              ),
                              const SizedBox(height: 18),
                              // Submit button
                              PremiumButton(
                                label: 'Tra Cứu Duyên Định Cung Đình 👑',
                                onPressed: _calculateCompatibility,
                                icon: Icons.auto_awesome,
                              ),
                            ],
                          ),
                        ),

                        // Result Section
                        if (_result != null) ...[
                          const SizedBox(height: 20),
                          _buildResultSection(_result!),
                        ],
                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

  Widget _buildPersonInput({
    required String title,
    required TextEditingController nameController,
    required TextEditingController yearController,
    required String gender,
    required ValueChanged<String> onGenderChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.cinzel(
            color: AppTheme.goldBright,
            fontSize: 12,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              flex: 2,
              child: TextField(
                controller: nameController,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Họ và tên',
                  labelStyle: const TextStyle(color: Colors.white60, fontSize: 12),
                  filled: true,
                  fillColor: Colors.black26,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: yearController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Năm sinh',
                  labelStyle: const TextStyle(color: Colors.white60, fontSize: 12),
                  filled: true,
                  fillColor: Colors.black26,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Text('Giới tính: ', style: TextStyle(color: Colors.white70, fontSize: 12)),
            const SizedBox(width: 8),
            ChoiceChip(
              label: const Text('Nam', style: TextStyle(fontSize: 11)),
              selected: gender == 'male',
              selectedColor: AppTheme.cinnabarCrimson.withValues(alpha: 0.6),
              onSelected: (selected) {
                if (selected) onGenderChanged('male');
              },
            ),
            const SizedBox(width: 8),
            ChoiceChip(
              label: const Text('Nữ', style: TextStyle(fontSize: 11)),
              selected: gender == 'female',
              selectedColor: AppTheme.cinnabarCrimson.withValues(alpha: 0.6),
              onSelected: (selected) {
                if (selected) onGenderChanged('female');
              },
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildResultSection(CompatibilityResult res) {
    return Column(
      children: [
        // Overall Score Banner
        GlassPanel(
          padding: const EdgeInsets.all(18),
          child: Column(
            children: [
              Text(
                'KẾT QUẢ TƯƠNG HỢP CUNG ĐÌNH',
                style: GoogleFonts.cinzel(
                  color: AppTheme.goldBright,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 14),
              // Circle Score
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const RadialGradient(
                    colors: [Color(0xFF6B1D28), Color(0xFF2C0A10)],
                  ),
                  border: Border.all(color: AppTheme.goldBright, width: 2.5),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.cinnabarCrimson.withValues(alpha: 0.5),
                      blurRadius: 18,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${res.totalScore}',
                      style: GoogleFonts.cinzel(
                        color: AppTheme.goldBright,
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        height: 1.0,
                      ),
                    ),
                    const Text(
                      '/100 điểm',
                      style: TextStyle(color: Colors.white70, fontSize: 9),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Text(
                res.verdictTitle,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppTheme.goldBright,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                res.verdictSummary,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: Colors.black26,
                  border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.2)),
                ),
                child: Text(
                  res.imperialPoem,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.beVietnamPro(
                    fontStyle: FontStyle.italic,
                    color: const Color(0xFFFFE3B8),
                    fontSize: 11,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // 4 Trụ Cột Tương Hợp
        _buildAspectCard(res.elementAspect, Icons.waves),
        const SizedBox(height: 10),
        _buildAspectCard(res.batTrachAspect, Icons.compass_calibration),
        const SizedBox(height: 10),
        _buildAspectCard(res.canAspect, Icons.star_border),
        const SizedBox(height: 10),
        _buildAspectCard(res.chiAspect, Icons.pets),
        const SizedBox(height: 16),

        // Nút Mở Thẻ Story 9:16
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3B1F69),
              foregroundColor: AppTheme.goldBright,
              side: const BorderSide(color: AppTheme.goldBright, width: 1.2),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: () => _showShareCardModal(res),
            icon: const Icon(Icons.photo_library, size: 18),
            label: const Text(
              'Xuất Thẻ Duyên Định Story 9:16 👑',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Section AI Luận Giải
        GlassPanel(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.auto_awesome, color: AppTheme.goldBright, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'KHÂM THIÊN GIÁM NGỰ BÚT (AI)',
                    style: GoogleFonts.cinzel(
                      color: AppTheme.goldBright,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (!_isUnlockedAI) ...[
                const Text(
                  'Thỉnh Khâm Thiên Giám AI xuất ngự bút luận giải vận thế tương tác sâu, cách hóa giải xung sát và thời vận phát tài cho 2 người.',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.cinnabarCrimson,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _unlockAIExplanation,
                    child: const Text(
                      'Thỉnh Ý Khâm Thiên Giám (15 XU) 👑',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.black26,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '📜 NGỰ BÚT KHÂM THIÊN GIÁM:',
                        style: GoogleFonts.cinzel(
                          color: AppTheme.goldBright,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _isLoadingAI
                            ? '⏳ Đang thỉnh ý Khâm Thiên Giám xuất ngự bút...'
                            : (_aiCustomExplanation ??
                                'Phối hôn giữa ${res.person1.name} (${res.person1.year}) và ${res.person2.name} (${res.person2.year}) tạo nên cục diện "${res.verdictTitle}".\n\n'
                                '${res.advice}\n\n'
                                'Về phương diện phong thủy: Nên chọn hướng phòng ngủ hoặc phòng làm việc theo cung Sinh Khí hoặc Thiên Y để gia tăng vượng khí. Năm 2026 Bính Ngọ là thời điểm đắc lợi để củng cố mối liên kết và thực hiện các dự định lớn.'),
                        style: const TextStyle(color: Colors.white, fontSize: 12, height: 1.5),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAspectCard(CompatibilityAspect aspect, IconData icon) {
    return GlassPanel(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(icon, color: AppTheme.goldBright, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    aspect.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  color: AppTheme.goldBright.withValues(alpha: 0.15),
                  border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.4)),
                ),
                child: Text(
                  '${aspect.score}/${aspect.maxScore} đ',
                  style: const TextStyle(
                    color: AppTheme.goldBright,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '${aspect.detail} · ${aspect.rating}',
            style: const TextStyle(
              color: AppTheme.goldBright,
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            aspect.explanation,
            style: const TextStyle(color: Colors.white60, fontSize: 11, height: 1.3),
          ),
        ],
      ),
    );
  }
}
