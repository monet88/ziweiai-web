import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../features/wallet/providers/wallet_provider.dart';
import '../../../features/subscription/providers/subscription_provider.dart';
import '../../../core/services/admob_service.dart';
import '../../../core/api/api_provider.dart';
import '../../theme/app_theme.dart';
import '../../../ui/glass_panel.dart';

class PremiumPaywallSheet extends ConsumerStatefulWidget {
  final int cost;
  final String featureName;

  const PremiumPaywallSheet({
    super.key,
    required this.cost,
    required this.featureName,
  });

  @override
  ConsumerState<PremiumPaywallSheet> createState() => _PremiumPaywallSheetState();
}

class _PremiumPaywallSheetState extends ConsumerState<PremiumPaywallSheet> {
  bool _isWatchingAd = false;

  Future<void> _handleWatchAd() async {
    if (_isWatchingAd) return;
    HapticFeedback.mediumImpact();
    setState(() => _isWatchingAd = true);

    try {
      final admobService = ref.read(admobServiceProvider);
      final apiClient = ref.read(apiClientProvider);

      await admobService.showRewardedAd(
        onUserEarnedReward: (reward) async {
          debugPrint('[PremiumPaywallSheet] User earned reward, claiming...');
          try {
            await apiClient.claimAdReward();
            if (mounted) {
              ref.invalidate(walletBalanceProvider);
              HapticFeedback.heavyImpact();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('🎉 Chúc mừng! Bạn đã nhận +5 XU miễn phí.'),
                  backgroundColor: AppTheme.cosmosElevated,
                ),
              );
              Navigator.of(context).pop();
            }
          } catch (e) {
            debugPrint('[PremiumPaywallSheet] Failed to claim reward: $e');
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
                content: Text('Video quảng cáo chưa sẵn sàng. Vui lòng thử lại sau!'),
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

  @override
  Widget build(BuildContext context) {
    final balanceAsync = ref.watch(walletBalanceProvider);
    final isPro = ref.watch(isProUserProvider);

    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.cosmosDark.withValues(alpha: 0.92),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(
            top: BorderSide(
              color: AppTheme.goldBright.withValues(alpha: 0.6),
              width: 1.5,
            ),
          ),
          boxShadow: CelestialShadows.goldGlow,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 48,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: AppTheme.goldBright.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: CelestialGradients.imperialGold,
                  boxShadow: CelestialShadows.goldGlow,
                ),
                child: const Icon(
                  Icons.auto_awesome,
                  color: Color(0xFF141026),
                  size: 36,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'MỞ KHÓA THUẬT SỐ CAO CẤP',
                textAlign: TextAlign.center,
                style: GoogleFonts.cinzel(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.goldBright,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Để thực hiện luận giải ${widget.featureName}, bạn có thể thanh toán phí ${widget.cost} XU, xem video nhận XU miễn phí, hoặc nâng cấp VIP Pro.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppTheme.mysticalTextSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 20),
              
              // Balance box
              GlassPanel(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                borderGradient: CelestialGradients.goldBorder,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Số dư XU hiện tại:',
                      style: TextStyle(color: AppTheme.mysticalText, fontSize: 14),
                    ),
                    balanceAsync.when(
                      data: (balance) => Row(
                        children: [
                          Text(
                            '$balance',
                            style: GoogleFonts.cinzel(
                              color: AppTheme.goldBright,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Text(
                            'XU',
                            style: TextStyle(
                              color: AppTheme.goldBright,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                      loading: () => const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppTheme.goldBright,
                        ),
                      ),
                      error: (e, st) => const Text('Lỗi', style: TextStyle(color: Colors.redAccent)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              
              // Primary VIP Action
              if (!isPro) ...[
                Container(
                  width: double.infinity,
                  height: 50,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: CelestialGradients.imperialGold,
                    boxShadow: CelestialShadows.goldGlow,
                  ),
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      HapticFeedback.mediumImpact();
                      Navigator.of(context).pop();
                      await ref.read(subscriptionProvider.notifier).presentPaywall();
                    },
                    icon: const Icon(Icons.workspace_premium, color: Color(0xFF141026)),
                    label: Text(
                      'NÂNG CẤP VIP PRO',
                      style: GoogleFonts.cinzel(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF141026),
                        letterSpacing: 1.0,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      foregroundColor: const Color(0xFF141026),
                      shadowColor: Colors.transparent,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
              ],

              // Watch Ad Button for Free Coins
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _isWatchingAd ? null : _handleWatchAd,
                  icon: _isWatchingAd
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Color(0xFF141026),
                          ),
                        )
                      : const Icon(Icons.play_circle_fill_rounded, color: Color(0xFF141026), size: 20),
                  label: Text(
                    _isWatchingAd ? 'ĐANG TẢI AD...' : 'XEM VIDEO NHẬN +5 XU',
                    style: GoogleFonts.cinzel(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF141026),
                      letterSpacing: 0.8,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.goldBright,
                    foregroundColor: const Color(0xFF141026),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
              const SizedBox(height: 10),

              // Secondary: Nạp XU
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    Navigator.of(context).pop();
                    context.push('/wallet');
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.goldBright,
                    side: const BorderSide(color: AppTheme.mysticalGold, width: 1.2),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Text(
                    'NẠP XU VÀO VÍ',
                    style: GoogleFonts.cinzel(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.0,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              TextButton(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  Navigator.of(context).pop();
                },
                child: const Text(
                  'Để sau',
                  style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 13),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

