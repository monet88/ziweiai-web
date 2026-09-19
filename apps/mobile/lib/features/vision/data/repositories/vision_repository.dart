import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_provider.dart';
import '../models/vision_kind.dart';

class VisionRepository {
  final Dio _dio;

  VisionRepository(this._dio);

  Future<Map<String, dynamic>> analyzeImage({
    required VisionKind kind,
    required String imagePath,
    String? question,
  }) async {
    try {
      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(imagePath),
        if (question != null && question.trim().isNotEmpty) 'question': question.trim(),
      });

      final response = await _dio.post('/vision/${kind.name}', data: formData);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }
}

final visionRepositoryProvider = Provider<VisionRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return VisionRepository(dio);
});
