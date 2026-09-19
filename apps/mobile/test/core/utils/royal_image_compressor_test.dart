import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/core/utils/royal_image_compressor.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('RoyalImageCompressor Unit Tests (Sprint 60)', () {
    test('compress handles empty bytes gracefully with png fallback', () async {
      final empty = Uint8List(0);
      final result = await RoyalImageCompressor.compress(empty);
      expect(result.bytes.isEmpty, isTrue);
      expect(result.actualFormat, equals('png'));
      expect(result.mimeType, equals('image/png'));
      expect(result.fileExtension, equals('png'));
    });

    test('compress returns original bytes with png format in fallback test environment', () async {
      // Mock bytes đại diện cho raw image data (PNG bytes)
      final rawBytes = Uint8List.fromList([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      final result = await RoyalImageCompressor.compress(rawBytes);
      // Trong môi trường test Flutter không có native platform channel của flutter_image_compress,
      // bộ nén sẽ fallback an toàn và trả về rawBytes với format png chuẩn xác
      expect(result.bytes, equals(rawBytes));
      expect(result.actualFormat, equals('png'));
      expect(result.mimeType, equals('image/png'));
      expect(result.fileExtension, equals('png'));
      expect(result.isPng, isTrue);
      expect(result.isWebp, isFalse);
    });

    test('isWebpBytes accurately detects valid WebP RIFF header', () {
      // Valid WebP header: 'RIFF' + 4 bytes size + 'WEBP'
      final webpBytes = Uint8List.fromList([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // file size
        0x57, 0x45, 0x42, 0x50, // WEBP
        0x56, 0x50, 0x38, 0x20, // VP8
      ]);
      expect(RoyalImageCompressor.isWebpBytes(webpBytes), isTrue);

      // PNG bytes should not be detected as WebP
      final pngBytes = Uint8List.fromList([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(RoyalImageCompressor.isWebpBytes(pngBytes), isFalse);

      // Short bytes (<12)
      expect(RoyalImageCompressor.isWebpBytes(Uint8List.fromList([1, 2, 3])), isFalse);
    });

    test('compressToWebp backward-compatibility returns raw bytes in fallback', () async {
      final rawBytes = Uint8List.fromList([1, 2, 3, 4]);
      final bytes = await RoyalImageCompressor.compressToWebp(rawBytes);
      expect(bytes, equals(rawBytes));
    });
  });
}
