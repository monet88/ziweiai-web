import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import '../data/repositories/vision_repository.dart';
import '../data/models/vision_kind.dart';
import '../../wallet/providers/wallet_provider.dart';

class VisionNotifier extends Notifier<AsyncValue<Map<String, dynamic>?>> {
  final ImagePicker _picker = ImagePicker();

  @override
  AsyncValue<Map<String, dynamic>?> build() {
    return const AsyncValue.data(null);
  }

  Future<File?> pickAndProcessImage(ImageSource source) async {
    try {
      final pickedFile = await _picker.pickImage(source: source);
      if (pickedFile == null) return null;

      final croppedFile = await ImageCropper().cropImage(
        sourcePath: pickedFile.path,
        compressQuality: 100,
        uiSettings: [
          AndroidUiSettings(
            toolbarTitle: 'Cắt ảnh',
            initAspectRatio: CropAspectRatioPreset.original,
            lockAspectRatio: false,
          ),
          IOSUiSettings(
            title: 'Cắt ảnh',
          ),
        ],
      );

      if (croppedFile == null) return null;

      // Compress image if needed (< 4MB)
      final compressedBytes = await FlutterImageCompress.compressWithFile(
        croppedFile.path,
        minWidth: 1024,
        minHeight: 1024,
        quality: 80,
      );

      if (compressedBytes == null) return null;

      // Save to temp file
      final tempFile = File('${croppedFile.path}_compressed.jpg');
      await tempFile.writeAsBytes(compressedBytes);
      return tempFile;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return null;
    }
  }

  Future<void> analyzeImage({
    required VisionKind kind,
    required String imagePath,
    String? question,
  }) async {
    state = const AsyncValue.loading();
    try {
      final repository = ref.read(visionRepositoryProvider);
      final result = await repository.analyzeImage(
        kind: kind,
        imagePath: imagePath,
        question: question,
      );
      
      // Update wallet balance since 10 XU is deducted
      ref.invalidate(walletBalanceProvider);
      
      state = AsyncValue.data(result);
    } on DioException catch (e) {
      String errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
      if (e.response?.data != null && e.response?.data is Map) {
        final data = e.response!.data as Map;
        if (data['message'] != null) {
          errorMessage = data['message'].toString();
        }
      }
      state = AsyncValue.error(errorMessage, StackTrace.current);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final visionProvider = NotifierProvider<VisionNotifier, AsyncValue<Map<String, dynamic>?>>(() {
  return VisionNotifier();
});
