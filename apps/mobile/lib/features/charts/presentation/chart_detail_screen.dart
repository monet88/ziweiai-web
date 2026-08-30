import 'dart:io';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:screenshot/screenshot.dart';
import 'package:share_plus/share_plus.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/features/assistant/presentation/assistant_panel.dart';
import 'package:ziweiai_mobile/features/charts/data/models/chart_snapshot.dart';
import 'package:ziweiai_mobile/features/charts/presentation/ziwei_board.dart';
import 'package:ziweiai_mobile/ui/animated_background.dart';
import 'package:ziweiai_mobile/ui/glass_panel.dart';

class ChartDetailScreen extends StatefulWidget {
  final ChartDetailResponse chartData;

  const ChartDetailScreen({super.key, required this.chartData});

  @override
  State<ChartDetailScreen> createState() => _ChartDetailScreenState();
}

class _ChartDetailScreenState extends State<ChartDetailScreen>
    with SingleTickerProviderStateMixin {
  final ScreenshotController _screenshotController = ScreenshotController();
  late final AnimationController _entrance;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _entrance = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 520),
    );
    _fade = CurvedAnimation(parent: _entrance, curve: Curves.easeOutCubic);
    _slide = Tween<Offset>(
      begin: const Offset(0, 0.04),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _entrance, curve: Curves.easeOutCubic));
    _entrance.forward();
  }

  @override
  void dispose() {
    _entrance.dispose();
    super.dispose();
  }

  Future<void> _shareChart(BuildContext context) async {
    try {
      final Uint8List? imageBytes =
          await _screenshotController.capture(pixelRatio: 2.0);
      if (imageBytes != null) {
        final directory = await getTemporaryDirectory();
        final imagePath = await File(
          '${directory.path}/laso_${widget.chartData.chartRecord.id}.png',
        ).create();
        await imagePath.writeAsBytes(imageBytes);

        await SharePlus.instance.share(
          ShareParams(
            files: [XFile(imagePath.path)],
            text: 'Xem lá số tử vi của tôi tại ZiweiAI',
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi chia sẻ: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.disableAnimationsOf(context);

    return Theme(
      data: AppTheme.mystical,
      child: Scaffold(
        extendBodyBehindAppBar: true,
        appBar: AppBar(
          title: const Text('Chi tiết lá số'),
          flexibleSpace: ClipRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
              child: Container(color: AppTheme.mysticalBg.withValues(alpha: 0.55)),
            ),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.share_outlined),
              onPressed: () => _shareChart(context),
              tooltip: 'Chia sẻ lá số',
            ),
          ],
        ),
        body: AnimatedBackground(
          child: SafeArea(
            child: reduceMotion
                ? _buildContent()
                : FadeTransition(
                    opacity: _fade,
                    child: SlideTransition(
                      position: _slide,
                      child: _buildContent(),
                    ),
                  ),
          ),
        ),
        floatingActionButton: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(30),
            gradient: CelestialGradients.imperialGold,
            boxShadow: CelestialShadows.goldGlow,
          ),
          child: FloatingActionButton.extended(
            backgroundColor: Colors.transparent,
            foregroundColor: const Color(0xFF141026),
            elevation: 0,
            onPressed: () {
              HapticFeedback.mediumImpact();
              showAssistantPanel(context, widget.chartData.chartRecord.id);
            },
            icon: const Icon(Icons.chat_bubble_outline, size: 20),
            label: const Text('Hỏi AI', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.5)),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    final systemKey = widget.chartData.chartRecord.chartSystem;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: [
        Text(
          'Bàn 12 cung',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        GlassPanel(
          padding: const EdgeInsets.all(12),
          borderRadius: BorderRadius.circular(20),
          borderGradient: CelestialGradients.goldBorder,
          child: SizedBox(
            height: 420,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: ZiweiBoard(
                snapshot: widget.chartData.chartRecord.snapshot,
                screenshotController: _screenshotController,
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        GlassPanel(
          borderGradient: CelestialGradients.starlightBorder,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Thao tác & Trợ Giúp',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontSize: 17,
                      color: AppTheme.goldBright,
                    ),
              ),
              const SizedBox(height: 10),
              Text(
                'Hệ thuật số: $systemKey',
                style: const TextStyle(
                  color: AppTheme.mysticalTextSecondary,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Chạm hoặc vuốt để phóng to thu nhỏ Thiên Bàn. Nhấn biểu tượng góc phải để xuất ảnh lá số.',
                style: TextStyle(
                  color: AppTheme.mysticalTextSecondary,
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
