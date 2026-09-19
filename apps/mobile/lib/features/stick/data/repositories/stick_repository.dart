import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_provider.dart';
import '../models/stick_models.dart';

class StickRepository {
  final ApiClient _apiClient;

  StickRepository(this._apiClient);

  Future<StickDraw> drawStick({
    required String question,
  }) async {
    final response = await _apiClient.dio.post(
      '/draws/stick',
      data: {'question': question},
    );

    if (response.statusCode == 200) {
      return StickDraw.fromJson(response.data as Map<String, dynamic>);
    } else {
      throw DioException(
        requestOptions: response.requestOptions,
        response: response,
        type: DioExceptionType.badResponse,
      );
    }
  }
}

final stickRepositoryProvider = Provider<StickRepository>((ref) {
  return StickRepository(ref.watch(apiClientProvider));
});
