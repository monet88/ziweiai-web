import 'package:flutter/material.dart';
import 'package:ziweiai_mobile/features/charts/data/models/chart_snapshot.dart';
import 'package:ziweiai_mobile/features/charts/presentation/ziwei_board.dart';
import 'package:ziweiai_mobile/features/assistant/presentation/assistant_panel.dart';
import 'dart:io';
import 'dart:typed_data';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:screenshot/screenshot.dart';

class ChartDetailScreen extends StatelessWidget {
  final ChartDetailResponse chartData;
  final ScreenshotController _screenshotController = ScreenshotController();

  ChartDetailScreen({super.key, required this.chartData});

  Future<void> _shareChart(BuildContext context) async {
    try {
      final Uint8List? imageBytes = await _screenshotController.capture(pixelRatio: 2.0);
      if (imageBytes != null) {
        final directory = await getTemporaryDirectory();
        final imagePath = await File('${directory.path}/laso_${chartData.chartRecord.id}.png').create();
        await imagePath.writeAsBytes(imageBytes);
        
        await Share.shareXFiles(
          [XFile(imagePath.path)],
          text: 'Xem lá số tử vi của tôi tại ZiweiAI',
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chi tiết lá số'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () => _shareChart(context),
            tooltip: 'Chia sẻ lá số',
          ),
        ],
      ),
      body: ZiweiBoard(
        snapshot: chartData.chartRecord.snapshot,
        screenshotController: _screenshotController,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          showAssistantPanel(context, chartData.chartRecord.id);
        },
        icon: const Icon(Icons.chat_bubble_outline),
        label: const Text('Hỏi AI'),
      ),
    );
  }
}
