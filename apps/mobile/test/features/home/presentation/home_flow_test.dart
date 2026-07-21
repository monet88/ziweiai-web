import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ziweiai_mobile/core/router/app_router.dart';
import 'package:ziweiai_mobile/features/charts/presentation/ziwei_board.dart';
import 'package:ziweiai_mobile/features/charts/data/repositories/charts_repository.dart';
import 'package:ziweiai_mobile/features/charts/data/models/create_chart_request.dart';
import 'package:ziweiai_mobile/features/auth/data/repositories/auth_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MockAuthRepository implements AuthRepository {
  @override
  User? get currentUser => null;

  @override
  Stream<AuthState> get authStateChanges => const Stream.empty();

  @override
  Future<AuthResponse> signInAnonymously() async => AuthResponse(user: null);

  @override
  Future<AuthResponse> signInWithEmail(String email, String password) async => AuthResponse(user: null);

  @override
  Future<AuthResponse> signUpWithEmail(String email, String password) async => AuthResponse(user: null);

  @override
  Future<bool> signInWithGoogle() async => true;

  @override
  Future<AuthResponse> signInWithApple() async => AuthResponse(user: null);

  @override
  Future<void> signOut() async {}
}

class MockChartsRepository implements ChartsRepository {
  @override
  Future<Map<String, dynamic>> createChart(CreateChartRequest request) async {
    // Delay to simulate network and loading state
    await Future.delayed(const Duration(milliseconds: 100));
    
    return <String, dynamic>{
      'chartRecord': <String, dynamic>{
        'id': 'mock-id-123',
        'ownerUserId': 'user-1',
        'chartSystem': 'zi-wei-dou-shu',
        'snapshot': <String, dynamic>{
          'snapshotId': 'snap-1',
          'chartSystem': 'zi-wei-dou-shu',
          'summary': <String, dynamic>{'name': 'Mock Chart'},
          'birth': <String, dynamic>{'solarYear': 2000},
          'palaces': List.generate(12, (index) => <String, dynamic>{
            'nameKey': 'palace',
            'index': index,
            'heavenlyStemKey': 'stem',
            'earthlyBranchKey': 'branch',
            'isBodyPalace': false,
            'isOriginalPalace': false,
            'majorStars': [],
            'minorStars': [],
            'adjectiveStars': [],
            'ages': <int>[10],
            'displayName': 'Cung $index'
          })
        }
      },
      'snapshot': <String, dynamic>{},
      'explanationResults': []
    };
  }

  @override
  Future<Map<String, dynamic>> getChartDetail(String chartSnapshotId) async {
    return {};
  }
}

void main() {
  testWidgets('Full flow: Home -> Submit -> Board', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          chartsRepositoryProvider.overrideWithValue(MockChartsRepository()),
          authRepositoryProvider.overrideWithValue(MockAuthRepository()),
        ],
        child: MaterialApp.router(
          routerConfig: appRouter,
        ),
      ),
    );

    // Initial state: home screen
    expect(find.text('Nhập thông tin sinh'), findsOneWidget);
    expect(find.text('Lập lá số Tử Vi'), findsOneWidget);

    // Enter data (optional, since there's default data)
    await tester.enterText(find.byType(TextField).first, '10');

    // Tap submit
    await tester.tap(find.text('Lập lá số Tử Vi'));
    await tester.pump();

    // Verify loading indicator is present
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    // Wait for the simulated network delay
    await tester.pumpAndSettle();

    final errorFinder = find.textContaining('Lỗi:');
    if (errorFinder.evaluate().isNotEmpty) {
      final errorText = tester.widget<Text>(errorFinder).data;
      fail('Unexpected error: $errorText');
    }

    // Verify we navigated to the board
    expect(find.byType(ZiweiBoard), findsOneWidget);
    expect(find.text('Mock Chart'), findsOneWidget);
    expect(find.text('Năm sinh: 2000'), findsOneWidget);
    expect(find.text('Cung 5'), findsOneWidget);
  });
}
