import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../charts/data/models/birth_input.dart';
import '../../charts/data/models/create_chart_request.dart';
import '../../charts/data/models/chart_snapshot.dart';
import '../../charts/presentation/charts_provider.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../auth/data/repositories/auth_repository.dart';
import '../../vision/data/models/vision_kind.dart';
import '../../../core/theme/app_theme.dart';
import '../../../ui/animated_background.dart';
import '../../../ui/glass_panel.dart';
import '../../../ui/premium_text_field.dart';
import '../../../ui/premium_dropdown.dart';
import '../../../ui/premium_button.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _yearController = TextEditingController(text: '1990');
  final _monthController = TextEditingController(text: '1');
  final _dayController = TextEditingController(text: '1');
  final _hourController = TextEditingController(text: '12');
  String _gender = 'male';
  String _calendar = 'gregorian';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAndSignInAnonymously();
    });
  }

  Future<void> _checkAndSignInAnonymously() async {
    final authRepo = ref.read(authRepositoryProvider);
    if (authRepo.currentUser == null) {
      try {
        await authRepo.signInAnonymously();
      } catch (e) {
        // Suppress in production
      }
    }
  }

  void _submit() {
    final year = int.tryParse(_yearController.text) ?? 1990;
    final month = int.tryParse(_monthController.text) ?? 1;
    final day = int.tryParse(_dayController.text) ?? 1;
    final hour = int.tryParse(_hourController.text) ?? 12;

    final request = CreateChartRequest(
      chartSystem: 'zi-wei-dou-shu',
      birthInput: BirthInput(
        calendar: _calendar,
        date: BirthDate(year: year, month: month, day: day, isLeapMonth: _calendar == 'lunar' ? false : null),
        time: BirthTime(hour: hour, minute: 0, isUnknown: false),
        sexOrGenderForChart: _gender,
        place: BirthPlace(label: 'Hà Nội', manual: null),
        locale: 'vi-VN',
        source: 'user-entered',
      ),
    );

    ref.read(chartsProvider.notifier).createChart(request);
  }

  @override
  Widget build(BuildContext context) {
    final chartState = ref.watch(chartsProvider);

    ref.listen<AsyncValue<ChartDetailResponse?>>(
      chartsProvider,
      (previous, next) {
        if (next.hasValue && next.value != null) {
          if (mounted) {
            context.push('/charts/${next.value!.chartRecord.id}', extra: next.value);
          }
        } else if (next.hasError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Lỗi: ${next.error}'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      },
    );

    final authState = ref.watch(authStateProvider);
    final user = authState.value;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('Tử Vi Toàn Tập'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          if (user != null) ...[
            IconButton(
              icon: const Icon(Icons.account_balance_wallet, color: AppTheme.mysticalGold),
              onPressed: () {
                context.push('/wallet');
              },
            ),
            IconButton(
              icon: const Icon(Icons.logout, color: AppTheme.mysticalTextSecondary),
              onPressed: () {
                ref.read(authRepositoryProvider).signOut();
              },
            ),
          ] else ...[
            IconButton(
              icon: const Icon(Icons.person, color: AppTheme.mysticalTextSecondary),
              onPressed: () {
                context.push('/auth');
              },
            ),
          ],
        ],
      ),
      body: AnimatedBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16.0, 100.0, 16.0, 32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Welcome Text
              const Text(
                'Huyền học phương Đông',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.mysticalGold,
                  letterSpacing: 1.2,
                ),
                textAlign: TextAlign.center,
              ).animate().fade(duration: 600.ms).slideY(begin: -0.2, end: 0),
              
              const SizedBox(height: 8),
              const Text(
                'Lập Lá Số & Luận Giải',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.mysticalText,
                  letterSpacing: -0.5,
                ),
                textAlign: TextAlign.center,
              ).animate().fade(duration: 600.ms, delay: 200.ms).slideY(begin: -0.2, end: 0),
              
              const SizedBox(height: 32),
              
              // Input Form in Glass Panel
              GlassPanel(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'THÔNG TIN LẬP LÁ SỐ',
                      style: TextStyle(
                        color: AppTheme.mysticalGold,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: PremiumTextField(
                            controller: _dayController,
                            labelText: 'Ngày',
                            keyboardType: TextInputType.number,
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: PremiumTextField(
                            controller: _monthController,
                            labelText: 'Tháng',
                            keyboardType: TextInputType.number,
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: PremiumTextField(
                            controller: _yearController,
                            labelText: 'Năm',
                            keyboardType: TextInputType.number,
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: PremiumTextField(
                            controller: _hourController,
                            labelText: 'Giờ (0-23)',
                            keyboardType: TextInputType.number,
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: PremiumDropdown<String>(
                            value: _gender,
                            labelText: 'Giới tính',
                            items: const [
                              DropdownMenuItem(value: 'male', child: Text('Nam')),
                              DropdownMenuItem(value: 'female', child: Text('Nữ')),
                            ],
                            onChanged: (value) => setState(() => _gender = value!),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    PremiumDropdown<String>(
                      value: _calendar,
                      labelText: 'Lịch',
                      items: const [
                        DropdownMenuItem(value: 'gregorian', child: Text('Dương Lịch')),
                        DropdownMenuItem(value: 'lunar', child: Text('Âm Lịch')),
                      ],
                      onChanged: (value) => setState(() => _calendar = value!),
                    ),
                    const SizedBox(height: 24),
                    PremiumButton(
                      label: 'LẬP LÁ SỐ TỬ VI',
                      isLoading: chartState.isLoading,
                      onPressed: _submit,
                    ),
                  ],
                ),
              ).animate().fade(duration: 800.ms, delay: 400.ms).scaleXY(begin: 0.95, end: 1.0),

              const SizedBox(height: 48),
              
              // Extra Tools
              const Text(
                'CÔNG CỤ HỖ TRỢ KHÁC',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.mysticalTextSecondary,
                  letterSpacing: 1.0,
                ),
                textAlign: TextAlign.center,
              ).animate().fade(duration: 600.ms, delay: 600.ms),
              const SizedBox(height: 16),
              
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.5,
                children: _buildExtraTools(context).animate(interval: 50.ms, delay: 800.ms)
                    .fade(duration: 400.ms)
                    .slideY(begin: 0.2, end: 0),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildExtraTools(BuildContext context) {
    Widget buildGridItem({required String label, required IconData icon, required VoidCallback onTap}) {
      return Material(
        color: AppTheme.mysticalElevated,
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: AppTheme.mysticalGold, size: 32),
              const SizedBox(height: 12),
              Text(
                label,
                style: const TextStyle(
                  color: AppTheme.mysticalText,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return [
      buildGridItem(
        label: 'Đọc Tarot',
        icon: Icons.auto_awesome,
        onTap: () => context.push('/vision/input', extra: VisionKind.tarot),
      ),
      buildGridItem(
        label: 'Xem Chỉ Tay',
        icon: Icons.pan_tool,
        onTap: () => context.push('/vision/input', extra: VisionKind.palm),
      ),
      buildGridItem(
        label: 'Xem Tướng Mặt',
        icon: Icons.face,
        onTap: () => context.push('/vision/input', extra: VisionKind.face),
      ),
      buildGridItem(
        label: 'Thần Số Học',
        icon: Icons.calculate,
        onTap: () => context.push('/numerology'),
      ),
      buildGridItem(
        label: 'Kinh Dịch',
        icon: Icons.monetization_on,
        onTap: () => context.push('/iching'),
      ),
    ];
  }
}
