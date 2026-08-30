import 'dart:math';
import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../providers/wallet_provider.dart';
import '../../subscription/providers/subscription_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../ui/animated_background.dart';
import '../../../ui/glass_panel.dart';
import '../../../core/services/admob_service.dart';
import '../../../core/api/api_provider.dart';

class WalletPackageItem {
  final int xu;
  final int price;
  final String label;
  final String? badge;
  final String desc;

  const WalletPackageItem({
    required this.xu,
    required this.price,
    required this.label,
    this.badge,
    required this.desc,
  });
}

class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen>
    with SingleTickerProviderStateMixin {
  Offerings? _offerings;
  bool _isLoadingOfferings = true;
  bool _isPurchasing = false;
  bool _isWatchingAd = false;
  late ConfettiController _confettiController;
  late TabController _tabController;


  static const List<WalletPackageItem> _vietQrPackages = [
    WalletPackageItem(
      xu: 20,
      price: 20000,
      label: 'Gói Cơ Bản',
      desc: '4 lượt luận giải AI hoặc gieo quẻ',
    ),
    WalletPackageItem(
      xu: 50,
      price: 50000,
      label: 'Gói Phổ Biến',
      badge: 'BÁN CHẠY',
      desc: '10 lượt luận giải chuyên sâu',
    ),
    WalletPackageItem(
      xu: 120,
      price: 100000,
      label: 'Gói Nâng Cao',
      badge: '+20% XU',
      desc: 'Tặng thêm 20 XU thưởng',
    ),
    WalletPackageItem(
      xu: 600,
      price: 500000,
      label: 'Gói VIP Thưởng Lớn',
      badge: '+20% XU',
      desc: 'Tặng thêm 100 XU thưởng',
    ),
  ];

  late WalletPackageItem _selectedVietQrPackage;
  static const String _bankAccountNo = '0123456789';
  static const String _bankName = 'MBBank';

  @override
  void initState() {
    super.initState();
    _selectedVietQrPackage = _vietQrPackages[1]; // default 50 XU
    _confettiController = ConfettiController(duration: const Duration(seconds: 3));
    _tabController = TabController(length: 2, vsync: this);
    _fetchOfferings();
  }

  @override
  void dispose() {
    _confettiController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchOfferings() async {
    try {
      final offerings = await Purchases.getOfferings();
      if (mounted) {
        setState(() {
          _offerings = offerings;
          _isLoadingOfferings = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingOfferings = false;
        });
      }
    }
  }

  Future<void> _handleRestorePurchases() async {
    if (_isPurchasing) return;
    HapticFeedback.mediumImpact();
    setState(() => _isPurchasing = true);

    try {
      await Purchases.restorePurchases();
      if (mounted) {
        ref.invalidate(walletBalanceProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Khôi phục thanh toán thành công!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể khôi phục thanh toán.')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isPurchasing = false);
      }
    }
  }

  Future<void> _handleWatchAdReward() async {
    if (_isWatchingAd) return;
    HapticFeedback.mediumImpact();
    setState(() => _isWatchingAd = true);

    try {
      final admobService = ref.read(admobServiceProvider);
      final apiClient = ref.read(apiClientProvider);

      await admobService.showRewardedAd(
        onUserEarnedReward: (reward) async {
          debugPrint('[WalletScreen] User watched ad, claiming backend reward...');
          try {
            final response = await apiClient.claimAdReward();
            if (mounted) {
              ref.invalidate(walletBalanceProvider);
              _confettiController.play();
              HapticFeedback.heavyImpact();
              final addedXu = response['xu_added'] ?? 5;
              _showAdRewardSuccessDialog(addedXu);
            }
          } catch (apiErr) {
            debugPrint('[WalletScreen] Failed to claim ad reward from backend: $apiErr');
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Không thể ghi nhận thưởng. Vui lòng kiểm tra kết nối mạng!'),
                  backgroundColor: Colors.redAccent,
                ),
              );
            }
          }
        },
        onAdDismissed: () {
          if (mounted) setState(() => _isWatchingAd = false);
        },
        onAdFailedToShow: (error) {
          if (mounted) {
            setState(() => _isWatchingAd = false);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Video quảng cáo chưa sẵn sàng. Vui lòng thử lại sau giây lát!'),
                backgroundColor: AppTheme.cosmosElevated,
              ),
            );
          }
        },
      );
    } catch (e) {
      if (mounted) {
        setState(() => _isWatchingAd = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải quảng cáo: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  void _showAdRewardSuccessDialog(int xu) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.cosmosSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AppTheme.goldBright, width: 1.5),
        ),
        title: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: CelestialGradients.imperialGold,
                boxShadow: CelestialShadows.goldGlow,
              ),
              child: const Icon(Icons.card_giftcard, color: Color(0xFF141026), size: 38),
            ),
            const SizedBox(height: 16),
            Text(
              'Nhận XU Thành Công!',
              textAlign: TextAlign.center,
              style: GoogleFonts.cinzel(
                color: AppTheme.goldBright,
                fontWeight: FontWeight.w800,
                fontSize: 20,
              ),
            ),
          ],
        ),
        content: Text(
          'Chúc mừng bạn đã hoàn thành video quảng cáo và nhận ngay +$xu XU miễn phí vào tài khoản!',
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 14, height: 1.5),
        ),
        actions: [
          Center(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: CelestialGradients.imperialGold,
                boxShadow: CelestialShadows.goldGlow,
              ),
              child: ElevatedButton(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  context.pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  foregroundColor: const Color(0xFF141026),
                  shadowColor: Colors.transparent,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Text(
                  'TUYỆT VỜI',
                  style: GoogleFonts.cinzel(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Future<void> _handlePurchase(Package package) async {

    if (_isPurchasing) return;
    HapticFeedback.mediumImpact();
    setState(() => _isPurchasing = true);

    try {
      await Purchases.purchase(PurchaseParams.package(package));
      if (mounted) {
        ref.invalidate(walletBalanceProvider);
        _confettiController.play();
        _showSuccessDialog();
      }
    } catch (e) {
      if (mounted) {
        final isUserCancelled =
            e.toString().contains('canceled') || e.toString().contains('cancelled');
        if (!isUserCancelled) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Đã xảy ra lỗi trong quá trình thanh toán.')),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() => _isPurchasing = false);
      }
    }
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã sao chép $label: $text'),
        backgroundColor: AppTheme.cosmosElevated,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.cosmosSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AppTheme.goldBright, width: 1.5),
        ),
        title: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: CelestialGradients.imperialGold,
                boxShadow: CelestialShadows.goldGlow,
              ),
              child: const Icon(Icons.stars, color: Color(0xFF141026), size: 40),
            ),
            const SizedBox(height: 16),
            Text(
              'Nạp XU Thành Công!',
              textAlign: TextAlign.center,
              style: GoogleFonts.cinzel(
                color: AppTheme.goldBright,
                fontWeight: FontWeight.w800,
                fontSize: 20,
              ),
            ),
          ],
        ),
        content: const Text(
          'Số XU của bạn đã được cộng ngay vào tài khoản.\nCảm ơn bạn đã đồng hành cùng Tử Vi Toàn Tập!',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 14, height: 1.5),
        ),
        actions: [
          Center(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: CelestialGradients.imperialGold,
                boxShadow: CelestialShadows.goldGlow,
              ),
              child: ElevatedButton(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  context.pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  foregroundColor: const Color(0xFF141026),
                  shadowColor: Colors.transparent,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Text(
                  'ĐÓNG',
                  style: GoogleFonts.cinzel(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final balanceAsync = ref.watch(walletBalanceProvider);
    final user = Supabase.instance.client.auth.currentUser;
    final shortUuid = user != null ? user.id.substring(0, 8).toUpperCase() : 'GUEST';
    final transferContent = 'TVTT $shortUuid';

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          const Positioned.fill(
            child: AnimatedBackground(child: SizedBox.shrink()),
          ),
          SafeArea(
            child: Column(
              children: [
                // Top Header Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios_new, color: AppTheme.goldBright),
                        onPressed: () => context.pop(),
                      ),
                      Text(
                        'VÍ THUẬT SỐ XU',
                        style: GoogleFonts.cinzel(
                          color: AppTheme.goldBright,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.history_edu, color: AppTheme.mysticalGold),
                        onPressed: () => context.push('/wallet/history'),
                        tooltip: 'Lịch sử giao dịch',
                      ),
                    ],
                  ),
                ),

                // Balance Display Hero
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12.0),
                  child: Column(
                    children: [
                      Text(
                        'SỐ DƯ HIỆN TẠI',
                        style: GoogleFonts.cinzel(
                          color: AppTheme.mysticalTextSecondary,
                          fontSize: 12,
                          letterSpacing: 2.0,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      balanceAsync.when(
                        data: (balance) => Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '$balance',
                              style: GoogleFonts.cinzel(
                                color: AppTheme.goldBright,
                                fontSize: 48,
                                fontWeight: FontWeight.w900,
                                height: 1.0,
                                shadows: CelestialShadows.goldGlow,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Padding(
                              padding: const EdgeInsets.only(bottom: 6.0),
                              child: Text(
                                'XU',
                                style: GoogleFonts.cinzel(
                                  color: AppTheme.goldBright,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                        loading: () => const SizedBox(
                          height: 36,
                          width: 36,
                          child: CircularProgressIndicator(color: AppTheme.goldBright, strokeWidth: 2),
                        ),
                        error: (error, stack) => const Text('0 XU', style: TextStyle(color: AppTheme.goldBright, fontSize: 32)),
                      ),
                    ],
                  ),
                ),

                // Tabs
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: AppTheme.cosmosElevated.withValues(alpha: 0.8),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.mysticalGold.withValues(alpha: 0.3), width: 1),
                  ),
                  child: TabBar(
                    controller: _tabController,
                    indicator: BoxDecoration(
                      gradient: CelestialGradients.imperialGold,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: CelestialShadows.goldGlow,
                    ),
                    labelColor: const Color(0xFF141026),
                    unselectedLabelColor: AppTheme.mysticalTextSecondary,
                    labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
                    tabs: const [
                      Tab(
                        icon: Icon(Icons.qr_code_2, size: 18),
                        text: 'Chuyển Khoản VietQR',
                      ),
                      Tab(
                        icon: Icon(Icons.shopping_bag_outlined, size: 18),
                        text: 'In-App Store / VIP',
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // Tab Views
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildVietQrTab(transferContent),
                      _buildInAppStoreTab(),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Purchasing Overlay
          if (_isPurchasing)
            Container(
              color: Colors.black.withValues(alpha: 0.7),
              child: const Center(
                child: CircularProgressIndicator(color: AppTheme.goldBright),
              ),
            ),

          // Confetti
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirection: pi / 2,
              maxBlastForce: 5,
              minBlastForce: 2,
              emissionFrequency: 0.05,
              numberOfParticles: 50,
              gravity: 0.2,
              colors: const [
                AppTheme.goldBright,
                AppTheme.mysticalGold,
                Color(0xFFFFDF00),
                Colors.white,
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRewardedAdBanner() {
    return Container(
      margin: const EdgeInsets.only(bottom: 18),
      child: GlassPanel(
        padding: const EdgeInsets.all(16),
        borderGradient: CelestialGradients.goldBorder,
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: CelestialGradients.imperialGold,
                boxShadow: CelestialShadows.goldGlow,
              ),
              child: const Icon(
                Icons.play_circle_fill_rounded,
                color: Color(0xFF141026),
                size: 26,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'XU THƯỞNG MIỄN PHÍ',
                        style: GoogleFonts.cinzel(
                          color: AppTheme.goldBright,
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.goldBright,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          '+5 XU',
                          style: TextStyle(
                            color: Color(0xFF141026),
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Xem video ngắn 15-30s nhận ngay 5 XU',
                    style: TextStyle(
                      color: AppTheme.mysticalTextSecondary,
                      fontSize: 12,
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            ElevatedButton(
              onPressed: _isWatchingAd ? null : _handleWatchAdReward,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.goldBright,
                foregroundColor: const Color(0xFF141026),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 2,
              ),
              child: _isWatchingAd
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Color(0xFF141026),
                      ),
                    )
                  : Text(
                      'XEM AD',
                      style: GoogleFonts.cinzel(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVietQrTab(String transferContent) {
    final qrUrl =
        'https://qr.sepay.vn/img?acc=$_bankAccountNo&bank=$_bankName&amount=${_selectedVietQrPackage.price}&des=$transferContent';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Rewarded Video Ad Banner
          _buildRewardedAdBanner(),

          // Select Package Chips
          Text(
            '1. CHỌN GÓI NẠP XU',
            style: GoogleFonts.cinzel(
              color: AppTheme.goldBright,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.0,
            ),
          ),

          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _vietQrPackages.map((pkg) {
              final isSelected = pkg == _selectedVietQrPackage;
              return GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _selectedVietQrPackage = pkg);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: isSelected ? CelestialGradients.imperialGold : null,
                    color: isSelected ? null : AppTheme.cosmosSurface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected ? Colors.transparent : AppTheme.mysticalGold.withValues(alpha: 0.3),
                      width: 1,
                    ),
                    boxShadow: isSelected ? CelestialShadows.goldGlow : null,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '+${pkg.xu} XU',
                            style: TextStyle(
                              color: isSelected ? const Color(0xFF141026) : AppTheme.goldBright,
                              fontWeight: FontWeight.w900,
                              fontSize: 14,
                            ),
                          ),
                          if (pkg.badge != null) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFF141026) : AppTheme.goldBright,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                pkg.badge!,
                                style: TextStyle(
                                  color: isSelected ? AppTheme.goldBright : const Color(0xFF141026),
                                  fontSize: 8,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${pkg.price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')}đ',
                        style: TextStyle(
                          color: isSelected ? const Color(0xFF141026).withValues(alpha: 0.8) : AppTheme.mysticalTextSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 20),

          // QR Code Card
          GlassPanel(
            padding: const EdgeInsets.all(18),
            borderGradient: CelestialGradients.goldBorder,
            child: Column(
              children: [
                Text(
                  '2. QUÉT MÃ VIETQR HOẶC CHUYỂN KHOẢN',
                  style: GoogleFonts.cinzel(
                    color: AppTheme.goldBright,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.0,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 14),

                // QR Image
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.4),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      qrUrl,
                      width: 180,
                      height: 180,
                      fit: BoxFit.contain,
                      loadingBuilder: (context, child, progress) {
                        if (progress == null) return child;
                        return const SizedBox(
                          width: 180,
                          height: 180,
                          child: Center(
                            child: CircularProgressIndicator(color: AppTheme.goldBright),
                          ),
                        );
                      },
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          width: 180,
                          height: 180,
                          color: Colors.grey.shade200,
                          child: const Center(
                            child: Text(
                              'Không thể tải QR\nVui lòng chuyển khoản theo thông tin bên dưới',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.black54, fontSize: 11),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),

                const SizedBox(height: 18),

                // Transfer Details with 1-Tap Copy
                _buildCopyRow('Ngân hàng', _bankName, _bankName),
                const Divider(color: Colors.white10, height: 16),
                _buildCopyRow('Số tài khoản', _bankAccountNo, 'Số tài khoản'),
                const Divider(color: Colors.white10, height: 16),
                _buildCopyRow(
                  'Số tiền',
                  '${_selectedVietQrPackage.price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')}đ',
                  'Số tiền',
                  copyValue: _selectedVietQrPackage.price.toString(),
                ),
                const Divider(color: Colors.white10, height: 16),
                _buildCopyRow('Nội dung CK', transferContent, 'Nội dung chuyển khoản', isHighlighted: true),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Auto-credit note
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.cosmosElevated.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.mysticalGold.withValues(alpha: 0.25)),
            ),
            child: const Row(
              children: [
                Icon(Icons.bolt, color: AppTheme.goldBright, size: 22),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Hệ thống SePay tự động quét giao dịch và cộng XU ngay lập tức sau 30-60 giây.',
                    style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 12, height: 1.3),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCopyRow(String label, String value, String copyLabel, {String? copyValue, bool isHighlighted = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 13),
        ),
        Row(
          children: [
            Text(
              value,
              style: TextStyle(
                color: isHighlighted ? AppTheme.goldBright : AppTheme.mysticalText,
                fontWeight: FontWeight.w800,
                fontSize: 14,
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => _copyToClipboard(copyValue ?? value, copyLabel),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.cosmosElevated,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.mysticalGold.withValues(alpha: 0.4), width: 0.8),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.copy, size: 12, color: AppTheme.goldBright),
                    SizedBox(width: 4),
                    Text('Copy', style: TextStyle(color: AppTheme.goldBright, fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildInAppStoreTab() {
    final isPro = ref.watch(isProUserProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Rewarded Video Ad Banner
          _buildRewardedAdBanner(),

          // VIP Pro Banner
          Container(
            padding: const EdgeInsets.all(18),

            decoration: BoxDecoration(
              gradient: CelestialGradients.imperialGold,
              borderRadius: BorderRadius.circular(20),
              boxShadow: CelestialShadows.goldGlow,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.workspace_premium, color: Color(0xFF141026), size: 28),
                        const SizedBox(width: 8),
                        Text(
                          'TỬ VI TOÀN TẬP PRO',
                          style: GoogleFonts.cinzel(
                            color: const Color(0xFF141026),
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isPro ? const Color(0xFF141026) : Colors.black.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        isPro ? 'ĐANG DÙNG' : 'VIP PRO',
                        style: TextStyle(
                          color: isPro ? AppTheme.goldBright : const Color(0xFF141026),
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Text(
                  'Mở khóa toàn bộ thuật số (Tướng Mặt, Chỉ Tay, Bát Tự, Tử Vi, Tarot 3D, Kinh Dịch) không giới hạn lượt xem.',
                  style: TextStyle(
                    color: Color(0xFF141026),
                    fontSize: 13,
                    height: 1.4,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () async {
                          HapticFeedback.mediumImpact();
                          await ref.read(subscriptionProvider.notifier).presentPaywall();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF141026),
                          foregroundColor: AppTheme.goldBright,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: Text(
                          isPro ? 'Xem Gói Đang Dùng' : 'Mở Khóa VIP PRO',
                          style: GoogleFonts.cinzel(fontSize: 13, fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: () async {
                        HapticFeedback.lightImpact();
                        await ref.read(subscriptionProvider.notifier).presentCustomerCenter();
                      },
                      icon: const Icon(Icons.settings_outlined, color: Color(0xFF141026)),
                      tooltip: 'Customer Center (Quản lý)',
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'GÓI IN-APP PURCHASE STORE',
                style: GoogleFonts.cinzel(
                  color: AppTheme.goldBright,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                ),
              ),
              TextButton.icon(
                onPressed: _handleRestorePurchases,
                icon: const Icon(Icons.restore, color: AppTheme.mysticalTextSecondary, size: 16),
                label: const Text('Khôi phục', style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 12)),
              ),
            ],
          ),

          const SizedBox(height: 10),

          if (_isLoadingOfferings)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: CircularProgressIndicator(color: AppTheme.goldBright),
              ),
            )
          else if (_offerings == null ||
              _offerings!.current == null ||
              _offerings!.current!.availablePackages.isEmpty)
            GlassPanel(
              padding: const EdgeInsets.all(20),
              borderGradient: CelestialGradients.starlightBorder,
              child: const Column(
                children: [
                  Icon(Icons.storefront_outlined, color: AppTheme.mysticalGold, size: 36),
                  SizedBox(height: 10),
                  Text(
                    'Gói In-App Store đang được cập nhật trên Google Play / App Store.\nBạn có thể nạp ngay qua tab VietQR Chuyển Khoản Ngân Hàng.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 13, height: 1.4),
                  ),
                ],
              ),
            )
          else
            ..._offerings!.current!.availablePackages.map((package) {
              int xuDisplay = 0;
              final id = package.storeProduct.identifier.toLowerCase();
              if (id.contains('100')) {
                xuDisplay = 100;
              } else if (id.contains('500')) {
                xuDisplay = 500;
              } else if (id.contains('2000')) {
                xuDisplay = 2000;
              } else {
                final match = RegExp(r'\d+').firstMatch(id);
                if (match != null) xuDisplay = int.parse(match.group(0)!);
              }

              final isPopular = id.contains('popular') || id.contains('500');

              return Padding(
                padding: const EdgeInsets.only(bottom: 14.0),
                child: _buildStorePackageCard(package, xuDisplay, isPopular),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildStorePackageCard(Package package, int xu, bool isPopular) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: isPopular ? CelestialShadows.goldGlow : null,
      ),
      child: Material(
        color: isPopular ? AppTheme.cosmosElevated : AppTheme.cosmosSurface,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: () => _handlePurchase(package),
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              border: Border.all(
                color: isPopular ? AppTheme.goldBright : AppTheme.mysticalGold.withValues(alpha: 0.25),
                width: isPopular ? 1.8 : 1.0,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: isPopular ? CelestialGradients.imperialGold : null,
                    color: isPopular ? null : AppTheme.cosmosDark,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppTheme.goldBright, width: 1.2),
                  ),
                  child: Center(
                    child: Icon(
                      Icons.stars,
                      color: isPopular ? const Color(0xFF141026) : AppTheme.goldBright,
                      size: 24,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        package.storeProduct.title.split('(').first.trim(),
                        style: const TextStyle(
                          color: AppTheme.mysticalText,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        xu > 0 ? 'Nhận ngay +$xu XU' : 'Gói nạp XU',
                        style: const TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    gradient: isPopular ? CelestialGradients.imperialGold : null,
                    color: isPopular ? null : AppTheme.cosmosElevated,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    package.storeProduct.priceString,
                    style: TextStyle(
                      color: isPopular ? const Color(0xFF141026) : AppTheme.goldBright,
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
