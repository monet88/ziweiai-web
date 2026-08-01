import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';
import 'package:ziweiai_mobile/features/tarot/providers/tarot_provider.dart';
import 'package:ziweiai_mobile/features/tarot/data/repositories/tarot_repository.dart';
import 'package:ziweiai_mobile/features/tarot/data/models/tarot_models.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';

class MockTarotRepository extends Mock implements TarotRepository {}

void main() {
  late ProviderContainer container;
  late MockTarotRepository mockTarotRepository;

  setUp(() {
    mockTarotRepository = MockTarotRepository();
    container = ProviderContainer(
      overrides: [
        tarotRepositoryProvider.overrideWithValue(mockTarotRepository),
        walletBalanceProvider.overrideWith((ref) => Future.value(100)),
      ],
    );
  });

  tearDown(() {
    container.dispose();
  });

  group('TarotNotifier Tests', () {
    test('initial state is data(null)', () {
      final state = container.read(tarotProvider);
      expect(state, const AsyncValue<TarotDraw?>.data(null));
    });

    test('drawCard success updates state with TarotDraw and invalidates wallet', () async {
      final mockDraw = TarotDraw(
        question: 'Test question',
        spread: 'single',
        cards: [],
        narrative: 'Test narrative',
      );

      when(() => mockTarotRepository.drawTarot(
            question: any(named: 'question'),
            spread: any(named: 'spread'),
          )).thenAnswer((_) async => mockDraw);

      var isWalletInvalidated = false;
      container.listen(
        walletBalanceProvider,
        (previous, next) {
          isWalletInvalidated = true;
        },
        fireImmediately: true,
      );

      // Reset the flag after the immediate fire
      isWalletInvalidated = false;

      final notifier = container.read(tarotProvider.notifier);
      final future = notifier.drawCard('Test question');

      // Verify loading state
      expect(container.read(tarotProvider).isLoading, true);

      await future;

      // Verify data state
      final state = container.read(tarotProvider);
      expect(state.value, mockDraw);
      
      // Since walletBalanceProvider is being listened to and invalidated, 
      // the listener should have fired again.
      expect(isWalletInvalidated, true);
    });

    test('drawCard handles 402/403 with DioException directly', () async {
      final dioException = DioException(
        requestOptions: RequestOptions(path: '/draws/tarot'),
        response: Response(
          requestOptions: RequestOptions(path: '/draws/tarot'),
          statusCode: 402,
        ),
      );

      when(() => mockTarotRepository.drawTarot(
            question: any(named: 'question'),
            spread: any(named: 'spread'),
          )).thenThrow(dioException);

      final notifier = container.read(tarotProvider.notifier);
      await notifier.drawCard('Test question');

      final state = container.read(tarotProvider);
      expect(state.hasError, true);
      expect(state.error, isA<DioException>());
      expect((state.error as DioException).response?.statusCode, 402);
    });

    test('drawCard handles general error with message', () async {
      final dioException = DioException(
        requestOptions: RequestOptions(path: '/draws/tarot'),
        response: Response(
          requestOptions: RequestOptions(path: '/draws/tarot'),
          statusCode: 500,
          data: {'message': 'Server error'},
        ),
      );

      when(() => mockTarotRepository.drawTarot(
            question: any(named: 'question'),
            spread: any(named: 'spread'),
          )).thenThrow(dioException);

      final notifier = container.read(tarotProvider.notifier);
      await notifier.drawCard('Test question');

      final state = container.read(tarotProvider);
      expect(state.hasError, true);
      expect(state.error, 'Server error');
    });

    test('reset clears the state', () {
      final notifier = container.read(tarotProvider.notifier);
      notifier.reset();

      final state = container.read(tarotProvider);
      expect(state, const AsyncValue<TarotDraw?>.data(null));
    });
  });
}
