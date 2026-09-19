import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_provider.dart';
import '../models/create_chart_request.dart';

class ChartsRepository {
  final Dio _dio;

  ChartsRepository(this._dio);

  Future<Map<String, dynamic>> createChart(CreateChartRequest request) async {
    try {
      final response = await _dio.post('/charts', data: request.toJson());
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getChartDetail(String chartSnapshotId) async {
    try {
      final response = await _dio.get('/charts/$chartSnapshotId');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> createAnnualReport(String chartSnapshotId, int year) async {
    try {
      final response = await _dio.post(
        '/charts/$chartSnapshotId/annual-report',
        queryParameters: {'year': year},
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getDailyFortune(String chartSnapshotId, String asOf) async {
    try {
      final response = await _dio.get(
        '/charts/$chartSnapshotId/daily',
        queryParameters: {'asOf': asOf},
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getMonthlyFortune(String chartSnapshotId, String asOf) async {
    try {
      final response = await _dio.get(
        '/charts/$chartSnapshotId/monthly',
        queryParameters: {'asOf': asOf},
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }
}

final chartsRepositoryProvider = Provider<ChartsRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return ChartsRepository(dio);
});
