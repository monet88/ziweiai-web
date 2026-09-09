import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../ui/animated_background.dart';
import '../../wallet/providers/wallet_provider.dart';
import '../data/models/bazi_models.dart';
import '../providers/bazi_provider.dart';

class BaziScreen extends ConsumerStatefulWidget {
  const BaziScreen({super.key});

  @override
  ConsumerState<BaziScreen> createState() => _BaziScreenState();
}

class _BaziScreenState extends ConsumerState<BaziScreen> {
  @override
  Widget build(BuildContext context) {
    final baziState = ref.watch(baziProvider);
    final wallet = ref.watch(walletBalanceProvider).value ?? 0;
    final chart = baziState.chart;

    return Scaffold(
      backgroundColor: AppTheme.cosmosDark,
      body: AnimatedBackground(
        child: SafeArea(
          child: Column(
            children: [
              // Top App Bar
              _buildTopAppBar(context, wallet),

                // Nội dung cuộn chính
                Expanded(
                  child: baziState.isLoading
                      ? const Center(
                          child: CircularProgressIndicator(
                            color: AppTheme.goldBright,
                          ),
                        )
                      : chart == null
                          ? _buildEmptyOrError(baziState.error)
                          : SingleChildScrollView(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16.0,
                                vertical: 12.0,
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // 1. Thẻ Đương Số Hoàng Cung
                                  _buildClientCard(chart),
                                  const SizedBox(height: 16.0),

                                  // 2. Bảng Tứ Trụ Tiên Thiên 4 Cột
                                  _buildFourPillarsSection(chart),
                                  const SizedBox(height: 16.0),

                                  // 3. Thước Đo Cân Bằng Ngũ Hành
                                  _buildFiveElementsSection(chart),
                                  const SizedBox(height: 16.0),

                                  // 4. Định Tam Thần: Dụng - Hỷ - Kỵ
                                  _buildThreeDeitiesSection(chart),
                                  const SizedBox(height: 16.0),

                                  // 5. Vận Khí Năm 2026 Bính Ngọ
                                  _buildYear2026ForecastSection(chart),
                                  const SizedBox(height: 16.0),

                                  // 6. Khâm Thiên Giám Ngự Phê (AI Deep-Dive)
                                  _buildAiExplanationSection(
                                      context, baziState, chart, wallet),
                                  const SizedBox(height: 24.0),

                                  // 7. Nút Hành Động Lớn Thumb-Zone
                                  _buildOpenDossierButton(context),
                                  const SizedBox(height: 32),
                                ],
                              ),
                            ),
                ),
              ],
            ),
          ),
        ),
      );
  }

  Widget _buildTopAppBar(BuildContext context, int wallet) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 16.0,
        vertical: 8.0,
      ),
      decoration: BoxDecoration(
        color: AppTheme.cosmosSurface.withValues(alpha: 0.85),
        border: Border(
          bottom: BorderSide(
            color: AppTheme.mysticalGold.withValues(alpha: 0.3),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          // Nút quay lại 48dp chuẩn accessibility
          Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(24),
              onTap: () {
                HapticFeedback.lightImpact();
                if (context.canPop()) {
                  context.pop();
                } else {
                  context.go('/');
                }
              },
              child: Container(
                width: AppTheme.touchTargetMin,
                height: AppTheme.touchTargetMin,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                      color: AppTheme.mysticalGold.withValues(alpha: 0.4)),
                  color: AppTheme.cosmosElevated,
                ),
                child: const Icon(
                  Icons.arrow_back_ios_new_rounded,
                  color: AppTheme.goldBright,
                  size: 20,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12.0),

          // Tiêu đề App Bar
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'BÁT TỰ TỨ TRỤ',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.goldBright,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                ),
                const Text(
                  'Vận Khí Bính Ngọ 2026 · Tử Bình Cổ Pháp',
                  style: TextStyle(
                    color: AppTheme.mysticalTextSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),

          // Badge Ví XU
          InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () {
              HapticFeedback.lightImpact();
              context.push('/wallet');
            },
            child: Container(
              height: AppTheme.touchTargetMin,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                color: AppTheme.cosmosElevated,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                    color: AppTheme.mysticalGold.withValues(alpha: 0.5)),
                boxShadow: CelestialShadows.goldGlow,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.stars_rounded,
                      color: AppTheme.goldBright, size: 18),
                  const SizedBox(width: 4),
                  Text(
                    '$wallet XU',
                    style: const TextStyle(
                      color: AppTheme.goldBright,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyOrError(String? error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline_rounded,
              color: AppTheme.cinnabarCrimson, size: 48),
          const SizedBox(height: 12),
          Text(
            error ?? 'Chưa tải được lá số Bát Tự',
            style: const TextStyle(color: AppTheme.mysticalTextSecondary),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => ref.read(baziProvider.notifier).loadDefaultChart(),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.goldBright,
              foregroundColor: AppTheme.cosmosDark,
            ),
            child: const Text('Tải lại'),
          ),
        ],
      ),
    );
  }

  // 1. Thẻ Đương Số Hoàng Cung
  Widget _buildClientCard(BaziChartData chart) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: AppTheme.cosmosSurface.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: AppTheme.mysticalGold.withValues(alpha: 0.4)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.goldBright.withValues(alpha: 0.08),
            blurRadius: 16,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppTheme.cinnabarCrimson.withValues(alpha: 0.2),
                      border: Border.all(color: AppTheme.goldBright),
                    ),
                    child: const Center(
                      child: Icon(Icons.person_rounded,
                          color: AppTheme.goldBright, size: 20),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        chart.clientName,
                        style: const TextStyle(
                          color: AppTheme.goldBright,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        chart.gender,
                        style: const TextStyle(
                          color: AppTheme.mysticalTextSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              // Huy hiệu Nhật Chủ phát quang
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.goldBright.withValues(alpha: 0.25),
                      AppTheme.nebulaPurple.withValues(alpha: 0.3),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.goldBright, width: 1.2),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.wb_sunny_rounded,
                        color: AppTheme.goldBright, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      'Nhật Chủ: ${chart.dayMasterElement}',
                      style: const TextStyle(
                        color: AppTheme.goldBright,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Divider(color: AppTheme.mysticalGold.withValues(alpha: 0.3), height: 1),
          const SizedBox(height: 12),

          // Thông tin ngày tháng năm sinh
          Row(
            children: [
              Expanded(
                child: _buildInfoItem(
                  icon: Icons.calendar_today_rounded,
                  label: 'Dương Lịch',
                  value: chart.solarDate,
                ),
              ),
              Expanded(
                child: _buildInfoItem(
                  icon: Icons.nightlight_round,
                  label: 'Âm Lịch',
                  value: chart.lunarDate,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon,
            color: AppTheme.mysticalGold.withValues(alpha: 0.6), size: 15),
        const SizedBox(width: 6),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: AppTheme.mysticalTextSecondary,
                  fontSize: 11,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  color: AppTheme.mysticalText,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // 2. Bảng Tứ Trụ Tiên Thiên 4 Cột
  Widget _buildFourPillarsSection(BaziChartData chart) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: AppTheme.cosmosSurface.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: AppTheme.mysticalGold.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.grid_view_rounded,
                  color: AppTheme.goldBright, size: 20),
              const SizedBox(width: 8),
              const Text(
                'TỨ TRỤ TIÊN THIÊN',
                style: TextStyle(
                  color: AppTheme.goldBright,
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.cosmosElevated,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                      color: AppTheme.mysticalGold.withValues(alpha: 0.3)),
                ),
                child: const Text(
                  'Tử Bình Bát Tự',
                  style: TextStyle(
                      color: AppTheme.mysticalTextSecondary, fontSize: 11),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Lưới 4 cột: Năm, Tháng, Ngày (Nhật Chủ), Giờ
          Row(
            children: chart.pillars.map((pillar) {
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: _buildPillarColumn(pillar),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildPillarColumn(BaziPillarData pillar) {
    final isDm = pillar.isDayMaster;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
      decoration: BoxDecoration(
        color: isDm
            ? AppTheme.goldBright.withValues(alpha: 0.12)
            : AppTheme.cosmosElevated.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDm
              ? AppTheme.goldBright
              : AppTheme.mysticalGold.withValues(alpha: 0.3),
          width: isDm ? 2.0 : 1.0,
        ),
        boxShadow: isDm ? CelestialShadows.goldGlow : null,
      ),
      child: Column(
        children: [
          // Tên Trụ
          Text(
            pillar.name,
            style: TextStyle(
              color: isDm
                  ? AppTheme.goldBright
                  : AppTheme.mysticalTextSecondary,
              fontSize: 11,
              fontWeight: isDm ? FontWeight.bold : FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),

          // Thập thần
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            decoration: BoxDecoration(
              color: isDm
                  ? AppTheme.cinnabarCrimson.withValues(alpha: 0.3)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(6),
              border: isDm ? Border.all(color: AppTheme.goldBright) : null,
            ),
            child: Text(
              pillar.tenGod,
              style: TextStyle(
                color: isDm ? AppTheme.goldBright : AppTheme.etherealJade,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(height: 8),

          // Thiên can
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 6),
            decoration: BoxDecoration(
              color: _getElementColor(pillar.stemElement).withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: _getElementColor(pillar.stemElement),
              ),
            ),
            child: Column(
              children: [
                Text(
                  pillar.stem,
                  style: TextStyle(
                    color: isDm ? AppTheme.goldBright : AppTheme.mysticalText,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  pillar.stemElement,
                  style: TextStyle(
                    color: _getElementColor(pillar.stemElement),
                    fontSize: 9,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),

          // Địa chi
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 6),
            decoration: BoxDecoration(
              color:
                  _getElementColor(pillar.branchElement).withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: _getElementColor(pillar.branchElement),
              ),
            ),
            child: Column(
              children: [
                Text(
                  pillar.branch,
                  style: TextStyle(
                    color: isDm ? AppTheme.goldBright : AppTheme.mysticalText,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  pillar.branchElement,
                  style: TextStyle(
                    color: _getElementColor(pillar.branchElement),
                    fontSize: 9,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Tàng can
          Text(
            pillar.hiddenStems.join(' '),
            style: const TextStyle(
              color: AppTheme.mysticalTextSecondary,
              fontSize: 10,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),

          // Trường sinh
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            decoration: BoxDecoration(
              color: AppTheme.cosmosDark,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              pillar.lifeStage,
              style: const TextStyle(
                color: AppTheme.goldDeep,
                fontSize: 9,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getElementColor(String element) {
    switch (element) {
      case 'Kim':
        return AppTheme.goldBright;
      case 'Mộc':
        return AppTheme.etherealJade;
      case 'Thủy':
        return Colors.lightBlueAccent;
      case 'Hỏa':
        return AppTheme.cinnabarLight;
      case 'Thổ':
        return const Color(0xFFD4A373);
      default:
        return AppTheme.goldBright;
    }
  }

  // 3. Thước Đo Cân Bằng Ngũ Hành
  Widget _buildFiveElementsSection(BaziChartData chart) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: AppTheme.cosmosSurface.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: AppTheme.mysticalGold.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.pie_chart_rounded,
                  color: AppTheme.goldBright, size: 20),
              SizedBox(width: 8),
              Text(
                'CÂN BẰNG NGŨ HÀNH',
                style: TextStyle(
                  color: AppTheme.goldBright,
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Thanh phân bổ tiến trình đa màu sắc
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              height: 14,
              child: Row(
                children: chart.elementRatios.map((e) {
                  return Expanded(
                    flex: e.percentage,
                    child: Container(
                      color: _getElementColor(e.element),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Lưới thông số 5 hành
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: chart.elementRatios.map((e) {
              return Column(
                children: [
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _getElementColor(e.element),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        e.element,
                        style: const TextStyle(
                          color: AppTheme.mysticalText,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${e.percentage}%',
                    style: TextStyle(
                      color: _getElementColor(e.element),
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    e.status,
                    style: const TextStyle(
                      color: AppTheme.mysticalTextSecondary,
                      fontSize: 10,
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // 4. Định Tam Thần: Dụng - Hỷ - Kỵ
  Widget _buildThreeDeitiesSection(BaziChartData chart) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: AppTheme.cosmosSurface.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: AppTheme.mysticalGold.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.shield_rounded,
                  color: AppTheme.goldBright, size: 20),
              SizedBox(width: 8),
              Text(
                'TAM THẦN ĐỊNH MỆNH',
                style: TextStyle(
                  color: AppTheme.goldBright,
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildDeityTile(chart.yongShen, AppTheme.goldBright),
          const SizedBox(height: 8),
          _buildDeityTile(chart.xiShen, AppTheme.etherealJade),
          const SizedBox(height: 8),
          _buildDeityTile(chart.jiShen, AppTheme.cinnabarLight),
        ],
      ),
    );
  }

  Widget _buildDeityTile(DeityDefinition deity, Color accentColor) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppTheme.cosmosElevated,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: accentColor.withValues(alpha: 0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: accentColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: accentColor),
            ),
            child: Text(
              deity.type,
              style: TextStyle(
                color: accentColor,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  deity.element,
                  style: TextStyle(
                    color: accentColor,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  deity.description,
                  style: const TextStyle(
                    color: AppTheme.mysticalTextSecondary,
                    fontSize: 11,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 5. Vận Khí Năm 2026 Bính Ngọ
  Widget _buildYear2026ForecastSection(BaziChartData chart) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.cosmosSurface,
            AppTheme.cinnabarCrimson.withValues(alpha: 0.15),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.goldBright, width: 1.2),
        boxShadow: CelestialShadows.goldGlow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.cinnabarCrimson,
                  border: Border.all(color: AppTheme.goldBright),
                ),
                child: const Icon(Icons.fireplace_rounded,
                    color: AppTheme.goldBright, size: 18),
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'VẬN KHÍ NĂM 2026 BÍNH NGỌ',
                      style: TextStyle(
                        color: AppTheme.goldBright,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                      ),
                    ),
                    Text(
                      'Lưu Niên Thiên Hà Thủy · Hỏa Vượng Tương Hợp',
                      style: TextStyle(
                        color: AppTheme.mysticalTextSecondary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            chart.annualAnalysis,
            style: const TextStyle(
              color: AppTheme.mysticalText,
              fontSize: 12,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          Divider(color: AppTheme.mysticalGold.withValues(alpha: 0.3), height: 1),
          const SizedBox(height: 14),

          // 4 Trụ Cột Vận Hạn 2026
          Column(
            children: chart.forecast2026.map((f) {
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.cosmosElevated.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                      color: AppTheme.mysticalGold.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          f.title,
                          style: const TextStyle(
                            color: AppTheme.goldBright,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: _getScoreColor(f.score).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: _getScoreColor(f.score)),
                          ),
                          child: Text(
                            '${f.verdict} (${f.score}/100)',
                            style: TextStyle(
                              color: _getScoreColor(f.score),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      f.advice,
                      style: const TextStyle(
                        color: AppTheme.mysticalTextSecondary,
                        fontSize: 11,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Color _getScoreColor(int score) {
    if (score >= 85) return AppTheme.goldBright;
    if (score >= 75) return AppTheme.etherealJade;
    if (score >= 60) return Colors.lightBlueAccent;
    return AppTheme.cinnabarLight;
  }

  // 6. Khâm Thiên Giám Ngự Phê (AI Deep-Dive)
  Widget _buildAiExplanationSection(
    BuildContext context,
    BaziState baziState,
    BaziChartData chart,
    int wallet,
  ) {
    if (chart.aiExplanation != null) {
      return Container(
        padding: const EdgeInsets.all(16.0),
        decoration: BoxDecoration(
          color: AppTheme.cosmosSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.goldBright, width: 1.5),
          boxShadow: CelestialShadows.goldGlow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppTheme.cinnabarCrimson,
                    border: Border.all(color: AppTheme.goldBright),
                  ),
                  child: const Center(
                    child: Text('👑', style: TextStyle(fontSize: 16)),
                  ),
                ),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'KHÂM THIÊN GIÁM NGỰ PHÊ',
                    style: TextStyle(
                      color: AppTheme.goldBright,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            MarkdownBody(
              data: chart.aiExplanation!,
              styleSheet: MarkdownStyleSheet(
                p: const TextStyle(
                  color: AppTheme.mysticalText,
                  fontSize: 12,
                  height: 1.5,
                ),
                h3: const TextStyle(
                  color: AppTheme.goldBright,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
                strong: const TextStyle(
                  color: AppTheme.goldBright,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Chưa mở khóa: Box mời gọi mở khóa 5 XU
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: AppTheme.cosmosSurface.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: AppTheme.mysticalGold.withValues(alpha: 0.4)),
      ),
      child: Column(
        children: [
          const Icon(Icons.lock_person_rounded,
              color: AppTheme.goldBright, size: 36),
          const SizedBox(height: 8),
          const Text(
            'Khâm Thiên Giám Ngự Phê 2026',
            style: TextStyle(
              color: AppTheme.goldBright,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Luận giải độc bản cách cục Tử Bình và cẩm nang khai vận 2026 bởi AI Tối Thượng.',
            style: TextStyle(
              color: AppTheme.mysticalTextSecondary,
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 14),
          baziState.isExplaining
              ? const Column(
                  children: [
                    CircularProgressIndicator(color: AppTheme.goldBright),
                    SizedBox(height: 10),
                    Text(
                      'Khâm Thiên Giám đang thẩm định thiên tượng...',
                      style: TextStyle(
                        color: AppTheme.goldBright,
                        fontSize: 12,
                      ),
                    ),
                  ],
                )
              : ElevatedButton.icon(
                  onPressed: () => _confirmUnlockAi(context, wallet),
                  icon: const Icon(Icons.auto_awesome, size: 18),
                  label: const Text('MỞ KHÓA LUẬN GIẢI CHUYÊN SÂU (5 XU)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.goldBright,
                    foregroundColor: AppTheme.cosmosDark,
                    minimumSize: const Size(double.infinity, 48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
        ],
      ),
    );
  }

  void _confirmUnlockAi(BuildContext context, int wallet) {
    HapticFeedback.lightImpact();
    if (wallet < 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppTheme.cosmosElevated,
          content: const Text(
            'Số dư XU không đủ (cần 5 XU). Thân chủ vui lòng nạp thêm.',
            style: TextStyle(color: AppTheme.goldBright),
          ),
          action: SnackBarAction(
            label: 'Nạp XU',
            textColor: AppTheme.goldBright,
            onPressed: () {
              context.push('/wallet');
            },
          ),
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cosmosSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
              color: AppTheme.mysticalGold.withValues(alpha: 0.4)),
        ),
        title: const Row(
          children: [
            Icon(Icons.stars_rounded, color: AppTheme.goldBright),
            SizedBox(width: 8),
            Text(
              'Xác Nhận Thỉnh Sớ AI',
              style: TextStyle(color: AppTheme.goldBright, fontSize: 16),
            ),
          ],
        ),
        content: const Text(
          'Thân chủ có muốn dùng 5 XU để thỉnh bài Ngự Phê Bát Tự & Vận Trình 2026 từ Khâm Thiên Giám?',
          style: TextStyle(color: AppTheme.mysticalText, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('HỦY BỎ',
                style: TextStyle(color: AppTheme.mysticalTextSecondary)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              ref.read(baziProvider.notifier).unlockAiExplanation();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.goldBright,
              foregroundColor: AppTheme.cosmosDark,
            ),
            child: const Text('XÁC NHẬN (5 XU)'),
          ),
        ],
      ),
    );
  }

  // 7. Nút Mở Hồ Sơ Mệnh Lý Hoàng Gia 19 Trang
  Widget _buildOpenDossierButton(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        boxShadow: CelestialShadows.goldGlow,
      ),
      child: ElevatedButton.icon(
        onPressed: () {
          HapticFeedback.mediumImpact();
          context.push('/dossier');
        },
        icon: const Text('👑', style: TextStyle(fontSize: 18)),
        label: const Text(
          'MỞ HỒ SƠ BÁT TỰ HOÀNG GIA 17 TRANG',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            letterSpacing: 0.8,
            fontSize: 13,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.goldBright,
          foregroundColor: AppTheme.cosmosDark,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
    );
  }
}
