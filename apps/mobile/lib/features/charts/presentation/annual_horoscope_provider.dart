import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/horoscope_models.dart';
import '../data/repositories/charts_repository.dart';
import '../../wallet/providers/wallet_provider.dart';

class AnnualHoroscopeState {
  final int selectedYear;
  final AsyncValue<AnnualReportResponse?> annualReport;

  const AnnualHoroscopeState({
    required this.selectedYear,
    this.annualReport = const AsyncValue.data(null),
  });

  AnnualHoroscopeState copyWith({
    int? selectedYear,
    AsyncValue<AnnualReportResponse?>? annualReport,
  }) {
    return AnnualHoroscopeState(
      selectedYear: selectedYear ?? this.selectedYear,
      annualReport: annualReport ?? this.annualReport,
    );
  }
}

class AnnualHoroscopeNotifier extends Notifier<AnnualHoroscopeState> {
  @override
  AnnualHoroscopeState build() {
    return AnnualHoroscopeState(selectedYear: DateTime.now().year);
  }

  void selectYear(int year) {
    state = state.copyWith(
      selectedYear: year,
      annualReport: const AsyncValue.data(null),
    );
  }

  Future<void> generateAnnualReport(String chartSnapshotId, int year) async {
    state = state.copyWith(
      selectedYear: year,
      annualReport: const AsyncValue.loading(),
    );

    try {
      final repository = ref.read(chartsRepositoryProvider);
      final rawData = await repository.createAnnualReport(chartSnapshotId, year);
      final response = AnnualReportResponse.fromJson(rawData);

      // Invalidate wallet balance since 15 XU is deducted
      ref.invalidate(walletBalanceProvider);

      state = state.copyWith(annualReport: AsyncValue.data(response));
    } on DioException catch (e) {
      if (e.response?.statusCode == 402 || e.response?.statusCode == 403) {
        state = state.copyWith(annualReport: AsyncValue.error(e, StackTrace.current));
        return;
      }

      String errorMessage = 'Có lỗi kết nối. Vui lòng thử lại sau.';
      if (e.response?.data != null && e.response?.data is Map) {
        final data = e.response!.data as Map;
        if (data['message'] != null) {
          errorMessage = data['message'].toString();
        }
      }
      state = state.copyWith(annualReport: AsyncValue.error(errorMessage, StackTrace.current));
    } catch (e, st) {
      state = state.copyWith(annualReport: AsyncValue.error('Có lỗi xảy ra: $e', st));
    }
  }

  void reset() {
    state = AnnualHoroscopeState(selectedYear: DateTime.now().year);
  }
}

final annualHoroscopeProvider =
    NotifierProvider<AnnualHoroscopeNotifier, AnnualHoroscopeState>(() {
  return AnnualHoroscopeNotifier();
});
