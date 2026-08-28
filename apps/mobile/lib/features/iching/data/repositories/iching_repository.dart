import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_provider.dart';
import '../models/iching_models.dart';

class IChingRepository {
  final ApiClient _apiClient;

  IChingRepository(this._apiClient);

  Future<IChingDraw> drawIChing({
    required String question,
    required List<int> castArray,
  }) async {
    final requestData = <String, dynamic>{
      'question': question,
      'cast_array': castArray,
    };

    final response = await _apiClient.dio.post(
      '/draws/iching',
      data: requestData,
    );

    if (response.statusCode == 200) {
      return IChingDraw.fromJson(response.data as Map<String, dynamic>);
    } else {
      throw DioException(
        requestOptions: response.requestOptions,
        response: response,
        type: DioExceptionType.badResponse,
      );
    }
  }
}

final ichingRepositoryProvider = Provider<IChingRepository>((ref) {
  return IChingRepository(ref.watch(apiClientProvider));
});
