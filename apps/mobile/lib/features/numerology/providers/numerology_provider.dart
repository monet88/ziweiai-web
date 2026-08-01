import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/numerology_models.dart';
import '../data/repositories/numerology_repository.dart';
import '../../wallet/providers/wallet_provider.dart';
import '../domain/numerology_calculator.dart';
import '../domain/numerology_result.dart';

class NumerologyState {
  final NumerologyResult? calculatedResult;
  final AsyncValue<NumerologyExplanation?> explanation;

  const NumerologyState({
    this.calculatedResult,
    this.explanation = const AsyncValue.data(null),
  });

  NumerologyState copyWith({
    NumerologyResult? calculatedResult,
    AsyncValue<NumerologyExplanation?>? explanation,
  }) {
    return NumerologyState(
      calculatedResult: calculatedResult ?? this.calculatedResult,
      explanation: explanation ?? this.explanation,
    );
  }
}

class NumerologyNotifier extends Notifier<NumerologyState> {
  @override
  NumerologyState build() {
    return const NumerologyState();
  }

  void calculate(String fullName, DateTime dateOfBirth) {
    final result = NumerologyCalculator.calculate(fullName, dateOfBirth);
    state = NumerologyState(
      calculatedResult: result,
      explanation: const AsyncValue.data(null),
    );
  }

  Future<void> getExplanation({
    required int lifePath,
    required int destiny,
    required int soulUrge,
    required int personality,
    required String fullName,
  }) async {
    state = state.copyWith(explanation: const AsyncValue.loading());
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
      
      state = state.copyWith(explanation: AsyncValue.data(result));
    } on DioException catch (e) {
      if (e.response?.statusCode == 402 || e.response?.statusCode == 403) {
        state = state.copyWith(explanation: AsyncValue.error(e, StackTrace.current));
        return;
      }
      
      String errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
      if (e.response?.data != null && e.response?.data is Map) {
        final data = e.response!.data as Map;
        if (data['message'] != null) {
          errorMessage = data['message'].toString();
        }
      }
      state = state.copyWith(explanation: AsyncValue.error(errorMessage, StackTrace.current));
    } catch (e, st) {
      state = state.copyWith(explanation: AsyncValue.error(e, st));
    }
  }

  void reset() {
    state = const NumerologyState();
  }
}

final numerologyProvider = NotifierProvider<NumerologyNotifier, NumerologyState>(() {
  return NumerologyNotifier();
});
