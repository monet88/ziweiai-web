import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../wallet/providers/wallet_provider.dart';
import '../data/models/bazi_models.dart';
import '../data/repositories/bazi_repository.dart';

final baziRepositoryProvider = Provider<BaziRepository>((ref) {
  return BaziRepository();
});

class BaziState {
  final bool isLoading;
  final bool isExplaining;
  final BaziChartData? chart;
  final String? error;

  const BaziState({
    this.isLoading = false,
    this.isExplaining = false,
    this.chart,
    this.error,
  });

  BaziState copyWith({
    bool? isLoading,
    bool? isExplaining,
    BaziChartData? chart,
    String? error,
  }) {
    return BaziState(
      isLoading: isLoading ?? this.isLoading,
      isExplaining: isExplaining ?? this.isExplaining,
      chart: chart ?? this.chart,
      error: error,
    );
  }
}

class BaziNotifier extends Notifier<BaziState> {
  @override
  BaziState build() {
    // Tự động tải chart mặc định khi build
    Future.microtask(() => loadDefaultChart());
    return const BaziState(isLoading: true);
  }

  Future<void> loadDefaultChart() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final repository = ref.read(baziRepositoryProvider);
      final data = await repository.getBaziChart();
      state = state.copyWith(isLoading: false, chart: data);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> unlockAiExplanation() async {
    final currentChart = state.chart;
    if (currentChart == null) return false;

    state = state.copyWith(isExplaining: true, error: null);
    try {
      final repository = ref.read(baziRepositoryProvider);
      final explanation =
          await repository.requestAiExplanation(chart: currentChart);
      final updatedChart = currentChart.copyWith(aiExplanation: explanation);

      // Cập nhật số dư ví sau khi trừ XU
      ref.invalidate(walletBalanceProvider);

      state = state.copyWith(isExplaining: false, chart: updatedChart);
      return true;
    } catch (e) {
      state = state.copyWith(isExplaining: false, error: e.toString());
      return false;
    }
  }
}

final baziProvider =
    NotifierProvider<BaziNotifier, BaziState>(BaziNotifier.new);
