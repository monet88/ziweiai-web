import 'package:flutter/material.dart';
import 'package:ziweiai_mobile/features/charts/data/models/chart_snapshot.dart';
import 'package:ziweiai_mobile/features/charts/presentation/ziwei_board.dart';
import 'package:ziweiai_mobile/features/assistant/presentation/assistant_panel.dart';

class ChartDetailScreen extends StatelessWidget {
  final ChartDetailResponse chartData;

  const ChartDetailScreen({super.key, required this.chartData});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Chi tiết lá số')),
      body: ZiweiBoard(snapshot: chartData.chartRecord.snapshot),
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
