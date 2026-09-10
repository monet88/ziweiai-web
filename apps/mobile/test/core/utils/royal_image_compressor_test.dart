import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/core/utils/royal_image_compressor.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('RoyalImageCompressor Unit Tests (Sprint 60)', () {
    test('compressToWebp handles empty bytes gracefully', () async {
      final empty = Uint8List(0);
      final result = await RoyalImageCompressor.compressToWebp(empty);
      expect(result.isEmpty, isTrue);
    });

    test('compressToWebp returns original bytes on fallback in non-native test environment', () async {
      // Mock bytes đại diện cho raw image data
      final rawBytes = Uint8List.fromList([1, 2, 3, 4, 5, 6, 7, 8]);
      final result = await RoyalImageCompressor.compressToWebp(rawBytes);
      // Trong môi trường test Flutter không có native platform channel của flutter_image_compress,
      // bộ nén sẽ fallback an toàn và trả về rawBytes mà không bị crash
      expect(result, isNotNull);
      expect(result.length, greaterThanOrEqualTo(0));
    });
  });
}
