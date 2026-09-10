import 'dart:io';
import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/ui/animated_background.dart';
import 'package:ziweiai_mobile/features/referral/services/referral_service.dart';
import 'package:ziweiai_mobile/features/referral/widgets/royal_referral_card.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';

class ReferralScreen extends ConsumerStatefulWidget {
  const ReferralScreen({super.key});

  @override
  ConsumerState<ReferralScreen> createState() => _ReferralScreenState();
}

class _ReferralScreenState extends ConsumerState<ReferralScreen> {
  final GlobalKey _cardKey = GlobalKey();
  final TextEditingController _inputController = TextEditingController();
  late ConfettiController _confettiController;
  bool _isSharing = false;
  bool _isRedeeming = false;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(duration: const Duration(seconds: 3));
  }

  @override
  void dispose() {
    _confettiController.dispose();
    _inputController.dispose();
    super.dispose();
  }

  Future<void> _shareCard(String code) async {
    if (_isSharing) return;
    setState(() => _isSharing = true);
    HapticFeedback.mediumImpact();

    try {
      final bytes = await RoyalReferralCard.captureCard(_cardKey);
      final shareText = '✦ Khai mở Thiên cơ cùng ViOS Tử Vi Toàn Tập! Nhập mã phúc khí $code để nhận ngay +20 XU Vận Khí Cung Đình: https://tuvitoantap.vercel.app/share/ref/$code';

      if (bytes != null && bytes.isNotEmpty) {
        final tempDir = await getTemporaryDirectory();
        final file = File('${tempDir.path}/vios_referral_$code.png');
        await file.writeAsBytes(bytes);

        await SharePlus.instance.share(
          ShareParams(
            text: shareText,
            files: [XFile(file.path)],
            subject: 'Lời mời thượng khách từ ViOS',
          ),
        );
      } else {
        await SharePlus.instance.share(
          ShareParams(text: shareText),
        );
      }
    } catch (e) {
      debugPrint('[ReferralScreen] share error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể chia sẻ ảnh lúc này, vui lòng thử lại')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSharing = false);
    }
  }

  Future<void> _redeemCode() async {
    final code = _inputController.text.trim().toUpperCase();
    if (code.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập mã giới thiệu của tri kỷ')),
      );
      return;
    }

    setState(() => _isRedeeming = true);
    HapticFeedback.lightImpact();

    final service = ref.read(referralServiceProvider);
    final result = await service.redeemReferralCode(code);

    if (!mounted) return;
    setState(() => _isRedeeming = false);

    if (result.success) {
      _confettiController.play();
      _inputController.clear();
      ref.invalidate(referralStatsProvider);
      ref.invalidate(walletBalanceProvider);

      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: AppTheme.cosmosSurface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: const BorderSide(color: AppTheme.goldBright, width: 1.5),
          ),
          title: Row(
            children: [
              const Icon(Icons.celebration, color: AppTheme.goldBright),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Phúc Khí Cung Đình!',
                  style: GoogleFonts.cinzel(
                    color: AppTheme.goldBright,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),
          content: Text(
            result.message,
            style: const TextStyle(color: AppTheme.mysticalText, fontSize: 13, height: 1.4),
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.goldBright,
                foregroundColor: const Color(0xFF141026),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Đón Nhận', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppTheme.cinnabarCrimson,
          content: Text(result.message),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final statsAsync = ref.watch(referralStatsProvider);

    return Scaffold(
      backgroundColor: AppTheme.cosmosDark,
      body: Stack(
        children: [
          const Positioned.fill(
            child: AnimatedBackground(child: SizedBox.shrink()),
          ),
          SafeArea(
            child: Column(
              children: [
                // Top App Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios_new, color: AppTheme.goldBright, size: 20),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                      Expanded(
                        child: Text(
                          'ĐẠI TIỆC CUNG ĐÌNH',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.cinzel(
                            color: AppTheme.goldBright,
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2.0,
                          ),
                        ),
                      ),
                      const SizedBox(width: 48), // Balance spacing
                    ],
                  ),
                ),

                // Content Scrollable
                Expanded(
                  child: statsAsync.when(
                    loading: () => const Center(
                      child: CircularProgressIndicator(color: AppTheme.goldBright),
                    ),
                    error: (err, stack) => _buildBody(const ReferralStats(
                      totalInvited: 0,
                      totalXuEarned: 0,
                      myCode: 'VIOS8888',
                    )),
                    data: (stats) => _buildBody(stats),
                  ),
                ),
              ],
            ),
          ),

          // Confetti pháo hoa
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirectionality: BlastDirectionality.explosive,
              shouldLoop: false,
              colors: const [
                AppTheme.goldBright,
                Colors.amber,
                AppTheme.cinnabarCrimson,
                Colors.purpleAccent,
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(ReferralStats stats) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
      child: Column(
        children: [
          // Thống Kê Phúc Khí
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1B1238), Color(0xFF130D2E)],
              ),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.4)),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.goldBright.withValues(alpha: 0.1),
                  blurRadius: 16,
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      Text(
                        '${stats.totalInvited}',
                        style: GoogleFonts.spaceGrotesk(
                          color: AppTheme.goldBright,
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Tri Kỷ Kết Duyên',
                        style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Container(width: 1, height: 40, color: AppTheme.goldBright.withValues(alpha: 0.3)),
                Expanded(
                  child: Column(
                    children: [
                      Text(
                        '+${stats.totalXuEarned}',
                        style: GoogleFonts.spaceGrotesk(
                          color: AppTheme.goldBright,
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'XU Phúc Khí',
                        style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Thẻ Thiệp Mời Hoàng Kim
          RoyalReferralCard(
            referralCode: stats.myCode,
            boundaryKey: _cardKey,
          ),
          const SizedBox(height: 18),

          // Hàng nút Action (Chia sẻ ảnh / Sao chép mã)
          Row(
            children: [
              Expanded(
                flex: 3,
                child: ElevatedButton.icon(
                  onPressed: _isSharing ? null : () => _shareCard(stats.myCode),
                  icon: _isSharing
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF141026)),
                        )
                      : const Icon(Icons.share_rounded, size: 20),
                  label: Text(
                    _isSharing ? 'Đang Kết Xuất...' : 'Chia Sẻ Thiệp Mời',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.goldBright,
                    foregroundColor: const Color(0xFF141026),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: stats.myCode));
                    HapticFeedback.lightImpact();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Đã sao chép mã ${stats.myCode}!')),
                    );
                  },
                  icon: const Icon(Icons.copy_rounded, size: 18, color: AppTheme.goldBright),
                  label: const Text(
                    'Chép Mã',
                    style: TextStyle(color: AppTheme.goldBright, fontWeight: FontWeight.bold),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.goldBright, width: 1.5),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),

          // Khung Nhập Mã Giới Thiệu Của Bạn Bè
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.cosmosSurface,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppTheme.goldBright.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.redeem, color: AppTheme.goldBright, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'NHẬP MÃ TRI KỶ NHẬN +20 XU',
                      style: GoogleFonts.cinzel(
                        color: AppTheme.goldBright,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Nhập mã giới thiệu của người quen để khai mở kết nối và nhận ngay 20 XU vào túi phúc khí.',
                  style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 12, height: 1.35),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _inputController,
                        textCapitalization: TextCapitalization.characters,
                        style: const TextStyle(
                          color: AppTheme.mysticalText,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2,
                        ),
                        decoration: InputDecoration(
                          hintText: 'VÍ DỤ: VIOS8888',
                          hintStyle: TextStyle(
                            color: AppTheme.mysticalTextSecondary.withValues(alpha: 0.5),
                            letterSpacing: 1,
                          ),
                          filled: true,
                          fillColor: const Color(0xFF0F0B1E),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppTheme.mysticalGold),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide(color: AppTheme.goldBright.withValues(alpha: 0.4)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppTheme.goldBright, width: 1.8),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton(
                      onPressed: _isRedeeming ? null : _redeemCode,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.cinnabarCrimson,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: _isRedeeming
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Nhận XU', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }
}
