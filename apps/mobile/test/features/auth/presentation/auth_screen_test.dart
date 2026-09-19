import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ziweiai_mobile/features/auth/data/repositories/auth_repository.dart';
import 'package:ziweiai_mobile/features/auth/presentation/auth_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MockAuthRepository implements AuthRepository {
  @override
  User? get currentUser => null;

  @override
  Stream<AuthState> get authStateChanges => const Stream.empty();

  @override
  Future<AuthResponse> signInAnonymously() async {
    return AuthResponse(
      session: null,
      user: User(id: '123', appMetadata: {}, userMetadata: {}, aud: 'authenticated', createdAt: ''),
    );
  }

  @override
  Future<AuthResponse> signInWithEmail(String email, String password) async {
    return AuthResponse(
      session: null,
      user: User(id: '456', appMetadata: {}, userMetadata: {}, aud: 'authenticated', createdAt: ''),
    );
  }

  @override
  Future<AuthResponse> signUpWithEmail(String email, String password) async {
    return AuthResponse(
      session: null,
      user: User(id: '456', appMetadata: {}, userMetadata: {}, aud: 'authenticated', createdAt: ''),
    );
  }

  @override
  Future<bool> signInWithGoogle() async => true;

  @override
  Future<AuthResponse> signInWithApple() async {
    return AuthResponse(
      session: null,
      user: User(id: '789', appMetadata: {}, userMetadata: {}, aud: 'authenticated', createdAt: ''),
    );
  }

  @override
  Future<void> signOut() async {}
}

void main() {
  testWidgets('AuthScreen renders correctly and shows validation errors', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(MockAuthRepository()),
        ],
        child: const MaterialApp(
          home: AuthScreen(),
        ),
      ),
    );

    // Initial render
    expect(find.text('Đăng nhập để bảo lưu lá số & nhận ưu đãi XU'), findsOneWidget);
    expect(find.text('Email đăng nhập'), findsOneWidget);
    expect(find.text('Mật khẩu'), findsOneWidget);
    expect(find.text('ĐĂNG NHẬP'), findsOneWidget);
    expect(find.text('Chưa có tài khoản? Đăng ký mới'), findsOneWidget);

    // Tap submit without data
    await tester.tap(find.text('ĐĂNG NHẬP'));
    await tester.pump();

    // Check validation messages
    expect(find.text('Vui lòng nhập email'), findsOneWidget);
    expect(find.text('Mật khẩu phải từ 6 ký tự'), findsOneWidget);

    // Enter data
    await tester.enterText(find.byType(TextFormField).first, 'test@example.com');
    await tester.enterText(find.byType(TextFormField).last, 'password123');
    await tester.pump();

    // Tap submit again
    await tester.tap(find.text('ĐĂNG NHẬP'));
    await tester.pump(const Duration(milliseconds: 300));

    // Validation errors should disappear
    expect(find.text('Vui lòng nhập email'), findsNothing);
  });
}
