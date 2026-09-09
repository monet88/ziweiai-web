import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/stick_models.dart';
import '../data/repositories/stick_repository.dart';
import '../../wallet/providers/wallet_provider.dart';

class StickNotifier extends Notifier<AsyncValue<StickDraw?>> {
  @override
  AsyncValue<StickDraw?> build() {
    return const AsyncValue.data(null);
  }

  Future<void> draw(String question) async {
    state = const AsyncValue.loading();
    try {
      final repository = ref.read(stickRepositoryProvider);
      final result = await repository.drawStick(question: question);

      // Invalidate wallet balance as XU is deducted
      ref.invalidate(walletBalanceProvider);

      state = AsyncValue.data(result);
    } on DioException catch (e) {
      if (e.response?.statusCode == 402 || e.response?.statusCode == 403) {
        state = AsyncValue.error(e, StackTrace.current);
        return;
      }

      String errorMessage = 'Có lỗi xảy ra khi xin xăm. Vui lòng thử lại sau.';
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

final stickNotifierProvider =
    NotifierProvider<StickNotifier, AsyncValue<StickDraw?>>(() {
  return StickNotifier();
});
