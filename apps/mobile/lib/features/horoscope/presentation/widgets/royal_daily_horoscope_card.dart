import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/models/daily_horoscope.dart';
import '../../domain/services/daily_notification_service.dart';
import 'royal_horoscope_sheet.dart';

/// Bento Card hiển thị Khí Vận Nhật Khóa từ Khâm Thiên Giám trên HomeScreen
class RoyalDailyHoroscopeCard extends ConsumerWidget {
  final DailyHoroscope? customHoroscope;

  const RoyalDailyHoroscopeCard({super.key, this.customHoroscope});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final DailyHoroscope horoscope = customHoroscope ?? ref.watch(todayHoroscopeProvider);
    final notificationState = ref.watch(dailyNotificationProvider);

    final dateStr =
        '${horoscope.date.day.toString().padLeft(2, '0')}/${horoscope.date.month.toString().padLeft(2, '0')}/${horoscope.date.year}';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cosmosElevated.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.glassBorderGold, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: AppTheme.goldBright.withValues(alpha: 0.08),
            blurRadius: 16,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row: Tiêu đề, Badge Trực Nhật & Nút Chuông 07:00 Sáng
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.wb_sunny_outlined, size: 16, color: AppTheme.goldBright),
                  const SizedBox(width: 6),
                  Text(
                    'KHÂM THIÊN GIÁM NGỰ BÁO',
                    style: GoogleFonts.cinzel(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.goldBright,
                      letterSpacing: 1.0,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  // Badge Trực Nhật
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(6),
                      color: horoscope.truc.isGood
                          ? AppTheme.nephriteJade.withValues(alpha: 0.25)
                          : AppTheme.cinnabarCrimson.withValues(alpha: 0.2),
                      border: Border.all(
                        color: horoscope.truc.isGood
                            ? AppTheme.etherealJade
                            : AppTheme.cinnabarLight,
                        width: 0.8,
                      ),
                    ),
                    child: Text(
                      'TRỰC ${horoscope.truc.name.toUpperCase()} (${horoscope.truc.isGood ? 'CÁT' : 'HUNG'})',
                      style: TextStyle(
                        color: horoscope.truc.isGood
                            ? AppTheme.goldBright
                            : AppTheme.cinnabarLight,
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  // Nút Chuông Thông Báo 07:00 Sáng
                  InkWell(
                    key: const Key('daily_notification_bell_button'),
                    borderRadius: BorderRadius.circular(20),
                    onTap: () {
                      HapticFeedback.lightImpact();
                      ref.read(dailyNotificationProvider.notifier).toggleNotification();
                      final isNowEnabled = !notificationState.isEnabled;
                      ScaffoldMessenger.of(context).hideCurrentSnackBar();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          backgroundColor: AppTheme.cosmosElevated,
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                            side: const BorderSide(color: AppTheme.glassBorderGold, width: 0.8),
                          ),
                          content: Row(
                            children: [
                              Icon(
                                isNowEnabled
                                    ? Icons.notifications_active_rounded
                                    : Icons.notifications_off_outlined,
                                color: isNowEnabled ? AppTheme.goldBright : AppTheme.mysticalTextSecondary,
                                size: 18,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  isNowEnabled
                                      ? 'Đã bật ngự báo 07:00 sáng mỗi ngày'
                                      : 'Đã tắt ngự báo sáng hàng ngày',
                                  style: const TextStyle(
                                    color: AppTheme.mysticalText,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: notificationState.isEnabled
                            ? AppTheme.goldBright.withValues(alpha: 0.2)
                            : AppTheme.cosmosElevated,
                        border: Border.all(
                          color: notificationState.isEnabled
                              ? AppTheme.goldBright
                              : AppTheme.glassBorder,
                          width: 0.8,
                        ),
                      ),
                      child: Icon(
                        notificationState.isEnabled
                            ? Icons.notifications_active
                            : Icons.notifications_none,
                        size: 14,
                        color: notificationState.isEnabled
                            ? AppTheme.goldBright
                            : AppTheme.mysticalTextSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Can Chi & Thông tin ngày
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: AppTheme.cosmosElevated.withValues(alpha: 0.5),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildAlmanacCol('DƯƠNG LỊCH', dateStr),
                Container(width: 1, height: 28, color: AppTheme.glassBorder),
                _buildAlmanacCol('CAN CHI', horoscope.canChiDay),
                Container(width: 1, height: 28, color: AppTheme.glassBorder),
                _buildAlmanacCol('NẠP ÂM', horoscope.napAm),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Phương Vị Cát Thần Quick Chips (Tài Thần / Hỷ Thần)
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: AppTheme.goldBright.withValues(alpha: 0.08),
                    border: Border.all(color: AppTheme.glassBorderGold, width: 0.8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.monetization_on_outlined, size: 12, color: AppTheme.goldBright),
                      const SizedBox(width: 4),
                      Text(
                        'Tài Thần: ${horoscope.huongTaiThan}',
                        style: const TextStyle(
                          color: AppTheme.goldBright,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: AppTheme.nephriteJade.withValues(alpha: 0.1),
                    border: Border.all(color: AppTheme.etherealJade.withValues(alpha: 0.5), width: 0.8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.favorite_outline, size: 12, color: AppTheme.etherealJade),
                      const SizedBox(width: 4),
                      Text(
                        'Hỷ Thần: ${horoscope.huongHyThan}',
                        style: const TextStyle(
                          color: AppTheme.etherealJade,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Việc Nên Làm vs Việc Kiêng Cữ
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
                      Text(
                        horoscope.auspiciousActivities.take(3).map((e) => '• $e').join('\n'),
                        style: const TextStyle(
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
                      Text(
                        horoscope.tabooActivities.take(3).map((e) => '• $e').join('\n'),
                        style: const TextStyle(
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

          // Giờ Hoàng Đạo tóm tắt
          Text(
            'Giờ Hoàng Đạo: ${horoscope.hoangDaoHours.join(', ')}',
            style: TextStyle(
              color: AppTheme.mysticalTextSecondary.withValues(alpha: 0.85),
              fontSize: 10,
              fontStyle: FontStyle.italic,
            ),
          ),
          const SizedBox(height: 12),

          // Nút Khai Mở Ngự Báo Hoàng Gia
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              key: const Key('open_royal_horoscope_button'),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.glassBorderGold, width: 0.9),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 8),
                backgroundColor: AppTheme.goldBright.withValues(alpha: 0.05),
              ),
              onPressed: () {
                HapticFeedback.lightImpact();
                RoyalHoroscopeSheet.show(context, horoscope);
              },
              icon: const Icon(Icons.menu_book_rounded, size: 14, color: AppTheme.goldBright),
              label: const Text(
                'KHAI MỞ NGỰ BÁO HOÀNG GIA ✦',
                style: TextStyle(
                  color: AppTheme.goldBright,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                ),
              ),
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
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: AppTheme.goldBright,
            fontSize: 11,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}
