import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/core/providers/paywall_provider.dart';
import 'package:ziweiai_mobile/features/iching/data/models/iching_models.dart';
import 'package:ziweiai_mobile/features/iching/data/repositories/iching_repository.dart';
import 'package:ziweiai_mobile/features/iching/presentation/iching_screen.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';

class MockIChingRepository extends Mock implements IChingRepository {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late MockIChingRepository mockRepository;

  setUp(() {
    mockRepository = MockIChingRepository();
  });

  Widget buildTestWidget() {
    return ProviderScope(
      overrides: [
        ichingRepositoryProvider.overrideWithValue(mockRepository),
        walletBalanceProvider.overrideWith((ref) => Future.value(100)),
      ],
      child: MaterialApp(
        theme: AppTheme.mystical,
        home: const IChingScreen(),
      ),
    );
  }

  group('IChingScreen Royal 3D Tests', () {
    testWidgets('renders royal title, question setup, and ancient coin casting plate', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1000, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestWidget());
      await tester.pump(const Duration(milliseconds: 500));

      // Verify Screen Title
      expect(find.text('Lục Hào Chiêm Bốc 3D'), findsOneWidget);

      // Verify Setup Section
      expect(find.text('THÀNH TÂM KHỞI QUẺ'), findsOneWidget);
      expect(find.text('💼 Công việc tháng này có hanh thông, thăng tiến?'), findsOneWidget);

      // Verify Casting Button
      expect(find.textContaining('GIEO HÀO 1/6'), findsOneWidget);

      // Tap action chip to select sample question
      await tester.tap(find.text('💼 Công việc tháng này có hanh thông, thăng tiến?'));
      await tester.pump(const Duration(milliseconds: 200));

      // Verify TextField has the selected question text
      expect(find.widgetWithText(TextField, 'Công việc tháng này có hanh thông, thăng tiến?'), findsOneWidget);
    });

    testWidgets('tossing coins triggers flip animation, updates coin history, and stupa', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1000, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestWidget());
      await tester.pump(const Duration(milliseconds: 500));

      // Tap to toss the first line
      final castButton = find.textContaining('GIEO HÀO 1/6');
      expect(castButton, findsOneWidget);
      await tester.tap(castButton);

      // Advance through the toss delay (900ms)
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pump(const Duration(milliseconds: 600));

      // Verify 1/6 lines drawn in Stupa
      expect(find.textContaining('TIẾN TRÌNH KHỞI HÀO (1/6)'), findsOneWidget);
      expect(find.text('Sơ Hào (Dưới cùng)'), findsOneWidget);

      // Verify next toss button updated to 2/6
      expect(find.textContaining('GIEO HÀO 2/6'), findsOneWidget);

      // Verify coin outcome label is displayed
      expect(find.textContaining('Lần 1:'), findsOneWidget);
    });

    testWidgets('displays Hexagram result, Base and Changed cards, and Imperial Narrative', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1000, 1800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockDraw = IChingDraw(
        question: 'Công việc tháng này ra sao?',
        baseHexagram: IChingHexagram(
          id: '1',
          name: 'Thuần Càn (Bát Thuần Càn)',
          lines: [7, 7, 7, 7, 7, 9], // 9 is changing
        ),
        changedHexagram: IChingHexagram(
          id: '44',
          name: 'Thiên Phong Cấu',
          lines: [7, 7, 7, 7, 7, 8],
        ),
        changingLines: [6],
        narrative: 'Thoán Từ: Quẻ Thuần Càn đại cát hanh thông, nguyên hanh lợi trinh. Thiên hành kiện, quân tử dĩ tự cường bất tức.',
      );

      when(() => mockRepository.drawIChing(
            question: any(named: 'question'),
            castArray: any(named: 'castArray'),
          )).thenAnswer((_) async => mockDraw);

      await tester.pumpWidget(buildTestWidget());
      await tester.pump(const Duration(milliseconds: 500));

      // Cast 6 times
      for (int i = 0; i < 6; i++) {
        final button = find.textContaining('GIEO HÀO ${i + 1}/6');
        expect(button, findsOneWidget);
        await tester.tap(button);
        await tester.pump(const Duration(milliseconds: 500));
        await tester.pump(const Duration(milliseconds: 600));
      }

      // Settle async response from backend
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pump(const Duration(milliseconds: 500));

      // Verify Result Header
      expect(find.text('KẾT QUẢ KHỞI THÀNH QUẺ KINH DỊCH'), findsOneWidget);
      expect(find.text('QUẺ CHỦ (TIÊN THIÊN)'), findsOneWidget);
      expect(find.text('QUẺ BIẾN (HẬU THIÊN)'), findsOneWidget);
      expect(find.text('Thuần Càn (Bát Thuần Càn)'), findsOneWidget);
      expect(find.text('Thiên Phong Cấu'), findsOneWidget);

      // Verify Imperial Commentary & TTS
      expect(find.text('KHÂM THIÊN GIÁM LUẬN QUẺ'), findsOneWidget);
      expect(find.textContaining('Thiên hành kiện'), findsOneWidget);
    });

    testWidgets('gracefully intercepts 402 HTTP error and triggers Royal Paywall without crude snackbar', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1000, 1800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      late ProviderContainer capturedContainer;

      when(() => mockRepository.drawIChing(
            question: any(named: 'question'),
            castArray: any(named: 'castArray'),
          )).thenThrow(DioException(
        requestOptions: RequestOptions(path: '/draws/iching'),
        response: Response(
          requestOptions: RequestOptions(path: '/draws/iching'),
          statusCode: 402,
          data: {'message': 'Tính năng Kinh Dịch yêu cầu 5 XU. Số dư không đủ.'},
        ),
      ));

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            ichingRepositoryProvider.overrideWithValue(mockRepository),
            walletBalanceProvider.overrideWith((ref) => Future.value(0)),
          ],
          child: Consumer(
            builder: (context, ref, child) {
              capturedContainer = ProviderScope.containerOf(context);
              return MaterialApp(
                theme: AppTheme.mystical,
                home: const IChingScreen(),
              );
            },
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 500));

      // Cast 6 times
      for (int i = 0; i < 6; i++) {
        final button = find.textContaining('GIEO HÀO ${i + 1}/6');
        expect(button, findsOneWidget);
        await tester.tap(button);
        await tester.pump(const Duration(milliseconds: 500));
        await tester.pump(const Duration(milliseconds: 600));
      }

      await tester.pump(const Duration(milliseconds: 500));

      // Verify that crude 402 technical string is NOT displayed
      expect(find.textContaining('402 status lỗi'), findsNothing);
      expect(find.textContaining('The request returned an invalid status code of 402'), findsNothing);

      // Verify Royal Paywall was invoked
      final paywallState = capturedContainer.read(paywallProvider);
      expect(paywallState.isVisible, isTrue);
      expect(paywallState.cost, 5);
      expect(paywallState.featureName, 'Gieo Quẻ Lục Hào');
      expect(paywallState.onSuccess, isNotNull);

      // Verify retry button is shown when error occurs after 6 lines
      expect(find.textContaining('GỬI LẠI QUẺ (CHẠM ĐỂ GỬI)'), findsOneWidget);

      // Trigger onSuccess callback (simulating coin reward or top-up)
      paywallState.onSuccess!.call();
      await tester.pump();

      // Verify draw was called twice (initial + retry)
      verify(() => mockRepository.drawIChing(
        question: any(named: 'question'),
        castArray: any(named: 'castArray'),
      )).called(2);
    });
  });
}
