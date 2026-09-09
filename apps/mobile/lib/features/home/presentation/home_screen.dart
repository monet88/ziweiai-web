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
import '../../subscription/providers/subscription_provider.dart';
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

    final isPro = ref.watch(isProUserProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      extendBody: true,
      appBar: AppBar(
        backgroundColor: AppTheme.cosmosDark.withValues(alpha: 0.85),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Imperial Seal Khâm Thiên Giám Ngự Triện
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                gradient: CelestialGradients.cinnabarImperial,
                border: Border.all(color: AppTheme.mysticalGold, width: 1),
                boxShadow: CelestialShadows.cinnabarGlow,
              ),
              child: const Icon(
                Icons.auto_awesome,
                size: 14,
                color: AppTheme.goldBright,
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'ViOS · KHÂM THIÊN GIÁM',
                  style: GoogleFonts.cinzel(
                    color: AppTheme.goldBright,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
                Text(
                  'Hoàng Gia Thuật Số · AI Triều Đình',
                  style: TextStyle(
                    color: AppTheme.mysticalTextSecondary.withValues(alpha: 0.8),
                    fontSize: 9,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // VIP Pro Pill
          if (isPro)
            GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                ref.read(subscriptionProvider.notifier).presentCustomerCenter();
              },
              child: Container(
                constraints: const BoxConstraints(minHeight: AppTheme.touchTargetMin),
                alignment: Alignment.center,
                margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: CelestialGradients.imperialGold,
                  boxShadow: CelestialShadows.goldGlow,
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.workspace_premium, size: 13, color: Color(0xFF141026)),
                    SizedBox(width: 3),
                    Text(
                      'VIP PRO',
                      style: TextStyle(
                        color: Color(0xFF141026),
                        fontWeight: FontWeight.w900,
                        fontSize: 10,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Wallet Balance Pill with Quick Top-up Button (Touch Target >= 48dp)
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              context.push('/wallet');
            },
            child: Container(
              constraints: const BoxConstraints(minHeight: AppTheme.touchTargetMin),
              margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                gradient: LinearGradient(
                  colors: [
                    AppTheme.mysticalGold.withValues(alpha: 0.22),
                    AppTheme.nebulaPurple.withValues(alpha: 0.18),
                  ],
                ),
                border: Border.all(
                  color: AppTheme.mysticalGold.withValues(alpha: 0.5),
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
                  const SizedBox(width: 4),
                  // Plus Top-Up icon
                  Container(
                    padding: const EdgeInsets.all(2),
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppTheme.goldBright,
                    ),
                    child: const Icon(
                      Icons.add,
                      size: 10,
                      color: Color(0xFF141026),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Profile Button with 48dp Touch Target
          IconButton(
            tooltip: 'Hồ sơ cá nhân',
            icon: Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: user != null && !user.isAnonymous
                      ? AppTheme.goldBright
                      : AppTheme.mysticalGold.withValues(alpha: 0.5),
                  width: 1.2,
                ),
              ),
              child: Icon(
                user != null && !user.isAnonymous
                    ? Icons.person
                    : Icons.person_outline,
                color: user != null && !user.isAnonymous
                    ? AppTheme.goldBright
                    : AppTheme.mysticalTextSecondary,
                size: 18,
              ),
            ),
            onPressed: () {
              HapticFeedback.lightImpact();
              context.push('/profile');
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: AnimatedBackground(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16.0, 52.0, 16.0, 96.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Thẻ Bản Mệnh Cung Đình (Greeting & Lunar Status)
              _buildGreetingCard(context, user)
                  .animate()
                  .fade(duration: 400.ms)
                  .slideY(begin: -0.1, end: 0),

              const SizedBox(height: 8),

              // 2. Hero Bento Card: Tử Vi Đẩu Số Quick-Form (Core Product Action)
              _buildZiweiHeroCard(context, chartState)
                  .animate()
                  .fade(duration: 450.ms, delay: 60.ms)
                  .scaleXY(begin: 0.98, end: 1.0),

              const SizedBox(height: 16),

              // 3. Hero Banner Vận Khí Năm 2026 Bính Ngọ (Stitch Spec)
              _buildAnnualForecastBanner(context)
                  .animate()
                  .fade(duration: 500.ms, delay: 120.ms)
                  .slideY(begin: -0.05, end: 0),

              const SizedBox(height: 20),

              // 4. Widget Lịch Vạn Niên Hoàng Đạo (Daily Almanac & Tiết Khí)
              _buildDailyAlmanacCard(context)
                  .animate()
                  .fade(duration: 500.ms, delay: 180.ms),

              const SizedBox(height: 20),

              // 5. Bento Section Header
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
                    'BENTO GRID THUẬT SỐ HOÀNG GIA',
                    style: GoogleFonts.cinzel(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.goldBright,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ).animate().fade(duration: 350.ms, delay: 220.ms),

              const SizedBox(height: 10),

              // 6. Bento Grid AI Mystical Tools
              _buildBentoGrid(context)
                  .animate()
                  .fade(duration: 500.ms, delay: 250.ms),
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

  Widget _buildGreetingCard(BuildContext context, dynamic user) {
    final hasUser = user != null && !user.isAnonymous;
    final userName = hasUser && user.email != null
        ? user.email!.split('@').first
        : 'Quý Thân Chủ';

    return GlassPanel(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      borderRadius: BorderRadius.circular(16),
      borderGradient: CelestialGradients.goldBorder,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.etherealJade,
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.etherealJade,
                            blurRadius: 5,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'BẢN MỆNH CUNG ĐÌNH',
                      style: GoogleFonts.cinzel(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.goldBright,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(5),
                        color: AppTheme.nephriteJade.withValues(alpha: 0.35),
                        border: Border.all(color: AppTheme.etherealJade, width: 0.8),
                      ),
                      child: const Text(
                        'ĐẠI CÁT',
                        style: TextStyle(
                          color: AppTheme.goldBright,
                          fontSize: 8,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  'Kính chào $userName · Mệnh Kiếm Phong Kim',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.mysticalText,
                    letterSpacing: -0.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: CelestialGradients.imperialGold,
              boxShadow: CelestialShadows.goldGlow,
            ),
            child: const Icon(
              Icons.brightness_medium,
              size: 18,
              color: Color(0xFF141026),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnnualForecastBanner(BuildContext context) {
    return GlassPanel(
      padding: const EdgeInsets.all(16),
      borderRadius: BorderRadius.circular(22),
      borderGradient: CelestialGradients.goldBorder,
      shadows: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.4),
          blurRadius: 20,
          offset: const Offset(0, 8),
        ),
        BoxShadow(
          color: AppTheme.cinnabarCrimson.withValues(alpha: 0.25),
          blurRadius: 24,
          spreadRadius: -4,
        ),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      gradient: CelestialGradients.cinnabarImperial,
                      boxShadow: CelestialShadows.cinnabarGlow,
                    ),
                    child: const Icon(
                      Icons.flare,
                      size: 14,
                      color: AppTheme.goldBright,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'VẬN KHÍ LƯU NIÊN 2026 BÍNH NGỌ',
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
                  borderRadius: BorderRadius.circular(8),
                  color: AppTheme.cinnabarCrimson.withValues(alpha: 0.2),
                  border: Border.all(
                    color: AppTheme.cinnabarLight.withValues(alpha: 0.6),
                    width: 0.8,
                  ),
                ),
                child: const Text(
                  'NGỰ PHÊ',
                  style: TextStyle(
                    color: AppTheme.goldBright,
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'Thiên can Bính Hỏa hợp Tân Kim hóa Thủy · Địa chi Ngọ Hỏa vượng tướng.',
            style: TextStyle(
              color: AppTheme.mysticalTextSecondary.withValues(alpha: 0.9),
              fontSize: 12,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          // 3 Mini status tags
          Row(
            children: [
              _buildMiniTag('Thái Tuế Tọa Ngọ', AppTheme.cinnabarCrimson),
              const SizedBox(width: 6),
              _buildMiniTag('Thiên Lộc Vượng Cung', AppTheme.mysticalGold),
              const SizedBox(width: 6),
              _buildMiniTag('Lục Hợp Mùi', AppTheme.nephriteJade),
            ],
          ),
          const SizedBox(height: 14),
          // 48dp CTA Button
          SizedBox(
            width: double.infinity,
            height: AppTheme.touchTargetMin,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.mysticalGold,
                foregroundColor: const Color(0xFF141026),
                elevation: 4,
                shadowColor: AppTheme.mysticalGold.withValues(alpha: 0.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16),
              ),
              onPressed: () {
                HapticFeedback.mediumImpact();
                // Navigate to annual horoscope or charts
                context.push('/wallet');
              },
              icon: const Icon(Icons.workspace_premium, size: 18),
              label: const Text(
                'Xem Vận Trình 2026 👑',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                  letterSpacing: 0.8,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniTag(String label, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 4),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: color.withValues(alpha: 0.15),
          border: Border.all(
            color: color.withValues(alpha: 0.4),
            width: 0.8,
          ),
        ),
        child: Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: AppTheme.mysticalText,
            fontSize: 10,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _buildDailyAlmanacCard(BuildContext context) {
    return GlassPanel(
      padding: const EdgeInsets.all(16),
      borderRadius: BorderRadius.circular(20),
      borderGradient: CelestialGradients.goldBorder,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
                      Icons.calendar_month,
                      size: 14,
                      color: AppTheme.goldBright,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'LỊCH VẠN NIÊN HOÀNG ĐẠO',
                    style: GoogleFonts.cinzel(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.goldBright,
                      letterSpacing: 1.0,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(6),
                  color: AppTheme.nephriteJade.withValues(alpha: 0.25),
                  border: Border.all(color: AppTheme.etherealJade, width: 0.8),
                ),
                child: const Text(
                  'TRỰC THÀNH (ĐẠI CÁT)',
                  style: TextStyle(
                    color: AppTheme.goldBright,
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Can Chi & Lunar Date Info
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: AppTheme.cosmosElevated.withValues(alpha: 0.5),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildAlmanacCol('DƯƠNG LỊCH', '09/09/2026'),
                Container(width: 1, height: 28, color: AppTheme.glassBorder),
                _buildAlmanacCol('ÂM LỊCH', '29/07 BÍNH NGỌ'),
                Container(width: 1, height: 28, color: AppTheme.glassBorder),
                _buildAlmanacCol('HOÀNG ĐẠO', 'GIÁP TÝ NHẬT'),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Auspicious (Nên làm) vs Taboo (Kiêng cữ)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: AppTheme.nephriteJade.withValues(alpha: 0.12),
                    border: Border.all(
                      color: AppTheme.nephriteJade.withValues(alpha: 0.35),
                      width: 0.8,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.check_circle_outline, size: 14, color: AppTheme.etherealJade),
                          SizedBox(width: 5),
                          Text(
                            'VIỆC NÊN LÀM',
                            style: TextStyle(
                              color: AppTheme.etherealJade,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        '• Cầu tài lộc, giao dịch\n• Khai trương, xuất hành\n• Tế tự, cầu an gia đạo',
                        style: TextStyle(
                          color: AppTheme.mysticalText,
                          fontSize: 11,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: AppTheme.cinnabarCrimson.withValues(alpha: 0.12),
                    border: Border.all(
                      color: AppTheme.cinnabarCrimson.withValues(alpha: 0.35),
                      width: 0.8,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.highlight_off, size: 14, color: AppTheme.cinnabarLight),
                          SizedBox(width: 5),
                          Text(
                            'VIỆC KIÊNG CỮ',
                            style: TextStyle(
                              color: AppTheme.cinnabarLight,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        '• Động thổ, khởi công\n• Kiện tụng, tranh chấp\n• An táng, di dời mồ mả',
                        style: TextStyle(
                          color: AppTheme.mysticalText,
                          fontSize: 11,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Giờ Hoàng Đạo row
          Text(
            'Giờ Hoàng Đạo: Tý (23-1), Dần (3-5), Mão (5-7), Ngọ (11-13), Mùi (13-15), Dậu (17-19)',
            style: TextStyle(
              color: AppTheme.mysticalTextSecondary.withValues(alpha: 0.85),
              fontSize: 10,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlmanacCol(String title, String value) {
    return Column(
      children: [
        Text(
          title,
          style: const TextStyle(
            color: AppTheme.mysticalTextSecondary,
            fontSize: 9,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          value,
          style: const TextStyle(
            color: AppTheme.goldBright,
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  Widget _buildZiweiHeroCard(BuildContext context, AsyncValue<ChartDetailResponse?> chartState) {
    return GlassPanel(
      padding: const EdgeInsets.all(14),
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

          const SizedBox(height: 10),

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

          const SizedBox(height: 8),

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
                  onChanged: (val) {
                    if (val != null) setState(() => _gender = val);
                  },
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Calendar Selection Row
          PremiumDropdown<String>(
            value: _calendar,
            labelText: 'Loại lịch',
            items: const [
              DropdownMenuItem(value: 'gregorian', child: Text('Dương lịch')),
              DropdownMenuItem(value: 'lunar', child: Text('Âm lịch')),
            ],
            onChanged: (val) {
              if (val != null) setState(() => _calendar = val);
            },
          ),

          const SizedBox(height: 6),

          // Submit Button
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
        // Row 1: Core Services 2x2 Hoàng Gia (Tử Vi & Bát Tự)
        Row(
          children: [
            Expanded(
              child: _buildBentoCard(
                context: context,
                title: 'Tử Vi Đẩu Số',
                badge: '108 TINH DIỆU',
                badgeColor: AppTheme.goldBright,
                description: 'Lập tinh bàn 12 cung & hồ sơ 19 trang',
                icon: Icons.auto_awesome,
                iconGradient: CelestialGradients.imperialGold,
                onTap: () {
                  HapticFeedback.lightImpact();
                  // Tap scrolls or focuses quick-form
                  _submit();
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildBentoCard(
                context: context,
                title: 'Bát Tự Tứ Trụ',
                badge: 'DỤNG THẦN AI',
                badgeColor: AppTheme.nebulaPurple,
                description: 'Định Dụng Thần, Hỷ Thần & 8 Đại Vận',
                icon: Icons.history_edu,
                iconGradient: const LinearGradient(
                  colors: [Color(0xFFB388FF), Color(0xFF7C4DFF)],
                ),
                onTap: () {
                  HapticFeedback.lightImpact();
                  context.push('/bazi');
                },
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        // Row 2: Lục Hào 3D & Linh Xăm Quan Thánh
        Row(
          children: [
            Expanded(
              child: _buildBentoCard(
                context: context,
                title: 'Lục Hào Chiêm Bốc',
                badge: '3 ĐỒNG XU 3D',
                badgeColor: AppTheme.mysticalGold,
                description: 'Gieo quẻ 3 đồng Càn Long cổ pháp',
                icon: Icons.monetization_on,
                iconGradient: CelestialGradients.imperialGold,
                onTap: () => context.push('/iching'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildBentoCard(
                context: context,
                title: 'Xăm Quan Thánh',
                badge: '100 QUẺ THÁNH',
                badgeColor: AppTheme.cinnabarLight,
                description: 'Lắc ống xăm linh thiêng & Thoại bôi',
                icon: Icons.flare,
                iconGradient: CelestialGradients.cinnabarImperial,
                onTap: () => context.push('/stick'),
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        // Row 3: Thần Số Học Pythagoras (Featured Horizontal Bento Card)
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

        // Row 4: AI Vision (Tướng Mặt & Chỉ Tay)
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
                badgeColor: AppTheme.etherealJade,
                description: 'Quét đường Sinh Đạo, Trí Đạo, Tâm Đạo',
                icon: Icons.pan_tool,
                iconGradient: CelestialGradients.jadeAuspicious,
                onTap: () => context.push('/vision/input', extra: VisionKind.palm),
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        // Row 5: Wallet History & Records
        _buildBentoCard(
          context: context,
          title: 'Lịch Sử Giao Dịch & Ví XU',
          badge: 'WALLET LOGS',
          badgeColor: AppTheme.goldBright,
          description: 'Xem lại biến động số dư, nạp XU VietQR và lịch sử tạo lá số',
          icon: Icons.account_balance_wallet,
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
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: AppTheme.touchTargetMin),
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
                mainAxisAlignment: MainAxisAlignment.center,
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
      ),
    );
  }
}

