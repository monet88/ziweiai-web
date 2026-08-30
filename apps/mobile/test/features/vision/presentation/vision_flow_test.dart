import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';
import 'package:ziweiai_mobile/features/vision/presentation/vision_provider.dart';
import 'package:ziweiai_mobile/features/vision/data/repositories/vision_repository.dart';
import 'package:ziweiai_mobile/features/vision/data/models/vision_kind.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';

class MockVisionRepository extends Mock implements VisionRepository {}

void main() {
  late ProviderContainer container;
  late MockVisionRepository mockVisionRepository;

  setUpAll(() {
    registerFallbackValue(VisionKind.face);
  });

  setUp(() {
    mockVisionRepository = MockVisionRepository();
    container = ProviderContainer(
      overrides: [
        visionRepositoryProvider.overrideWithValue(mockVisionRepository),
        walletBalanceProvider.overrideWith((ref) => Future.value(100)),
      ],
    );
  });

  tearDown(() {
    container.dispose();
  });

  group('VisionNotifier Tests', () {
    test('initial state is data(null)', () {
      final state = container.read(visionProvider);
      expect(state, const AsyncValue<Map<String, dynamic>?>.data(null));
    });

    test('analyzeImage success updates state and invalidates wallet', () async {
      final mockResult = {
        'id': 'test-id',
        'kind': 'face',
        'narrative': 'Khuôn mặt có quý tướng',
      };

      when(() => mockVisionRepository.analyzeImage(
            kind: any(named: 'kind'),
            imagePath: any(named: 'imagePath'),
            question: any(named: 'question'),
          )).thenAnswer((_) async => mockResult);

      var isWalletInvalidated = false;
      container.listen(
        walletBalanceProvider,
        (previous, next) {
          isWalletInvalidated = true;
        },
        fireImmediately: true,
      );
      isWalletInvalidated = false;

      final notifier = container.read(visionProvider.notifier);
      final future = notifier.analyzeImage(
        kind: VisionKind.face,
        imagePath: '/tmp/test.jpg',
        question: 'Tướng số thế nào?',
      );

      expect(container.read(visionProvider).isLoading, true);

      await future;

      final state = container.read(visionProvider);
      expect(state.value, mockResult);
      expect(isWalletInvalidated, true);
    });

    test('analyzeImage handles DioException with message', () async {
      final dioException = DioException(
        requestOptions: RequestOptions(path: '/vision/palm'),
        response: Response(
          requestOptions: RequestOptions(path: '/vision/palm'),
          statusCode: 400,
          data: {'message': 'Ảnh không đủ sáng'},
        ),
      );

      when(() => mockVisionRepository.analyzeImage(
            kind: any(named: 'kind'),
            imagePath: any(named: 'imagePath'),
            question: any(named: 'question'),
          )).thenThrow(dioException);

      final notifier = container.read(visionProvider.notifier);
      await notifier.analyzeImage(
        kind: VisionKind.palm,
        imagePath: '/tmp/palm.jpg',
      );

      final state = container.read(visionProvider);
      expect(state.hasError, true);
      expect(state.error, 'Ảnh không đủ sáng');
    });
  });
}
