import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../data/repositories/auth_repository.dart';
import '../../wallet/providers/wallet_provider.dart';
import '../../subscription/providers/subscription_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../core/services/ritual_audio_service.dart';
import '../../../ui/animated_background.dart';
import '../../../ui/glass_panel.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _isLoggingOut = false;

  Future<void> _handleSignOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.cosmosSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppTheme.mysticalGold, width: 1.2),
        ),
        title: Text(
          'Đăng Xuất',
          style: GoogleFonts.cinzel(
            color: AppTheme.goldBright,
            fontWeight: FontWeight.w700,
          ),
        ),
        content: const Text(
          'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?',
          style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('HỦY', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE53935),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('ĐĂNG XUẤT', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isLoggingOut = true);
      HapticFeedback.mediumImpact();
      try {
        await ref.read(authRepositoryProvider).signOut();
        if (mounted) {
          context.go('/');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi đăng xuất: $e')),
          );
        }
      } finally {
        if (mounted) {
          setState(() => _isLoggingOut = false);
        }
      }
    }
  }

  Future<void> _handleDeleteAccount() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.cosmosSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xFFFF5252), width: 1.5),
        ),
        title: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Color(0xFFFF5252), size: 28),
            const SizedBox(width: 10),
            Text(
              'Xóa Tài Khoản',
              style: GoogleFonts.cinzel(
                color: const Color(0xFFFF5252),
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
        content: const Text(
          'Hành động này sẽ xóa vĩnh viễn dữ liệu tài khoản, lịch sử lá số và toàn bộ số dư XU của bạn. Hành động không thể hoàn tác.',
          style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('HỦY BỎ', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFB71C1C),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('XÁC NHẬN XÓA', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      HapticFeedback.heavyImpact();
      try {
        await ref.read(authRepositoryProvider).signOut();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Yêu cầu xóa tài khoản đã được ghi nhận.')),
          );
          context.go('/');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;
    final isAnonymous = user?.isAnonymous ?? true;
    final email = user?.email ?? (isAnonymous ? 'Khách Ẩn Danh' : 'Tài khoản thành viên');
    final isPro = ref.watch(isProUserProvider);
    final balanceAsync = ref.watch(walletBalanceProvider);
    final currentThemeMode = ref.watch(themeModeProvider);
    final isAudioMuted = ref.watch(ritualAudioNotifierProvider);
    final audioVolume = ref.watch(ritualAudioVolumeProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text(
          'Hồ Sơ Cá Nhân',
          style: GoogleFonts.cinzel(
            fontWeight: FontWeight.w700,
            color: AppTheme.goldBright,
            letterSpacing: 1.2,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: AppTheme.goldBright),
          onPressed: () => context.pop(),
        ),
      ),
      body: AnimatedBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20.0, 10.0, 20.0, 40.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // User Info Card
                GlassPanel(
                  padding: const EdgeInsets.all(20),
                  borderGradient: CelestialGradients.goldBorder,
                  child: Column(
                    children: [
                      // Avatar
                      Container(
                        width: 76,
                        height: 76,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: CelestialGradients.imperialGold,
                          boxShadow: CelestialShadows.goldGlow,
                        ),
                        child: Center(
                          child: Icon(
                            isAnonymous ? Icons.person_outline : Icons.person,
                            size: 42,
                            color: const Color(0xFF141026),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // User Display Name / Email
                      Text(
                        email,
                        style: const TextStyle(
                          color: AppTheme.mysticalText,
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 6),

                      // Badges
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                            decoration: BoxDecoration(
                              color: isAnonymous ? AppTheme.cosmosElevated : AppTheme.nebulaPurple.withValues(alpha: 0.3),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isAnonymous ? AppTheme.mysticalGold.withValues(alpha: 0.3) : AppTheme.nebulaPurple,
                                width: 0.8,
                              ),
                            ),
                            child: Text(
                              isAnonymous ? 'Khách Trải Nghiệm' : 'Đã Xác Thực',
                              style: TextStyle(
                                color: isAnonymous ? AppTheme.mysticalTextSecondary : AppTheme.nebulaCyan,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                            decoration: BoxDecoration(
                              gradient: isPro ? CelestialGradients.imperialGold : null,
                              color: isPro ? null : AppTheme.cosmosElevated,
                              borderRadius: BorderRadius.circular(10),
                              boxShadow: isPro ? CelestialShadows.goldGlow : null,
                            ),
                            child: Text(
                              isPro ? 'VIP PRO' : 'THÀNH VIÊN',
                              style: TextStyle(
                                color: isPro ? const Color(0xFF141026) : AppTheme.goldBright,
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (isAnonymous) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.cosmosDark.withValues(alpha: 0.6),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.mysticalGold.withValues(alpha: 0.25)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.info_outline, color: AppTheme.goldBright, size: 20),
                              const SizedBox(width: 10),
                              const Expanded(
                                child: Text(
                                  'Đăng nhập để đồng bộ lá số & bảo lưu số dư XU vĩnh viễn trên mọi thiết bị.',
                                  style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 12, height: 1.3),
                                ),
                              ),
                              const SizedBox(width: 8),
                              ElevatedButton(
                                onPressed: () => context.push('/auth'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.goldBright,
                                  foregroundColor: const Color(0xFF141026),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                child: const Text('Đăng nhập', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Wallet & Balance Quick Card
                GlassPanel(
                  padding: const EdgeInsets.all(18),
                  borderGradient: CelestialGradients.goldBorder,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: CelestialGradients.imperialGold,
                              boxShadow: CelestialShadows.goldGlow,
                            ),
                            child: const Icon(Icons.account_balance_wallet, color: Color(0xFF141026), size: 24),
                          ),
                          const SizedBox(width: 14),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Số Dư Hiện Tại',
                                style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 12),
                              ),
                              const SizedBox(height: 2),
                              balanceAsync.when(
                                data: (balance) => Text(
                                  '$balance XU',
                                  style: GoogleFonts.cinzel(
                                    color: AppTheme.goldBright,
                                    fontSize: 22,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                loading: () => const Text('Đang tải...', style: TextStyle(color: AppTheme.goldBright)),
                                error: (error, stack) => const Text('0 XU', style: TextStyle(color: AppTheme.goldBright)),
                              ),
                            ],
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: () => context.push('/wallet'),
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Nạp XU', style: TextStyle(fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.goldBright,
                          foregroundColor: const Color(0xFF141026),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Settings & Actions Menu
                Text(
                  'QUẢN LÝ TÀI KHOẢN',
                  style: GoogleFonts.cinzel(
                    color: AppTheme.goldBright,
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 10),

                GlassPanel(
                  padding: EdgeInsets.zero,
                  borderGradient: CelestialGradients.starlightBorder,
                  child: Column(
                    children: [
                      _buildListTile(
                        icon: Icons.history_edu,
                        title: 'Lịch Sử Giao Dịch & Ví XU',
                        onTap: () => context.push('/wallet/history'),
                      ),
                      const Divider(color: Colors.white10, height: 1),
                      _buildListTile(
                        icon: Icons.workspace_premium,
                        title: 'Gói Hội Viên VIP Pro',
                        subtitle: isPro ? 'Đang kích hoạt' : 'Nâng cấp mở khóa toàn bộ',
                        onTap: () => context.push('/wallet'),
                      ),
                      if (isPro) ...[
                        const Divider(color: Colors.white10, height: 1),
                        _buildListTile(
                          icon: Icons.settings_suggest,
                          title: 'Customer Center (Quản lý gói In-App)',
                          onTap: () => ref.read(subscriptionProvider.notifier).presentCustomerCenter(),
                        ),
                      ],
                      const Divider(color: Colors.white10, height: 1),
                      _buildListTile(
                        icon: Icons.palette_outlined,
                        title: 'Giao Diện Hoàng Triều',
                        subtitle: _getThemeSubtitle(currentThemeMode),
                        onTap: () => _showThemeSelectionDialog(context, currentThemeMode),
                      ),
                      const Divider(color: Colors.white10, height: 1),
                      _buildListTile(
                        icon: Icons.security,
                        title: 'Chính Sách Bảo Mật & Điều Khoản',
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Xem chi tiết tại tuvitoantap.vercel.app/terms')),
                          );
                        },
                      ),
                      if (!isAnonymous) ...[
                        const Divider(color: Colors.white10, height: 1),
                        _buildListTile(
                          icon: Icons.logout,
                          title: 'Đăng Xuất',
                          iconColor: const Color(0xFFFFAB40),
                          titleColor: const Color(0xFFFFAB40),
                          onTap: _isLoggingOut ? null : _handleSignOut,
                        ),
                      ],
                      const Divider(color: Colors.white10, height: 1),
                      _buildListTile(
                        icon: Icons.delete_forever,
                        title: 'Xóa Tài Khoản Vĩnh Viễn',
                        iconColor: const Color(0xFFFF5252),
                        titleColor: const Color(0xFFFF5252),
                        onTap: _handleDeleteAccount,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Ceremony Sound Settings
                Text(
                  'ÂM THANH & NGHI LỄ HOÀNG TRIỀU',
                  style: GoogleFonts.cinzel(
                    color: AppTheme.goldBright,
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 10),

                GlassPanel(
                  padding: const EdgeInsets.all(18),
                  borderGradient: CelestialGradients.starlightBorder,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(
                                isAudioMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                                color: isAudioMuted ? AppTheme.mysticalTextSecondary : AppTheme.goldBright,
                                size: 24,
                              ),
                              const SizedBox(width: 14),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Hiệu Ứng Âm Thanh Nghi Lễ',
                                    style: TextStyle(
                                      color: AppTheme.mysticalText,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    isAudioMuted ? 'Đang tắt nhạc khí' : 'Bật nhạc khí cung đình',
                                    style: const TextStyle(
                                      color: AppTheme.mysticalTextSecondary,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Switch.adaptive(
                            value: !isAudioMuted,
                            activeThumbColor: AppTheme.goldBright,
                            activeTrackColor: AppTheme.goldBright.withValues(alpha: 0.4),
                            onChanged: (val) {
                              HapticFeedback.lightImpact();
                              ref.read(ritualAudioNotifierProvider.notifier).setMuted(!val);
                            },
                          ),
                        ],
                      ),
                      if (!isAudioMuted) ...[
                        const SizedBox(height: 16),
                        const Divider(color: Colors.white10, height: 1),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Âm lượng nhạc khí:',
                              style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 13),
                            ),
                            Text(
                              '${(audioVolume * 100).round()}%',
                              style: const TextStyle(
                                color: AppTheme.goldBright,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                        SliderTheme(
                          data: SliderTheme.of(context).copyWith(
                            activeTrackColor: AppTheme.goldBright,
                            inactiveTrackColor: Colors.white12,
                            thumbColor: AppTheme.goldBright,
                            overlayColor: AppTheme.goldBright.withValues(alpha: 0.2),
                            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
                          ),
                          child: Slider(
                            value: audioVolume,
                            min: 0.0,
                            max: 1.0,
                            divisions: 20,
                            onChanged: (newVol) {
                              ref.read(ritualAudioVolumeProvider.notifier).setVolume(newVol);
                            },
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Thử nghiệm nhạc khí hoàng triều:',
                          style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 12),
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _buildSoundTestChip(
                              label: '🔔 Chuông Đồng',
                              onTap: () {
                                HapticFeedback.lightImpact();
                                ref.read(ritualAudioNotifierProvider.notifier).playSingingBowl();
                              },
                            ),
                            _buildSoundTestChip(
                              label: '🪙 Đồng Xu',
                              onTap: () {
                                HapticFeedback.lightImpact();
                                ref.read(ritualAudioNotifierProvider.notifier).playCoinClink();
                              },
                            ),
                            _buildSoundTestChip(
                              label: '🎋 Thẻ Xăm',
                              onTap: () {
                                HapticFeedback.lightImpact();
                                ref.read(ritualAudioNotifierProvider.notifier).playStickShake();
                              },
                            ),
                            _buildSoundTestChip(
                              label: '🔮 Lá Bài Tarot',
                              onTap: () {
                                HapticFeedback.lightImpact();
                                ref.read(ritualAudioNotifierProvider.notifier).playTarotFlip();
                              },
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 30),

                // Version Footer
                const Center(
                  child: Text(
                    'Tử Vi Toàn Tập Mobile v1.0.0 (Sprint 39)\nBản quyền thuộc về ZiweiAI Monorepo',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white30, fontSize: 11, height: 1.5),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getThemeSubtitle(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.system:
        return 'Theo Hệ Thống Thiết Bị';
      case ThemeMode.light:
        return 'Hoàng Triều Bạch Giấy (Sáng)';
      case ThemeMode.dark:
        return 'Hoàng Triều Huyền Bí (Tối)';
    }
  }

  void _showThemeSelectionDialog(BuildContext context, ThemeMode currentMode) {
    HapticFeedback.lightImpact();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.cosmosSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppTheme.mysticalGold, width: 1.2),
        ),
        title: Text(
          'Chọn Giao Diện Hoàng Triều',
          style: GoogleFonts.cinzel(
            color: AppTheme.goldBright,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildThemeOption(
              context: context,
              title: 'Hoàng Triều Huyền Bí',
              subtitle: 'Giao diện đen huyền kim sang trọng',
              icon: Icons.dark_mode_outlined,
              isSelected: currentMode == ThemeMode.dark,
              mode: ThemeMode.dark,
            ),
            const Divider(color: Colors.white10, height: 1),
            _buildThemeOption(
              context: context,
              title: 'Hoàng Triều Bạch Giấy',
              subtitle: 'Giao diện thư quán truyền thống',
              icon: Icons.light_mode_outlined,
              isSelected: currentMode == ThemeMode.light,
              mode: ThemeMode.light,
            ),
            const Divider(color: Colors.white10, height: 1),
            _buildThemeOption(
              context: context,
              title: 'Theo Hệ Thống',
              subtitle: 'Tự động thích ứng thiết bị',
              icon: Icons.brightness_auto_outlined,
              isSelected: currentMode == ThemeMode.system,
              mode: ThemeMode.system,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('ĐÓNG', style: TextStyle(color: AppTheme.goldBright)),
          ),
        ],
      ),
    );
  }

  Widget _buildThemeOption({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isSelected,
    required ThemeMode mode,
  }) {
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? AppTheme.goldBright : AppTheme.mysticalTextSecondary,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? AppTheme.goldBright : AppTheme.mysticalText,
          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
          fontSize: 14,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 11),
      ),
      trailing: isSelected
          ? const Icon(Icons.check_circle, color: AppTheme.goldBright, size: 20)
          : null,
      onTap: () {
        HapticFeedback.selectionClick();
        ref.read(themeModeProvider.notifier).setThemeMode(mode);
        Navigator.of(context).pop();
      },
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    String? subtitle,
    Color? iconColor,
    Color? titleColor,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: iconColor ?? AppTheme.goldBright, size: 22),
      title: Text(
        title,
        style: TextStyle(
          color: titleColor ?? AppTheme.mysticalText,
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: const TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 12),
            )
          : null,
      trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.mysticalTextSecondary),
      onTap: onTap,
    );
  }

  Widget _buildSoundTestChip({
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          color: AppTheme.cosmosElevated.withValues(alpha: 0.7),
          border: Border.all(
            color: AppTheme.mysticalGold.withValues(alpha: 0.35),
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: AppTheme.goldBright,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
