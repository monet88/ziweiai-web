import 'dart:math';
import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import '../providers/wallet_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../ui/animated_background.dart';
import '../../../ui/glass_panel.dart';

class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen> {
  Offerings? _offerings;
  bool _isLoading = true;
  bool _isPurchasing = false;
  late ConfettiController _confettiController;

  @override
  void initState() {
    super.initState();
    _fetchOfferings();
    _confettiController = ConfettiController(duration: const Duration(seconds: 3));
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  Future<void> _fetchOfferings() async {
    try {
      final offerings = await Purchases.getOfferings();
      if (mounted) {
        setState(() {
          _offerings = offerings;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleRestorePurchases() async {
    if (_isPurchasing) return;
    HapticFeedback.mediumImpact();
    setState(() {
      _isPurchasing = true;
    });

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
        setState(() {
          _isPurchasing = false;
        });
      }
    }
  }

  Future<void> _handlePurchase(Package package) async {
    if (_isPurchasing) return;
    HapticFeedback.mediumImpact();
    setState(() {
      _isPurchasing = true;
    });

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
        setState(() {
          _isPurchasing = false;
        });
      }
    }
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
    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient (Space theme) -> AnimatedBackground
          const Positioned.fill(
            child: AnimatedBackground(child: SizedBox.shrink()),
          ),
          
          // Custom Header
          SafeArea(
            bottom: false,
            child: Column(
              children: [
                // AppBar actions
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios_new, color: AppTheme.goldBright),
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          context.pop();
                        },
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.history, color: AppTheme.mysticalGold),
                            onPressed: () {
                              HapticFeedback.lightImpact();
                              context.push('/wallet/history');
                            },
                            tooltip: 'Lịch sử giao dịch',
                          ),
                          TextButton.icon(
                            onPressed: _handleRestorePurchases,
                            icon: const Icon(Icons.restore, color: AppTheme.mysticalTextSecondary, size: 18),
                            label: const Text('Khôi phục', style: TextStyle(color: AppTheme.mysticalTextSecondary)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Balance Display
                Expanded(
                  flex: 3,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'SỐ DƯ XU CỦA BẠN',
                        style: GoogleFonts.cinzel(
                          color: AppTheme.mysticalTextSecondary,
                          fontSize: 13,
                          letterSpacing: 2.0,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Consumer(
                        builder: (context, ref, child) {
                          final balanceAsyncValue = ref.watch(walletBalanceProvider);
                          
                          return balanceAsyncValue.when(
                            data: (balance) => Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '$balance',
                                  style: GoogleFonts.cinzel(
                                    color: AppTheme.goldBright,
                                    fontSize: 64,
                                    fontWeight: FontWeight.w900,
                                    height: 1.0,
                                    shadows: CelestialShadows.goldGlow,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 8.0),
                                  child: Text(
                                    'XU',
                                    style: GoogleFonts.cinzel(
                                      color: AppTheme.goldBright,
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            loading: () => const CircularProgressIndicator(color: AppTheme.goldBright),
                            error: (err, stack) => const Text(
                              'Lỗi tải số dư',
                              style: TextStyle(color: Colors.redAccent, fontSize: 16),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                
                // Glassmorphism Bottom Sheet
                Expanded(
                  flex: 7,
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                    child: GlassPanel(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                      borderGradient: CelestialGradients.goldBorder,
                      child: _buildPackagesList(),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Purchasing Overlay
          if (_isPurchasing)
            Container(
              color: Colors.black.withValues(alpha: 0.6),
              child: const Center(
                child: CircularProgressIndicator(color: AppTheme.goldBright),
              ),
            ),
            
          // Confetti Overlay
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirection: pi / 2, // fall downwards
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
              createParticlePath: drawCoin,
            ),
          ),
        ],
      ),
    );
  }

  Path drawCoin(Size size) {
    final path = Path();
    path.addOval(Rect.fromCircle(center: Offset.zero, radius: 10));
    return path;
  }

  Widget _buildPackagesList() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.goldBright));
    }
    
    if (_offerings == null || _offerings!.current == null || _offerings!.current!.availablePackages.isEmpty) {
      return const Center(
        child: Text(
          'Hiện tại chưa có gói XU nào khả dụng.',
          style: TextStyle(color: AppTheme.mysticalTextSecondary),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Text(
              'CHỌN GÓI NẠP HOÀNG GIA',
              style: GoogleFonts.cinzel(
                color: AppTheme.goldBright,
                fontSize: 16,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.5,
              ),
            ),
          ),
          const SizedBox(height: 20),
          ..._offerings!.current!.availablePackages.map((package) {
            int xuDisplay = 0;
            if (package.storeProduct.identifier.contains('100')) {
              xuDisplay = 100;
            } else if (package.storeProduct.identifier.contains('500')) {
              xuDisplay = 500;
            } else if (package.storeProduct.identifier.contains('2000')) {
              xuDisplay = 2000;
            } else {
              // fallback extraction
              final match = RegExp(r'\d+').firstMatch(package.storeProduct.identifier);
              if (match != null) {
                xuDisplay = int.parse(match.group(0)!);
              }
            }

            final isPopular = package.storeProduct.identifier.contains('popular');

            return Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: _buildPremiumCard(
                package: package,
                xu: xuDisplay,
                isPopular: isPopular,
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildPremiumCard({
    required Package package,
    required int xu,
    required bool isPopular,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: isPopular ? CelestialShadows.goldGlow : [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: Material(
        color: isPopular ? AppTheme.cosmosElevated : AppTheme.cosmosSurface.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(20),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => _handlePurchase(package),
          splashColor: AppTheme.mysticalGold.withValues(alpha: 0.3),
          highlightColor: Colors.white.withValues(alpha: 0.05),
          child: Container(
            padding: const EdgeInsets.all(18.0),
            decoration: BoxDecoration(
              border: Border.all(
                color: isPopular ? AppTheme.goldBright : AppTheme.mysticalGold.withValues(alpha: 0.25),
                width: isPopular ? 1.8 : 1.0,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                // Coin Icon
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    gradient: isPopular ? CelestialGradients.imperialGold : null,
                    color: isPopular ? null : AppTheme.cosmosDark,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppTheme.goldBright,
                      width: 1.5,
                    ),
                    boxShadow: isPopular ? CelestialShadows.goldGlow : null,
                  ),
                  child: Center(
                    child: Icon(
                      Icons.stars,
                      color: isPopular ? const Color(0xFF141026) : AppTheme.goldBright,
                      size: 28,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                
                // Package Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              package.storeProduct.title.split('(').first.trim(),
                              style: const TextStyle(
                                color: AppTheme.mysticalText,
                                fontWeight: FontWeight.bold,
                                fontSize: 17,
                              ),
                            ),
                          ),
                          if (isPopular)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                gradient: CelestialGradients.imperialGold,
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: CelestialShadows.goldGlow,
                              ),
                              child: const Text(
                                'PHỔ BIẾN NHẤT',
                                style: TextStyle(
                                  color: Color(0xFF141026),
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        xu > 0 ? 'Nhận ngay +$xu XU' : 'Gói nạp XU',
                        style: const TextStyle(
                          color: AppTheme.mysticalTextSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Price
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: isPopular ? CelestialGradients.imperialGold : null,
                    color: isPopular ? null : AppTheme.cosmosElevated,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isPopular ? Colors.transparent : AppTheme.mysticalGold.withValues(alpha: 0.3),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    package.storeProduct.priceString,
                    style: TextStyle(
                      color: isPopular ? const Color(0xFF141026) : AppTheme.goldBright,
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
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
