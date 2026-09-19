import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_provider.dart';
import '../models/tarot_models.dart';

class TarotRepository {
  final ApiClient _apiClient;

  TarotRepository(this._apiClient);

  Future<TarotDraw> drawTarot({
    required String question,
    required String spread,
    String? seed,
  }) async {
    final requestData = <String, dynamic>{
      'question': question,
      'spread': spread,
    };
    if (seed != null) {
      requestData['seed'] = seed;
    }

    final response = await _apiClient.dio.post(
      '/draws/tarot',
      data: requestData,
    );

    if (response.statusCode == 200) {
      return TarotDraw.fromJson(response.data as Map<String, dynamic>);
    } else {
      throw DioException(
        requestOptions: response.requestOptions,
        response: response,
        type: DioExceptionType.badResponse,
      );
    }
  }
}

final tarotRepositoryProvider = Provider<TarotRepository>((ref) {
  return TarotRepository(ref.watch(apiClientProvider));
});
