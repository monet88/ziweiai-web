import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/iching_models.dart';
import '../data/repositories/iching_repository.dart';
import '../../wallet/providers/wallet_provider.dart';

class IChingNotifier extends Notifier<AsyncValue<IChingDraw?>> {
  @override
  AsyncValue<IChingDraw?> build() {
    return const AsyncValue.data(null);
  }

  Future<void> draw(String question, List<int> castArray) async {
    state = const AsyncValue.loading();
    try {
      final repository = ref.read(ichingRepositoryProvider);
      final result = await repository.drawIChing(
        question: question,
        castArray: castArray,
      );
      
      // Update wallet balance since XU is deducted
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

final ichingNotifierProvider = NotifierProvider<IChingNotifier, AsyncValue<IChingDraw?>>(() {
  return IChingNotifier();
});
