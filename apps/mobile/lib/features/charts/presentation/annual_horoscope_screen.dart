import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/presentation/widgets/premium_paywall_sheet.dart';
import '../../../../core/presentation/widgets/voice_audio_player_bar.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../ui/animated_background.dart';
import '../../../../ui/glass_panel.dart';
import '../../../../ui/premium_button.dart';
import '../data/models/chart_snapshot.dart';
import '../data/models/horoscope_models.dart';
import '../services/ziwei_pdf_service.dart';
import 'annual_horoscope_provider.dart';

class AnnualHoroscopeScreen extends ConsumerStatefulWidget {
  final ChartDetailResponse chartData;

  const AnnualHoroscopeScreen({super.key, required this.chartData});

  @override
  ConsumerState<AnnualHoroscopeScreen> createState() => _AnnualHoroscopeScreenState();
}

class _AnnualHoroscopeScreenState extends ConsumerState<AnnualHoroscopeScreen> {
  bool _isGeneratingPdf = false;

  final List<int> _availableYears = [
    DateTime.now().year - 1,
    DateTime.now().year,
    DateTime.now().year + 1,
    DateTime.now().year + 2,
  ];

  @override
  Widget build(BuildContext context) {
    final horoscopeState = ref.watch(annualHoroscopeProvider);
    final selectedYear = horoscopeState.selectedYear;
    final annualReportAsync = horoscopeState.annualReport;
    final currentReport = annualReportAsync.asData?.value;

    return Theme(
      data: AppTheme.mystical,
      child: Scaffold(
        extendBodyBehindAppBar: true,
        appBar: AppBar(
          title: const Text('Vận Hạn Lưu Niên'),
          flexibleSpace: ClipRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
              child: Container(color: AppTheme.mysticalBg.withValues(alpha: 0.55)),
            ),
          ),
          actions: [
            IconButton(
              icon: _isGeneratingPdf
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(AppTheme.goldBright),
                      ),
                    )
                  : const Icon(Icons.picture_as_pdf_outlined),
              tooltip: 'Xuất Báo Cáo PDF',
              onPressed: _isGeneratingPdf ? null : () => _exportPdf(currentReport),
            ),
          ],
        ),
        body: AnimatedBackground(
          child: SafeArea(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
              children: [
                // 1. Selector chọn năm
                _buildYearSelector(selectedYear),
                const SizedBox(height: 16),

                // 2. Thẻ Thông Tin Lưu Niên Năm Đang Chọn
                _buildYearOverviewCard(selectedYear),
                const SizedBox(height: 16),

                // 3. Khung Vận Hạn 12 Tháng (Lưu Nguyệt)
                _buildMonthlyHoroscopePreview(currentReport),
                const SizedBox(height: 20),

                // 4. Khung CTA / Luận Giải AI
                _buildAiExplanationSection(selectedYear, annualReportAsync),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildYearSelector(int selectedYear) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Chọn Năm Xem Vận Hạn',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16, color: AppTheme.goldBright),
        ),
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: _availableYears.map((year) {
              final isSelected = year == selectedYear;
              return Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: ChoiceChip(
                  label: Text(
                    'Năm $year',
                    style: TextStyle(
                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                      color: isSelected ? const Color(0xFF141026) : AppTheme.mysticalText,
                    ),
                  ),
                  selected: isSelected,
                  selectedColor: AppTheme.goldBright,
                  backgroundColor: AppTheme.cosmosSurface,
                  side: BorderSide(
                    color: isSelected ? AppTheme.goldBright : AppTheme.glassBorderGold,
                    width: 0.8,
                  ),
                  onSelected: (selected) {
                    if (selected) {
                      HapticFeedback.selectionClick();
                      ref.read(annualHoroscopeProvider.notifier).selectYear(year);
                    }
                  },
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildYearOverviewCard(int selectedYear) {
    final summary = widget.chartData.chartRecord.snapshot.summary ?? {};
    final birth = widget.chartData.chartRecord.snapshot.birth ?? {};
    final name = birth['name']?.toString() ?? 'Đương số';
    final fiveElements = summary['fiveElements']?.toString() ?? 'N/A';

    return GlassPanel(
      borderGradient: CelestialGradients.goldBorder,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Lưu Niên Năm $selectedYear',
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.goldBright,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: CelestialGradients.imperialGold,
                ),
                child: const Text(
                  'CHUYÊN SÂU',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF141026),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'Đương số: $name • Bản Mệnh: $fiveElements',
            style: const TextStyle(
              fontSize: 13,
              color: AppTheme.mysticalTextSecondary,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Lưu Thái Tuế, Lưu Lộc Tồn, Lưu Kình Dương, Lưu Đà La và 12 Lưu Nguyệt dịch chuyển theo quỹ đạo thiên bàn.',
            style: TextStyle(
              fontSize: 12,
              color: AppTheme.mysticalTextSecondary,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMonthlyHoroscopePreview(AnnualReportResponse? report) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Vận Hạn 12 Lưu Nguyệt (Âm Lịch)',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16, color: AppTheme.goldBright),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 94,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: 12,
            itemBuilder: (context, index) {
              final monthNum = index + 1;
              final monthFrame = report != null && report.frame.monthly.length > index
                  ? report.frame.monthly[index]
                  : null;

              final stemBranch = monthFrame != null
                  ? '${monthFrame.heavenlyStemKey.split('.').last} ${monthFrame.earthlyBranchKey.split('.').last}'
                  : 'Tháng $monthNum';

              final palaceName = monthFrame != null && monthFrame.palaceNameKeys.isNotEmpty
                  ? monthFrame.palaceNameKeys.first.split('.').last
                  : 'Cung vị';

              return Container(
                width: 100,
                margin: const EdgeInsets.only(right: 10),
                child: GlassPanel(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  borderGradient: CelestialGradients.starlightBorder,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Tháng $monthNum',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.goldBright,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        stemBranch,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.mysticalText,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        palaceName,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppTheme.mysticalTextSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildAiExplanationSection(
    int selectedYear,
    AsyncValue<AnnualReportResponse?> annualReportAsync,
  ) {
    return annualReportAsync.when(
      data: (report) {
        if (report == null) {
          return GlassPanel(
            borderGradient: CelestialGradients.goldBorder,
            child: Column(
              children: [
                const Icon(Icons.auto_awesome, size: 36, color: AppTheme.goldBright),
                const SizedBox(height: 10),
                Text(
                  'Khởi Tạo Báo Cáo Vận Hạn Năm $selectedYear',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.goldBright,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'AI Tử Vi sẽ phân tích toàn diện Lưu Niên, Lưu Nguyệt, biến động Sự Nghiệp, Tài Lộc, Gia Đạo và Sức Khỏe trong năm.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: AppTheme.mysticalTextSecondary,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 16),
                PremiumButton(
                  label: 'Luận Giải Với AI (15 XU)',
                  onPressed: () {
                    HapticFeedback.mediumImpact();
                    ref.read(annualHoroscopeProvider.notifier).generateAnnualReport(
                          widget.chartData.chartRecord.id,
                          selectedYear,
                        );
                  },
                ),
              ],
            ),
          );
        }

        // Đã có bài luận giải
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Luận Giải Chi Tiết Năm $selectedYear',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.goldBright,
                  ),
                ),
                VoicePlayIconButton(
                  text: report.markdown,
                  title: 'Vận Hạn Năm $selectedYear',
                ),
              ],
            ),
            const SizedBox(height: 10),
            GlassPanel(
              borderGradient: CelestialGradients.starlightBorder,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MarkdownBody(
                    data: report.markdown,
                    styleSheet: MarkdownStyleSheet(
                      p: const TextStyle(
                        color: AppTheme.mysticalText,
                        fontSize: 14,
                        height: 1.6,
                      ),
                      h1: const TextStyle(
                        color: AppTheme.goldBright,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                      h2: const TextStyle(
                        color: AppTheme.goldBright,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                      h3: const TextStyle(
                        color: AppTheme.goldBright,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                      strong: const TextStyle(
                        color: AppTheme.goldBright,
                        fontWeight: FontWeight.w700,
                      ),
                      listBullet: const TextStyle(
                        color: AppTheme.goldBright,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const VoiceAudioPlayerBar(),
                  const SizedBox(height: 16),
                  Center(
                    child: PremiumButton(
                      label: 'Xuất Báo Cáo PDF Chuyên Sâu (A4)',
                      onPressed: () => _exportPdf(report),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
      loading: () => GlassPanel(
        borderGradient: CelestialGradients.goldBorder,
        child: Column(
          children: [
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppTheme.goldBright),
            ),
            const SizedBox(height: 16),
            Text(
              'Đang luận giải Vận Hạn Năm $selectedYear...',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppTheme.goldBright,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'AI đang đối chiếu sao Lưu Niên và 12 cung Lưu Nguyệt...',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: AppTheme.mysticalTextSecondary,
              ),
            ),
          ],
        ),
      ),
      error: (error, _) {
        if (error.toString().contains('402') || error.toString().contains('403')) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (context) => const PremiumPaywallSheet(
                cost: 15,
                featureName: 'Vận Hạn Lưu Niên',
              ),
            );
          });
        }

        return GlassPanel(
          borderGradient: CelestialGradients.goldBorder,
          child: Column(
            children: [
              const Icon(Icons.error_outline, size: 36, color: Color(0xFFFF6B6B)),
              const SizedBox(height: 10),
              Text(
                'Chưa thể tạo báo cáo năm: $error',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFFFF6B6B),
                ),
              ),
              const SizedBox(height: 12),
              PremiumButton(
                label: 'Thử Lại',
                onPressed: () {
                  ref.read(annualHoroscopeProvider.notifier).generateAnnualReport(
                        widget.chartData.chartRecord.id,
                        selectedYear,
                      );
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _exportPdf(AnnualReportResponse? annualReport) async {
    setState(() => _isGeneratingPdf = true);
    HapticFeedback.mediumImpact();

    try {
      final pdfBytes = await ZiweiPdfService.generateZiweiReportPdf(
        snapshot: widget.chartData.chartRecord.snapshot,
        annualReport: annualReport,
        systemKey: widget.chartData.chartRecord.chartSystem,
      );

      if (mounted) {
        await ZiweiPdfService.shareOrPrintPdf(
          context,
          pdfBytes: pdfBytes,
          filename: 'BaoCao_TuVi_${widget.chartData.chartRecord.id}.pdf',
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tạo PDF: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isGeneratingPdf = false);
      }
    }
  }
}
