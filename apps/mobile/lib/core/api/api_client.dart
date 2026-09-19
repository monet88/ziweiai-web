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
        'X-Client-Platform': 'mobile',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        try {
          final session = Supabase.instance.client.auth.currentSession;
          if (session != null) {
            options.headers['Authorization'] = 'Bearer ${session.accessToken}';
          }
        } catch (_) {
          // Bỏ qua nếu chạy trong unit test chưa init Supabase
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
            final message = (data['message'] ?? '').toString();
            if (cost <= 0) {
              if (message.contains('5 XU') || message.contains('Kinh Dịch') || message.contains('Lục Hào')) {
                cost = 5;
                if (featureName == 'Tính năng này') {
                  featureName = 'Gieo Quẻ Lục Hào';
                }
              } else if (message.contains('1 XU')) {
                cost = 1;
              } else {
                cost = 5;
              }
            }
          } else {
            cost = 5;
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

  Future<Map<String, dynamic>> claimAdReward({String? impressionId, String? adToken}) async {
    try {
      final payload = <String, dynamic>{};
      if (impressionId != null && impressionId.isNotEmpty) {
        payload['impressionId'] = impressionId;
      }
      if (adToken != null && adToken.isNotEmpty) {
        payload['adToken'] = adToken;
      }

      final response = await _dio.post(
        '/rewards/ad-reward',
        data: payload.isNotEmpty ? payload : null,
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> dailyCheckin({
    String? referralCode,
    String? turnstileToken,
  }) async {
    try {
      final payload = <String, dynamic>{};
      if (referralCode != null && referralCode.isNotEmpty) {
        payload['referralCode'] = referralCode;
      }
      if (turnstileToken != null && turnstileToken.isNotEmpty) {
        payload['turnstileToken'] = turnstileToken;
      }

      final response = await _dio.post(
        '/rewards/checkin',
        data: payload.isNotEmpty ? payload : null,
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  // --- Dossier 19-Page Endpoints ---
  Future<Map<String, dynamic>> getDossierStatus(String chartId) async {
    try {
      final response = await _dio.get('/charts/$chartId/dossier/status');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> unlockDossier(String chartId) async {
    try {
      final response = await _dio.post('/charts/$chartId/dossier/unlock');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  // --- IChing Lục Hào Endpoints ---
  Future<Map<String, dynamic>> drawIChing({
    required String question,
    required List<int> castArray,
  }) async {
    try {
      final response = await _dio.post('/draws/iching', data: {
        'question': question,
        'cast_array': castArray,
      });
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  // --- Stick Linh Xăm Quan Thánh Endpoints ---
  Future<Map<String, dynamic>> drawStick({
    required String question,
    int? seed,
  }) async {
    try {
      final response = await _dio.post('/draws/stick', data: {
        'question': question,
        'seed': ?seed,
      });
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  // --- Charts & History Endpoints ---
  Future<Map<String, dynamic>> getHistory({int limit = 20}) async {
    try {
      final response = await _dio.get('/history', queryParameters: {'limit': limit});
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getChartDetail(String chartId) async {
    try {
      final response = await _dio.get('/charts/$chartId');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> createChart(Map<String, dynamic> chartInput) async {
    try {
      final response = await _dio.post('/charts', data: chartInput);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  // --- Divination Chat & Compatibility AI Endpoints ---
  Future<Map<String, dynamic>> sendDivinationChat({
    required String question,
    String? topic,
  }) async {
    try {
      final response = await _dio.post('/divinations/chat', data: {
        'question': question,
        'topic': ?topic,
      });
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> explainCompatibility(
    Map<String, dynamic> compatibilityPayload,
  ) async {
    try {
      final response = await _dio.post(
        '/divinations/compatibility/explain',
        data: compatibilityPayload,
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> registerFcmToken(String token, {String? platform}) async {
    try {
      final response = await _dio.post('/users/me/fcm-token', data: {
        'token': token,
        'platform': ?platform,
      });
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}

