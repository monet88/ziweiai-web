import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';
import 'package:ziweiai_mobile/features/numerology/providers/numerology_provider.dart';
import 'package:ziweiai_mobile/features/numerology/data/repositories/numerology_repository.dart';
import 'package:ziweiai_mobile/features/numerology/data/models/numerology_models.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';

class MockNumerologyRepository extends Mock implements NumerologyRepository {}

void main() {
  late ProviderContainer container;
  late MockNumerologyRepository mockNumerologyRepository;

  setUp(() {
    mockNumerologyRepository = MockNumerologyRepository();
    container = ProviderContainer(
      overrides: [
        numerologyRepositoryProvider.overrideWithValue(mockNumerologyRepository),
        walletBalanceProvider.overrideWith((ref) => Future.value(100)),
      ],
    );
  });

  tearDown(() {
    container.dispose();
  });

  group('NumerologyNotifier Tests', () {
    test('initial state is empty', () {
      final state = container.read(numerologyProvider);
      expect(state.calculatedResult, isNull);
      expect(state.explanation, const AsyncValue<NumerologyExplanation?>.data(null));
    });

    test('calculate sets calculatedResult correctly', () {
      final notifier = container.read(numerologyProvider.notifier);
      notifier.calculate('Nguyen Van A', DateTime(1990, 1, 1));
      
      final state = container.read(numerologyProvider);
      expect(state.calculatedResult, isNotNull);
      expect(state.explanation, const AsyncValue<NumerologyExplanation?>.data(null));
    });

    test('reset clears the state', () {
      final notifier = container.read(numerologyProvider.notifier);
      notifier.calculate('Nguyen Van A', DateTime(1990, 1, 1));
      
      notifier.reset();
      
      final state = container.read(numerologyProvider);
      expect(state.calculatedResult, isNull);
      expect(state.explanation, const AsyncValue<NumerologyExplanation?>.data(null));
    });

    test('getExplanation success updates state and invalidates wallet', () async {
      final mockExplanation = NumerologyExplanation(narrative: 'Test narrative');

      when(() => mockNumerologyRepository.getExplanation(
            lifePath: any(named: 'lifePath'),
            destiny: any(named: 'destiny'),
            soulUrge: any(named: 'soulUrge'),
            personality: any(named: 'personality'),
            fullName: any(named: 'fullName'),
          )).thenAnswer((_) async => mockExplanation);

      var isWalletInvalidated = false;
      container.listen(
        walletBalanceProvider,
        (previous, next) {
          isWalletInvalidated = true;
        },
        fireImmediately: true,
      );

      isWalletInvalidated = false;

      final notifier = container.read(numerologyProvider.notifier);
      final future = notifier.getExplanation(
        lifePath: 1,
        destiny: 2,
        soulUrge: 3,
        personality: 4,
        fullName: 'Test Name',
      );

      // Verify loading state
      expect(container.read(numerologyProvider).explanation.isLoading, true);

      await future;

      // Verify data state
      final state = container.read(numerologyProvider);
      expect(state.explanation.value, mockExplanation);
      expect(isWalletInvalidated, true);
    });

    test('getExplanation handles 402/403 with DioException directly', () async {
      final dioException = DioException(
        requestOptions: RequestOptions(path: '/numerology/explain'),
        response: Response(
          requestOptions: RequestOptions(path: '/numerology/explain'),
          statusCode: 402,
        ),
      );

      when(() => mockNumerologyRepository.getExplanation(
            lifePath: any(named: 'lifePath'),
            destiny: any(named: 'destiny'),
            soulUrge: any(named: 'soulUrge'),
            personality: any(named: 'personality'),
            fullName: any(named: 'fullName'),
          )).thenThrow(dioException);

      final notifier = container.read(numerologyProvider.notifier);
      await notifier.getExplanation(
        lifePath: 1,
        destiny: 2,
        soulUrge: 3,
        personality: 4,
        fullName: 'Test Name',
      );

      final state = container.read(numerologyProvider);
      expect(state.explanation.hasError, true);
      expect(state.explanation.error, isA<DioException>());
      expect((state.explanation.error as DioException).response?.statusCode, 402);
    });

    test('getExplanation handles general error with message', () async {
      final dioException = DioException(
        requestOptions: RequestOptions(path: '/numerology/explain'),
        response: Response(
          requestOptions: RequestOptions(path: '/numerology/explain'),
          statusCode: 500,
          data: {'message': 'Server error'},
        ),
      );

      when(() => mockNumerologyRepository.getExplanation(
            lifePath: any(named: 'lifePath'),
            destiny: any(named: 'destiny'),
            soulUrge: any(named: 'soulUrge'),
            personality: any(named: 'personality'),
            fullName: any(named: 'fullName'),
          )).thenThrow(dioException);

      final notifier = container.read(numerologyProvider.notifier);
      await notifier.getExplanation(
        lifePath: 1,
        destiny: 2,
        soulUrge: 3,
        personality: 4,
        fullName: 'Test Name',
      );

      final state = container.read(numerologyProvider);
      expect(state.explanation.hasError, true);
      expect(state.explanation.error, 'Server error');
    });
  });
}
