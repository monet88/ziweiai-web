import 'dart:math';
import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import '../providers/wallet_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../ui/animated_background.dart';
import '../../../ui/premium_button.dart';

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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Column(
          children: [
            Icon(Icons.stars, color: Colors.amber, size: 48),
            SizedBox(height: 16),
            Text('Thanh toán thành công!', textAlign: TextAlign.center),
          ],
        ),
        content: const Text(
          'Số XU của bạn đã được cộng vào tài khoản.\nCảm ơn bạn đã đồng hành cùng Tử Vi Toàn Tập!',
          textAlign: TextAlign.center,
        ),
        actions: [
          Center(
            child: PremiumButton(
              label: 'Đóng',
              isPrimary: true,
              onPressed: () => context.pop(),
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
                        icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
                        onPressed: () => context.pop(),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.history, color: Colors.white70),
                            onPressed: () => context.push('/wallet/history'),
                            tooltip: 'Lịch sử giao dịch',
                          ),
                          TextButton.icon(
                            onPressed: _handleRestorePurchases,
                            icon: const Icon(Icons.restore, color: Colors.white70),
                            label: const Text('Khôi phục', style: TextStyle(color: Colors.white70)),
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
                      const Text(
                        'TÀI KHOẢN CỦA BẠN',
                        style: TextStyle(
                          color: Colors.white54,
                          fontSize: 14,
                          letterSpacing: 2.0,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 16),
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
                                  style: const TextStyle(
                                    color: Color(0xFFFFD700), // Gold
                                    fontSize: 64,
                                    fontWeight: FontWeight.w800,
                                    height: 1.0,
                                    shadows: [
                                      Shadow(
                                        color: Color(0x66FFD700),
                                        blurRadius: 20,
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Padding(
                                  padding: EdgeInsets.only(bottom: 8.0),
                                  child: Text(
                                    'XU',
                                    style: TextStyle(
                                      color: Color(0xFFFFD700),
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            loading: () => const CircularProgressIndicator(color: Color(0xFFFFD700)),
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
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppTheme.mysticalElevated,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                        border: Border.all(
                          color: AppTheme.glassBorder,
                          width: 1,
                        ),
                      ),
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
              color: Colors.black.withValues(alpha: 0.5),
              child: const Center(
                child: CircularProgressIndicator(color: Color(0xFFFFD700)),
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
                Color(0xFFFFD700), // Gold
                Color(0xFFFFDF00), // Golden yellow
                Color(0xFFD4AF37), // Metallic gold
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
      return const Center(child: CircularProgressIndicator(color: Colors.white));
    }
    
    if (_offerings == null || _offerings!.current == null || _offerings!.current!.availablePackages.isEmpty) {
      return const Center(
        child: Text(
          'Hiện tại chưa có gói XU nào khả dụng.',
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Center(
            child: Text(
              'CHỌN GÓI NẠP',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.5,
              ),
            ),
          ),
          const SizedBox(height: 24),
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
        boxShadow: isPopular
            ? [
                BoxShadow(
                  color: const Color(0xFFFFD700).withValues(alpha: 0.3),
                  blurRadius: 15,
                  spreadRadius: 2,
                )
              ]
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                )
              ],
      ),
      child: Material(
        color: isPopular ? Colors.white.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => _handlePurchase(package),
          splashColor: const Color(0xFFFFD700).withValues(alpha: 0.3),
          highlightColor: Colors.white.withValues(alpha: 0.1),
          child: Container(
            padding: const EdgeInsets.all(20.0),
            decoration: BoxDecoration(
              border: Border.all(
                color: isPopular ? const Color(0xFFFFD700) : Colors.white.withValues(alpha: 0.1),
                width: isPopular ? 2.0 : 1.0,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                // Coin Icon
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFD700).withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFFFFD700).withValues(alpha: 0.5),
                      width: 2,
                    ),
                  ),
                  child: const Center(
                    child: Icon(Icons.stars, color: Color(0xFFFFD700), size: 32),
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
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                          ),
                          if (isPopular)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFD700),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'HOT',
                                style: TextStyle(
                                  color: Color(0xFF2A0845),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        xu > 0 ? '$xu XU' : 'Gói XU',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Price
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isPopular ? const Color(0xFFFFD700) : Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    package.storeProduct.priceString,
                    style: TextStyle(
                      color: isPopular ? const Color(0xFF2A0845) : Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
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
