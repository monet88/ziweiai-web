import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/create_chart_request.dart';
import '../data/models/chart_snapshot.dart';
import '../data/repositories/charts_repository.dart';

class ChartsNotifier extends Notifier<AsyncValue<ChartDetailResponse?>> {
  @override
  AsyncValue<ChartDetailResponse?> build() {
    return const AsyncValue.data(null);
  }

  Future<void> createChart(CreateChartRequest request) async {
    state = const AsyncValue.loading();
    try {
      final repository = ref.read(chartsRepositoryProvider);
      final responseMap = await repository.createChart(request);
      final response = ChartDetailResponse.fromJson(responseMap);
      state = AsyncValue.data(response);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final chartsProvider = NotifierProvider<ChartsNotifier, AsyncValue<ChartDetailResponse?>>(() {
  return ChartsNotifier();
});
