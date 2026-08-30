import 'package:dio/dio.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../env/env.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/paywall_provider.dart';
class ApiClient {
  late final Dio _dio;
  final Ref _ref;

  ApiClient(this._ref) {
    _dio = Dio(BaseOptions(
      baseUrl: Env.apiUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
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
        // Handle global errors like 402/403
        if (e.response?.statusCode == 402 || e.response?.statusCode == 403) {
          final data = e.response?.data;
          int cost = 0;
          String featureName = 'Tính năng này';
          
          if (data is Map<String, dynamic>) {
            cost = data['cost'] ?? 0;
            featureName = data['featureName'] ?? featureName;
          }
          
          _ref.read(paywallProvider.notifier).show(
            cost: cost,
            featureName: featureName,
          );
        }
        return handler.next(e);
      },
    ));

    _dio.interceptors.add(LogInterceptor(
      request: true,
      requestHeader: true,
      requestBody: true,
      responseHeader: true,
      responseBody: true,
      error: true,
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

  Future<Map<String, dynamic>> getWalletTransactions() async {
    try {
      final response = await _dio.get('/wallet/transactions');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> claimAdReward() async {
    try {
      final response = await _dio.post('/rewards/ad-reward');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }
}

