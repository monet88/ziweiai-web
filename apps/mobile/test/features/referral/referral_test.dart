import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/features/referral/presentation/referral_screen.dart';
import 'package:ziweiai_mobile/features/referral/services/referral_service.dart';
import 'package:ziweiai_mobile/features/referral/widgets/royal_referral_card.dart';

import 'package:dio/dio.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:ziweiai_mobile/core/api/api_client.dart';
import 'package:ziweiai_mobile/core/security/turnstile_service.dart';

class MockApiClient extends Mock implements ApiClient {}
class MockSupabaseClient extends Mock implements SupabaseClient {}
class MockGoTrueClient extends Mock implements GoTrueClient {}
class MockUser extends Mock implements User {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ReferralService Unit Tests', () {
    final service = ReferralService();

    test('getMyReferralCode returns fallback when uninitialized', () async {
      final code = await service.getMyReferralCode();
      expect(code, isNotNull);
      expect(code!.isNotEmpty, isTrue);
    });

    test('redeemReferralCode validates empty string', () async {
      final result = await service.redeemReferralCode('');
      expect(result.success, isFalse);
      expect(result.message, contains('Vui lòng nhập'));
    });

    test('redeemReferralCode returns simulated reward when client null', () async {
      final result = await service.redeemReferralCode('FRIEND88');
      expect(result.success, isTrue);
      expect(result.rewardXu, equals(20));
    });

    test('redeemReferralCode passes turnstileToken to ApiClient.dailyCheckin', () async {
      final mockApiClient = MockApiClient();
      final mockSupabase = MockSupabaseClient();
      final mockAuth = MockGoTrueClient();
      final mockUser = MockUser();

      when(() => mockSupabase.auth).thenReturn(mockAuth);
      when(() => mockAuth.currentUser).thenReturn(mockUser);
      when(() => mockUser.id).thenReturn('mock-user-id');

      when(() => mockApiClient.dailyCheckin(
            referralCode: any(named: 'referralCode'),
            turnstileToken: any(named: 'turnstileToken'),
          )).thenAnswer((_) async => {'rewardXu': 20, 'message': 'Success'});

      final serviceWithMocks = ReferralService(
        supabase: mockSupabase,
        apiClient: mockApiClient,
      );

      final result = await serviceWithMocks.redeemReferralCode(
        'FRIEND88',
        turnstileToken: 'cf_turnstile_test_token_abc',
      );

      verify(() => mockApiClient.dailyCheckin(
            referralCode: 'FRIEND88',
            turnstileToken: 'cf_turnstile_test_token_abc',
          )).called(1);

      expect(result.success, isTrue);
      expect(result.rewardXu, equals(20));
      expect(result.message, equals('Đã nhập mã giới thiệu thành công!'));
    });

    test('redeemReferralCode handles 400 bot verification failure with clear message', () async {
      final mockApiClient = MockApiClient();
      final mockSupabase = MockSupabaseClient();
      final mockAuth = MockGoTrueClient();
      final mockUser = MockUser();

      when(() => mockSupabase.auth).thenReturn(mockAuth);
      when(() => mockAuth.currentUser).thenReturn(mockUser);
      when(() => mockUser.id).thenReturn('mock-user-id');

      final requestOptions = RequestOptions(path: '/rewards/checkin');
      final dioException = DioException(
        requestOptions: requestOptions,
        response: Response(
          requestOptions: requestOptions,
          statusCode: 400,
          data: {
            'message': 'Xác thực chống bot không thành công (Turnstile verification failed).',
          },
        ),
      );

      when(() => mockApiClient.dailyCheckin(
            referralCode: any(named: 'referralCode'),
            turnstileToken: any(named: 'turnstileToken'),
          )).thenThrow(dioException);

      final serviceWithMocks = ReferralService(
        supabase: mockSupabase,
        apiClient: mockApiClient,
      );

      final result = await serviceWithMocks.redeemReferralCode(
        'FRIEND88',
        turnstileToken: null,
      );

      expect(result.success, isFalse);
      expect(result.rewardXu, equals(0));
      expect(result.message, contains('Xác thực chống bot không thành công'));
    });
  });

  group('RoyalReferralCard Widget Tests', () {
    testWidgets('renders title, brand, referral code, and QR Code container', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: RoyalReferralCard(referralCode: 'VIOS9999'),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('✦ THIỆP MỜI THƯỢNG KHÁCH ✦'), findsOneWidget);
      expect(find.text('TỬ VI TOÀN TẬP'), findsOneWidget);
      expect(find.text('VIOS9999'), findsOneWidget);
      expect(find.text('TẶNG NGAY +20 XU VẬN KHÍ CUNG ĐÌNH'), findsOneWidget);
    });
  });

  group('ReferralScreen Presentation Tests', () {
    testWidgets('renders referral header, stats, card, action buttons, and redeem box', (tester) async {
      final container = ProviderContainer(
        overrides: [
          referralStatsProvider.overrideWith((ref) async {
            return const ReferralStats(
              totalInvited: 5,
              totalXuEarned: 100,
              myCode: 'ROYAL88',
            );
          }),
        ],
      );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ReferralScreen(),
          ),
        ),
      );

      // Pump duration instead of pumpAndSettle due to continuous particle animations
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('ĐẠI TIỆC CUNG ĐÌNH'), findsOneWidget);
      expect(find.text('Tri Kỷ Kết Duyên'), findsOneWidget);
      expect(find.text('XU Phúc Khí'), findsOneWidget);
      expect(find.text('ROYAL88'), findsWidgets);
      expect(find.text('Chia Sẻ Thiệp Mời'), findsOneWidget);
      expect(find.text('Chép Mã'), findsOneWidget);
      expect(find.text('NHẬP MÃ TRI KỶ NHẬN +20 XU'), findsOneWidget);
      expect(find.text('Nhận XU'), findsOneWidget);
    });

    testWidgets('entering empty code shows warning snackbar', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final container = ProviderContainer(
        overrides: [
          referralStatsProvider.overrideWith((ref) async {
            return const ReferralStats(
              totalInvited: 0,
              totalXuEarned: 0,
              myCode: 'MYCODE12',
            );
          }),
        ],
      );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ReferralScreen(),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 300));

      // Tap Nhận XU when textfield is empty
      final redeemBtn = find.text('Nhận XU');
      await tester.tap(redeemBtn);
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Vui lòng nhập mã giới thiệu của tri kỷ'), findsOneWidget);
    });

    testWidgets('entering valid code acquires Turnstile token and displays success dialog', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final container = ProviderContainer(
        overrides: [
          referralStatsProvider.overrideWith((ref) async {
            return const ReferralStats(
              totalInvited: 0,
              totalXuEarned: 0,
              myCode: 'MYCODE12',
            );
          }),
          turnstileServiceProvider.overrideWithValue(
            TurnstileMobileService(mockToken: 'mock_turnstile_verified_token'),
          ),
        ],
      );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ReferralScreen(),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 300));

      // Nhập mã giới thiệu
      final inputFinder = find.byType(TextField);
      expect(inputFinder, findsOneWidget);
      await tester.enterText(inputFinder, 'FRIEND99');
      await tester.pump(const Duration(milliseconds: 100));

      // Bấm Nhận XU
      final redeemBtn = find.text('Nhận XU');
      await tester.tap(redeemBtn);
      await tester.pump(const Duration(milliseconds: 500));

      // Verify hộp thoại chúc mừng phúc khí hiển thị
      expect(find.text('Phúc Khí Cung Đình!'), findsOneWidget);
      expect(find.text('Đón Nhận'), findsOneWidget);
    });
  });
}
