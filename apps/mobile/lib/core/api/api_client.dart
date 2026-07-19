import 'package:dio/dio.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../env/env.dart';

class ApiClient {
  late final Dio _dio;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: Env.apiUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final session = Supabase.instance.client.auth.currentSession;
        if (session != null) {
          options.headers['Authorization'] = 'Bearer ${session.accessToken}';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        // Here we could handle global errors like 402 for RevenueCat
        return handler.next(e);
      },
    ));
  }

  Dio get dio => _dio;

  Future<int> getWalletBalance() async {
    try {
      final response = await _dio.get('/users/me/balance');
      return response.data['balance'] as int;
    } catch (e) {
      // Re-throw or handle accordingly
      rethrow;
    }
  }
}
