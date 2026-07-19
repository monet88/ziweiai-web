import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import '../providers/wallet_provider.dart';

class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen> {
  Offerings? _offerings;
  bool _isLoading = true;
  bool _isPurchasing = false;

  @override
  void initState() {
    super.initState();
    _fetchOfferings();
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
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Thanh toán thành công! XU sẽ sớm được cộng vào tài khoản.')),
        );
      }
    } catch (e) {
      if (mounted) {
        // Only show error if it's not a user cancellation
        final isUserCancelled = e.toString().contains('canceled') || e.toString().contains('cancelled');
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

  @override
  Widget build(BuildContext context) {
    final balanceAsyncValue = ref.watch(walletBalanceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ví XU'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: [
          TextButton.icon(
            onPressed: _handleRestorePurchases,
            icon: const Icon(Icons.restore, color: Colors.white),
            label: const Text('Khôi phục', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Balance Card
            Container(
              padding: const EdgeInsets.all(24.0),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.deepPurple.shade700, Colors.deepPurple.shade400],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16.0),
                boxShadow: [
                  BoxShadow(
                    color: Colors.deepPurple.withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  const Text(
                    'Số dư hiện tại',
                    style: TextStyle(color: Colors.white70, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  balanceAsyncValue.when(
                    data: (balance) => Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          '$balance',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 48,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'XU',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    loading: () => const CircularProgressIndicator(color: Colors.white),
                    error: (err, stack) => Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, color: Colors.redAccent),
                        const SizedBox(width: 8),
                        Text(
                          'Lỗi tải số dư',
                          style: const TextStyle(color: Colors.redAccent, fontSize: 16),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Nạp thêm XU',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_offerings == null || _offerings!.current == null || _offerings!.current!.availablePackages.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text(
                    'Hiện tại chưa có gói XU nào khả dụng.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.black54),
                  ),
                ),
              )
            else
              ..._offerings!.current!.availablePackages.map((package) {
                // Determine mock XU from identifier or description (for UI display)
                int xuDisplay = 0;
                if (package.storeProduct.identifier.contains('100')) {
                  xuDisplay = 100;
                } else if (package.storeProduct.identifier.contains('500')) {
                  xuDisplay = 500;
                } else if (package.storeProduct.identifier.contains('2000')) {
                  xuDisplay = 2000;
                }

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12.0),
                  child: _buildPackageCard(
                    context,
                    title: package.storeProduct.title,
                    xu: xuDisplay, // Fallback logic above
                    price: package.storeProduct.priceString,
                    isPopular: package.storeProduct.identifier.contains('popular'),
                    onTap: () => _handlePurchase(package),
                  ),
                );
              }),
          ],
        ),
      ),
      // Overlay loading indicator during purchase
      floatingActionButton: _isPurchasing
          ? FloatingActionButton(
              onPressed: () {},
              backgroundColor: Colors.transparent,
              elevation: 0,
              child: const CircularProgressIndicator(),
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  Widget _buildPackageCard(
    BuildContext context, {
    required String title,
    required int xu,
    required String price,
    bool isPopular = false,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: isPopular ? 4 : 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isPopular
            ? const BorderSide(color: Colors.deepPurple, width: 2)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.deepPurple.shade50,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.stars, color: Colors.deepPurple),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isPopular) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.red.shade100,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'HOT',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.red.shade900,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ]
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(xu > 0 ? '$xu XU' : 'XU', style: const TextStyle(color: Colors.black54)),
                  ],
                ),
              ),
              Text(
                price,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: Colors.deepPurple,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
