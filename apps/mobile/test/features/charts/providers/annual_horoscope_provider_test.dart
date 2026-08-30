import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:ziweiai_mobile/features/charts/data/repositories/charts_repository.dart';
import 'package:ziweiai_mobile/features/charts/presentation/annual_horoscope_provider.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';

class MockChartsRepository extends Mock implements ChartsRepository {}

void main() {
  late MockChartsRepository mockRepository;
  late ProviderContainer container;

  setUp(() {
    mockRepository = MockChartsRepository();
    container = ProviderContainer(
      overrides: [
        chartsRepositoryProvider.overrideWithValue(mockRepository),
        walletBalanceProvider.overrideWith((ref) => Future.value(100)),
      ],
    );
  });

  tearDown(() {
    container.dispose();
  });

  group('AnnualHoroscopeNotifier Tests', () {
    test('initial state defaults to current year and null report', () {
      final state = container.read(annualHoroscopeProvider);
      expect(state.selectedYear, DateTime.now().year);
      expect(state.annualReport.value, isNull);
    });

    test('selectYear updates selectedYear and resets report', () {
      final notifier = container.read(annualHoroscopeProvider.notifier);
      notifier.selectYear(2028);

      final state = container.read(annualHoroscopeProvider);
      expect(state.selectedYear, 2028);
      expect(state.annualReport.value, isNull);
    });

    test('generateAnnualReport success updates state with AnnualReportResponse', () async {
      final mockData = {
        'chartId': 'chart-123',
        'year': 2026,
        'frame': {
          'yearly': {
            'index': 0,
            'heavenlyStemKey': 'stem.bing',
            'earthlyBranchKey': 'branch.wu',
            'palaceNameKeys': ['palace.ming'],
            'mutagenStarKeys': [],
          },
          'monthly': List.generate(
            12,
            (i) => {
              'index': i,
              'heavenlyStemKey': 'stem.jia',
              'earthlyBranchKey': 'branch.zi',
              'palaceNameKeys': ['palace.ming'],
              'mutagenStarKeys': [],
            },
          ),
        },
        'markdown': '# Luận giải năm 2026',
      };

      when(() => mockRepository.createAnnualReport('chart-123', 2026))
          .thenAnswer((_) async => mockData);

      final notifier = container.read(annualHoroscopeProvider.notifier);
      await notifier.generateAnnualReport('chart-123', 2026);

      final state = container.read(annualHoroscopeProvider);
      expect(state.annualReport.hasValue, isTrue);
      expect(state.annualReport.value?.year, 2026);
      expect(state.annualReport.value?.markdown, '# Luận giải năm 2026');
    });

    test('generateAnnualReport handles 402/403 with DioException for paywall trigger', () async {
      final dioException = DioException(
        requestOptions: RequestOptions(path: '/charts/chart-123/annual-report'),
        response: Response(
          requestOptions: RequestOptions(path: '/charts/chart-123/annual-report'),
          statusCode: 402,
          data: {'message': 'Insufficient XU balance.'},
        ),
        type: DioExceptionType.badResponse,
      );

      when(() => mockRepository.createAnnualReport('chart-123', 2026))
          .thenThrow(dioException);

      final notifier = container.read(annualHoroscopeProvider.notifier);
      await notifier.generateAnnualReport('chart-123', 2026);

      final state = container.read(annualHoroscopeProvider);
      expect(state.annualReport.hasError, isTrue);
      expect(state.annualReport.error, equals(dioException));
    });

    test('generateAnnualReport handles generic error with readable message', () async {
      final dioException = DioException(
        requestOptions: RequestOptions(path: '/charts/chart-123/annual-report'),
        response: Response(
          requestOptions: RequestOptions(path: '/charts/chart-123/annual-report'),
          statusCode: 500,
          data: {'message': 'AI provider router timeout'},
        ),
        type: DioExceptionType.badResponse,
      );

      when(() => mockRepository.createAnnualReport('chart-123', 2026))
          .thenThrow(dioException);

      final notifier = container.read(annualHoroscopeProvider.notifier);
      await notifier.generateAnnualReport('chart-123', 2026);

      final state = container.read(annualHoroscopeProvider);
      expect(state.annualReport.hasError, isTrue);
      expect(state.annualReport.error, equals('AI provider router timeout'));
    });
  });
}
