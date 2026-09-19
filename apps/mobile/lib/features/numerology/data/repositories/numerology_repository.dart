import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_provider.dart';
import '../models/numerology_models.dart';

class NumerologyRepository {
  final Dio _dio;

  NumerologyRepository(this._dio);

  Future<NumerologyExplanation> getExplanation({
    required int lifePath,
    required int destiny,
    required int soulUrge,
    required int personality,
    required String fullName,
  }) async {
    final response = await _dio.post('/numerology/explain', data: {
      'lifePath': lifePath,
      'destiny': destiny,
      'soulUrge': soulUrge,
      'personality': personality,
      'fullName': fullName,
    });
    
    return NumerologyExplanation.fromJson(response.data);
  }
}

final numerologyRepositoryProvider = Provider<NumerologyRepository>((ref) {
  return NumerologyRepository(ref.watch(dioProvider));
});
