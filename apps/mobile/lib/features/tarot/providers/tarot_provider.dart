import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/tarot_models.dart';
import '../data/repositories/tarot_repository.dart';
import '../../wallet/providers/wallet_provider.dart';

class TarotNotifier extends Notifier<AsyncValue<TarotDraw?>> {
  @override
  AsyncValue<TarotDraw?> build() {
    return const AsyncValue.data(null);
  }

  Future<void> drawCard(String question) async {
    state = const AsyncValue.loading();
    try {
      final repository = ref.read(tarotRepositoryProvider);
      final result = await repository.drawTarot(
        question: question,
        spread: 'single', // Use 1-card draw as planned for V1
      );
      
      // Update wallet balance since 2 XU is deducted
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

final tarotProvider = NotifierProvider<TarotNotifier, AsyncValue<TarotDraw?>>(() {
  return TarotNotifier();
});
