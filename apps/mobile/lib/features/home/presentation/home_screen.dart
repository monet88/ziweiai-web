import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../charts/data/models/birth_input.dart';
import '../../charts/data/models/create_chart_request.dart';
import '../../charts/data/models/chart_snapshot.dart';
import '../../charts/presentation/charts_provider.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../auth/data/repositories/auth_repository.dart';
import '../../vision/data/models/vision_kind.dart';
import '../../wallet/providers/wallet_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../ui/animated_background.dart';
import '../../../ui/glass_panel.dart';
import '../../../ui/premium_text_field.dart';
import '../../../ui/premium_dropdown.dart';
import '../../../ui/premium_button.dart';
import '../../../ui/floating_pill_nav_bar.dart';

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
  int _currentNavIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAndSignInAnonymously();
    });
  }

  @override
  void dispose() {
    _yearController.dispose();
    _monthController.dispose();
    _dayController.dispose();
    _hourController.dispose();
    super.dispose();
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
    HapticFeedback.mediumImpact();
    final year = int.tryParse(_yearController.text) ?? 1990;
    final month = int.tryParse(_monthController.text) ?? 1;
    final day = int.tryParse(_dayController.text) ?? 1;
    final hour = int.tryParse(_hourController.text) ?? 12;

    final request = CreateChartRequest(
      chartSystem: 'zi-wei-dou-shu',
      birthInput: BirthInput(
        calendar: _calendar,
        date: BirthDate(
          year: year,
          month: month,
          day: day,
          isLeapMonth: _calendar == 'lunar' ? false : null,
        ),
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
    final authState = ref.watch(authStateProvider);
    final user = authState.value;
    final balanceAsync = ref.watch(walletBalanceProvider);

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

    return Scaffold(
      extendBodyBehindAppBar: true,
      extendBody: true,
      appBar: AppBar(
        backgroundColor: AppTheme.cosmosDark.withValues(alpha: 0.8),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: CelestialGradients.imperialGold,
              ),
              child: const Icon(
                Icons.auto_awesome,
                size: 14,
                color: Color(0xFF141026),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'TỬ VI TOÀN TẬP',
              style: GoogleFonts.cinzel(
                color: AppTheme.goldBright,
                fontSize: 16,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.5,
              ),
            ),
          ],
        ),
        actions: [
          // Wallet Balance Pill
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              context.push('/wallet');
            },
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                gradient: LinearGradient(
                  colors: [
                    AppTheme.mysticalGold.withValues(alpha: 0.2),
                    AppTheme.nebulaPurple.withValues(alpha: 0.15),
                  ],
                ),
                border: Border.all(
                  color: AppTheme.mysticalGold.withValues(alpha: 0.4),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.monetization_on,
                    size: 15,
                    color: AppTheme.goldBright,
                  ),
                  const SizedBox(width: 4),
                  balanceAsync.when(
                    data: (balance) => Text(
                      '$balance XU',
                      style: const TextStyle(
                        color: AppTheme.goldBright,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                    loading: () => const SizedBox(
                      width: 10,
                      height: 10,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppTheme.goldBright,
                      ),
                    ),
                    error: (err, stack) => const Text(
                      '0 XU',
                      style: TextStyle(
                        color: AppTheme.goldBright,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Auth / Profile Button
          if (user != null)
            IconButton(
              tooltip: 'Đăng xuất',
              icon: const Icon(Icons.logout, color: AppTheme.mysticalTextSecondary, size: 20),
              onPressed: () {
                HapticFeedback.lightImpact();
                ref.read(authRepositoryProvider).signOut();
              },
            )
          else
            IconButton(
              tooltip: 'Đăng nhập',
              icon: const Icon(Icons.person_outline, color: AppTheme.goldBright, size: 22),
              onPressed: () {
                HapticFeedback.lightImpact();
                context.push('/auth');
              },
            ),
          const SizedBox(width: 4),
        ],
      ),
      body: AnimatedBackground(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16.0, 80.0, 16.0, 90.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Hero Subtitle & Welcome
              Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    color: AppTheme.cosmosElevated.withValues(alpha: 0.6),
                    border: Border.all(
                      color: AppTheme.mysticalGold.withValues(alpha: 0.3),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.stars, size: 12, color: AppTheme.goldBright),
                      const SizedBox(width: 5),
                      Text(
                        'VŨ TRỤ THUẬT SỐ & AI TỔNG HỢP',
                        style: GoogleFonts.cinzel(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.goldBright,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                ),
              ).animate().fade(duration: 350.ms).slideY(begin: -0.15, end: 0),

              const SizedBox(height: 6),

              Text(
                'Khám Phá Vận Mệnh Cốt Lõi',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.mysticalText,
                  letterSpacing: -0.2,
                ),
                textAlign: TextAlign.center,
              ).animate().fade(duration: 450.ms, delay: 60.ms).slideY(begin: -0.1, end: 0),

              const SizedBox(height: 12),

              // Hero Bento Card: Tử Vi Đẩu Số Quick-Form
              _buildZiweiHeroCard(context, chartState)
                  .animate()
                  .fade(duration: 500.ms, delay: 100.ms)
                  .scaleXY(begin: 0.97, end: 1.0),

              const SizedBox(height: 24),

              // Bento Section Title
              Row(
                children: [
                  Container(
                    width: 3,
                    height: 15,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(2),
                      gradient: CelestialGradients.imperialGold,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'BENTO GRID THUẬT SỐ AI',
                    style: GoogleFonts.cinzel(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.goldBright,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ).animate().fade(duration: 350.ms, delay: 150.ms),

              const SizedBox(height: 10),

              // Bento Grid AI Mystical Tools
              _buildBentoGrid(context)
                  .animate()
                  .fade(duration: 500.ms, delay: 200.ms),
            ],
          ),
        ),
      ),
      bottomNavigationBar: FloatingPillNavBar(
        currentIndex: _currentNavIndex,
        onTap: (index) {
          setState(() => _currentNavIndex = index);
          if (index == 1) {
            context.push('/iching');
          } else if (index == 2) {
            context.push('/numerology');
          } else if (index == 3) {
            context.push('/wallet');
          }
        },
        items: const [
          FloatingNavItem(
            icon: Icons.auto_awesome_outlined,
            activeIcon: Icons.auto_awesome,
            label: 'Trang chủ',
            route: '/',
          ),
          FloatingNavItem(
            icon: Icons.monetization_on_outlined,
            activeIcon: Icons.monetization_on,
            label: 'Kinh Dịch',
            route: '/iching',
          ),
          FloatingNavItem(
            icon: Icons.calculate_outlined,
            activeIcon: Icons.calculate,
            label: 'Thần Số',
            route: '/numerology',
          ),
          FloatingNavItem(
            icon: Icons.account_balance_wallet_outlined,
            activeIcon: Icons.account_balance_wallet,
            label: 'Ví XU',
            route: '/wallet',
          ),
        ],
      ),
    );
  }

  Widget _buildZiweiHeroCard(BuildContext context, AsyncValue<ChartDetailResponse?> chartState) {
    return GlassPanel(
      padding: const EdgeInsets.all(18),
      borderGradient: CelestialGradients.goldBorder,
      shadows: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.4),
          blurRadius: 20,
          offset: const Offset(0, 8),
        ),
        BoxShadow(
          color: AppTheme.mysticalGold.withValues(alpha: 0.15),
          blurRadius: 24,
          spreadRadius: -2,
        ),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Card Header with Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(5),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppTheme.cosmosElevated,
                      border: Border.all(color: AppTheme.mysticalGold, width: 1),
                    ),
                    child: const Icon(
                      Icons.compass_calibration,
                      size: 15,
                      color: AppTheme.goldBright,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'THÔNG TIN LẬP LÁ SỐ',
                    style: GoogleFonts.cinzel(
                      color: AppTheme.goldBright,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.0,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.nebulaPurple.withValues(alpha: 0.3),
                      AppTheme.nebulaCyan.withValues(alpha: 0.2),
                    ],
                  ),
                  border: Border.all(
                    color: AppTheme.nebulaCyan.withValues(alpha: 0.4),
                    width: 0.8,
                  ),
                ),
                child: const Text(
                  'AI TỬ VI ĐẨU SỐ',
                  style: TextStyle(
                    color: AppTheme.nebulaCyan,
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.6,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Date Inputs Row
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
              const SizedBox(width: 8),
              Expanded(
                child: PremiumTextField(
                  controller: _monthController,
                  labelText: 'Tháng',
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(width: 8),
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

          const SizedBox(height: 10),

          // Time & Gender Row
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
              const SizedBox(width: 8),
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

          const SizedBox(height: 10),

          // Calendar Selector
          PremiumDropdown<String>(
            value: _calendar,
            labelText: 'Hệ Lịch',
            items: const [
              DropdownMenuItem(value: 'gregorian', child: Text('Dương Lịch (Chuẩn)')),
              DropdownMenuItem(value: 'lunar', child: Text('Âm Lịch (Tiết Khí)')),
            ],
            onChanged: (value) => setState(() => _calendar = value!),
          ),

          const SizedBox(height: 16),

          // Submit CTA Button
          PremiumButton(
            label: 'LẬP LÁ SỐ TỬ VI',
            isLoading: chartState.isLoading,
            onPressed: _submit,
          ),
        ],
      ),
    );
  }

  Widget _buildBentoGrid(BuildContext context) {
    return Column(
      children: [
        // Row 1: Tarot & I Ching
        Row(
          children: [
            Expanded(
              child: _buildBentoCard(
                context: context,
                title: 'Đọc Bài Tarot',
                badge: 'TRỰC GIÁC AI',
                badgeColor: AppTheme.nebulaPurple,
                description: 'Rút 1 lá & 3 lá bài khai mở vận mệnh',
                icon: Icons.auto_awesome,
                iconGradient: const LinearGradient(
                  colors: [Color(0xFFB388FF), Color(0xFF7C4DFF)],
                ),
                onTap: () => context.push('/vision/input', extra: VisionKind.tarot),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildBentoCard(
                context: context,
                title: 'Kinh Dịch',
                badge: 'LỤC HÀO 3D',
                badgeColor: AppTheme.mysticalGold,
                description: 'Gieo 6 lần đồng xu cổ Âm Dương',
                icon: Icons.monetization_on,
                iconGradient: CelestialGradients.imperialGold,
                onTap: () => context.push('/iching'),
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        // Row 2: Thần Số Học Pythagoras (Featured Horizontal Bento Card)
        _buildBentoCard(
          context: context,
          title: 'Thần Số Học Pythagoras',
          badge: '4 CHỈ SỐ CỐT LÕI',
          badgeColor: AppTheme.nebulaCyan,
          description: 'Khám phá Đường Đời, Sứ Mệnh, Linh Hồn và Nhân Cách theo Pythagoras',
          icon: Icons.calculate,
          iconGradient: const LinearGradient(
            colors: [Color(0xFF00E5FF), Color(0xFF00B0FF)],
          ),
          onTap: () => context.push('/numerology'),
          isHorizontal: true,
        ),

        const SizedBox(height: 12),

        // Row 3: AI Vision (Tướng Mặt & Chỉ Tay)
        Row(
          children: [
            Expanded(
              child: _buildBentoCard(
                context: context,
                title: 'Tướng Mặt AI',
                badge: 'VISION SCAN',
                badgeColor: AppTheme.nebulaPink,
                description: 'Phân tích ngũ quan & thần thái khuôn mặt',
                icon: Icons.face,
                iconGradient: const LinearGradient(
                  colors: [Color(0xFFFF4081), Color(0xFFE040FB)],
                ),
                onTap: () => context.push('/vision/input', extra: VisionKind.face),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildBentoCard(
                context: context,
                title: 'Xem Chỉ Tay',
                badge: 'BIOMETRIC',
                badgeColor: const Color(0xFF00E676),
                description: 'Quét đường Sinh Đạo, Trí Đạo, Tâm Đạo',
                icon: Icons.pan_tool,
                iconGradient: const LinearGradient(
                  colors: [Color(0xFF69F0AE), Color(0xFF00E676)],
                ),
                onTap: () => context.push('/vision/input', extra: VisionKind.palm),
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        // Row 4: Wallet History & Records
        _buildBentoCard(
          context: context,
          title: 'Lịch Sử Giao Dịch & Ví XU',
          badge: 'WALLET LOGS',
          badgeColor: AppTheme.goldBright,
          description: 'Xem lại biến động số dư, nạp XU VietQR và lịch sử tạo lá số',
          icon: Icons.history_edu,
          iconGradient: CelestialGradients.imperialGold,
          onTap: () => context.push('/wallet/history'),
          isHorizontal: true,
        ),
      ],
    );
  }

  Widget _buildBentoCard({
    required BuildContext context,
    required String title,
    required String badge,
    required Color badgeColor,
    required String description,
    required IconData icon,
    required Gradient iconGradient,
    required VoidCallback onTap,
    bool isHorizontal = false,
  }) {
    return GlassPanel(
      padding: const EdgeInsets.all(16),
      borderRadius: BorderRadius.circular(18),
      borderGradient: CelestialGradients.starlightBorder,
      onTap: onTap,
      child: isHorizontal
          ? Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    gradient: iconGradient,
                    boxShadow: [
                      BoxShadow(
                        color: badgeColor.withValues(alpha: 0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(icon, color: const Color(0xFF0D0B18), size: 26),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              title,
                              style: const TextStyle(
                                color: AppTheme.mysticalText,
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              color: badgeColor.withValues(alpha: 0.15),
                              border: Border.all(
                                color: badgeColor.withValues(alpha: 0.35),
                                width: 0.8,
                              ),
                            ),
                            child: Text(
                              badge,
                              style: TextStyle(
                                color: badgeColor,
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppTheme.mysticalTextSecondary,
                          fontSize: 12,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios,
                  size: 14,
                  color: AppTheme.mysticalTextSecondary,
                ),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        gradient: iconGradient,
                        boxShadow: [
                          BoxShadow(
                            color: badgeColor.withValues(alpha: 0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Icon(icon, color: const Color(0xFF0D0B18), size: 22),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        color: badgeColor.withValues(alpha: 0.15),
                        border: Border.all(
                          color: badgeColor.withValues(alpha: 0.35),
                          width: 0.8,
                        ),
                      ),
                      child: Text(
                        badge,
                        style: TextStyle(
                          color: badgeColor,
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.6,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  title,
                  style: const TextStyle(
                    color: AppTheme.mysticalText,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppTheme.mysticalTextSecondary,
                    fontSize: 11,
                    height: 1.3,
                  ),
                ),
              ],
            ),
    );
  }
}

