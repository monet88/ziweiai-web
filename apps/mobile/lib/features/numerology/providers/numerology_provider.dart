import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/numerology_models.dart';
import '../data/repositories/numerology_repository.dart';
import '../../wallet/providers/wallet_provider.dart';

class NumerologyNotifier extends Notifier<AsyncValue<NumerologyExplanation?>> {
  @override
  AsyncValue<NumerologyExplanation?> build() {
    return const AsyncValue.data(null);
  }

  Future<void> getExplanation({
    required int lifePath,
    required int destiny,
    required int soulUrge,
    required int personality,
    required String fullName,
  }) async {
    state = const AsyncValue.loading();
    try {
      final repository = ref.read(numerologyRepositoryProvider);
      final result = await repository.getExplanation(
        lifePath: lifePath,
        destiny: destiny,
        soulUrge: soulUrge,
        personality: personality,
        fullName: fullName,
      );
      
      // Update wallet balance since 10 XU is deducted
      ref.invalidate(walletBalanceProvider);
      
      state = AsyncValue.data(result);
    } on DioException catch (e) {
      if (e.response?.statusCode == 402 || e.response?.statusCode == 403) {
        state = AsyncValue.error(e, StackTrace.current);
        return;
      }
      
      String errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
      if (e.response?.data != null && e.response?.data is Map) {
        final data = e.response!.data as Map;
        if (data['message'] != null) {
          errorMessage = data['message'].toString();
        }
      }
      state = AsyncValue.error(errorMessage, StackTrace.current);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void reset() {
    state = const AsyncValue.data(null);
  }
}

final numerologyProvider = NotifierProvider<NumerologyNotifier, AsyncValue<NumerologyExplanation?>>(() {
  return NumerologyNotifier();
});
