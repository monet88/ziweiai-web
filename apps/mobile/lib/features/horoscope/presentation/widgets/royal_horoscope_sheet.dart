import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/models/daily_horoscope.dart';
import '../../domain/services/daily_horoscope_service.dart';

/// Thư tín ngự báo hoàng gia mở ra đầu ngày từ Khâm Thiên Giám (Imperial Scroll Decree)
class RoyalHoroscopeSheet extends StatelessWidget {
  final DailyHoroscope horoscope;

  const RoyalHoroscopeSheet({super.key, required this.horoscope});

  /// Phương thức tĩnh tiện lợi để hiển thị Modal BottomSheet
  static Future<void> show(BuildContext context, [DailyHoroscope? horoscope]) {
    final data = horoscope ?? DailyHoroscopeService.calculateHoroscope();
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => RoyalHoroscopeSheet(horoscope: data),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateStr =
        '${horoscope.date.day.toString().padLeft(2, '0')}/${horoscope.date.month.toString().padLeft(2, '0')}/${horoscope.date.year}';

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: AppTheme.cosmosElevated,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border.all(color: AppTheme.glassBorderGold, width: 1.2),
            boxShadow: [
              BoxShadow(
                color: AppTheme.goldBright.withValues(alpha: 0.15),
                blurRadius: 20,
                spreadRadius: 2,
              ),
            ],
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            children: [
              // Thanh kéo drag handle
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.taupe.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Header Hoàng Gia & Ấn Triện
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.wb_twilight_rounded,
                                size: 18, color: AppTheme.goldBright),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'KHÂM THIÊN GIÁM NGỰ BÁO',
                                style: AppTheme.titleFont(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.goldBright,
                                  letterSpacing: 0.8,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Khí vận nhật khóa • $dateStr',
                          style: const TextStyle(
                            color: AppTheme.mysticalTextSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Ấn Triện Son Cung Đình
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.cinnabarCrimson.withValues(alpha: 0.2),
                      border: Border.all(color: AppTheme.cinnabarCrimson, width: 1.0),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'NGỰ PHÊ',
                      style: TextStyle(
                        color: AppTheme.cinnabarLight,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Lời Ngự Phê Chiếu Chỉ (Imperial Decree Box)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.goldBright.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.glassBorderGold.withValues(alpha: 0.6)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.auto_awesome, size: 16, color: AppTheme.goldBright),
                        const SizedBox(width: 8),
                        Text(
                          'CHỈ DỤ ĐẦU NGÀY',
                          style: AppTheme.titleFont(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.goldBright,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      horoscope.royalDecree,
                      style: const TextStyle(
                        color: AppTheme.mysticalText,
                        fontSize: 13,
                        height: 1.5,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Thông tin Thiên Can - Địa Chi - Ngũ Hành - Trực Nhật
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  color: AppTheme.cosmosElevated.withValues(alpha: 0.6),
                  border: Border.all(color: AppTheme.glassBorder),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildPillarCol('CAN CHI NGÀY', horoscope.canChiDay, AppTheme.goldBright),
                    Container(width: 1, height: 32, color: AppTheme.glassBorder),
                    _buildPillarCol('NẠP ÂM', horoscope.napAm, AppTheme.etherealJade),
                    Container(width: 1, height: 32, color: AppTheme.glassBorder),
                    _buildPillarCol(
                      'TRỰC NHẬT',
                      'Trực ${horoscope.truc.name} (${horoscope.truc.isGood ? 'Cát' : 'Hung'})',
                      horoscope.truc.isGood ? AppTheme.goldBright : AppTheme.cinnabarLight,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Hướng Xuất Hành Cát Lợi (Tài Thần & Hỷ Thần)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  color: AppTheme.goldDeep.withValues(alpha: 0.08),
                  border: Border.all(color: AppTheme.glassBorderGold.withValues(alpha: 0.4)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'PHƯƠNG VỊ XUẤT HÀNH NGHÊNH CÁT',
                      style: AppTheme.titleFont(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.goldBright,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: _buildDirectionItem(
                            icon: Icons.monetization_on_outlined,
                            label: 'TÀI THẦN',
                            direction: horoscope.huongTaiThan,
                            color: AppTheme.goldBright,
                          ),
                        ),
                        Expanded(
                          child: _buildDirectionItem(
                            icon: Icons.favorite_outline,
                            label: 'HỶ THẦN',
                            direction: horoscope.huongHyThan,
                            color: AppTheme.etherealJade,
                          ),
                        ),
                        Expanded(
                          child: _buildDirectionItem(
                            icon: Icons.cancel_outlined,
                            label: 'HẠC THẦN (KỴ)',
                            direction: horoscope.huongHacThan,
                            color: AppTheme.cinnabarLight,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Việc Nên Làm & Việc Kiêng Cữ
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
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
                              Icon(Icons.check_circle_outline,
                                  size: 14, color: AppTheme.etherealJade),
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
                          const SizedBox(height: 8),
                          ...horoscope.auspiciousActivities.map(
                            (act) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text(
                                '• $act',
                                style: const TextStyle(
                                  color: AppTheme.mysticalText,
                                  fontSize: 11,
                                  height: 1.3,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
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
                              Icon(Icons.highlight_off,
                                  size: 14, color: AppTheme.cinnabarLight),
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
                          const SizedBox(height: 8),
                          ...horoscope.tabooActivities.map(
                            (act) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text(
                                '• $act',
                                style: const TextStyle(
                                  color: AppTheme.mysticalText,
                                  fontSize: 11,
                                  height: 1.3,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Giờ Hoàng Đạo
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: AppTheme.cosmosElevated.withValues(alpha: 0.5),
                  border: Border.all(color: AppTheme.glassBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.access_time_filled, size: 14, color: AppTheme.goldBright),
                        SizedBox(width: 6),
                        Text(
                          'GIỜ HOÀNG ĐẠO ĐẠI CÁT',
                          style: TextStyle(
                            color: AppTheme.goldBright,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: horoscope.hoangDaoHours.map((hour) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.nephriteJade.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: AppTheme.etherealJade.withValues(alpha: 0.5),
                              width: 0.8,
                            ),
                          ),
                          child: Text(
                            hour,
                            style: const TextStyle(
                              color: AppTheme.goldBright,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Action Buttons: Vấn đáp Ngự Phán Phòng & Đóng
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppTheme.glassBorderGold),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () => Navigator.pop(context),
                      child: const Text(
                        'ĐÓNG NGỰ THƯ',
                        style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.goldBright,
                        foregroundColor: AppTheme.cosmosDark,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () {
                        Navigator.pop(context);
                        context.push('/divination-chat');
                      },
                      icon: const Icon(Icons.auto_awesome, size: 16),
                      label: const Text(
                        'VẤN ĐÁP THỜI VẬN',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPillarCol(String title, String value, Color valueColor) {
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
          style: TextStyle(
            color: valueColor,
            fontSize: 11,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }

  Widget _buildDirectionItem({
    required IconData icon,
    required String label,
    required String direction,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: color.withValues(alpha: 0.85),
            fontSize: 9,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          direction,
          style: TextStyle(
            color: color,
            fontSize: 11,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}
