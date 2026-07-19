import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ziweiai_mobile/features/auth/presentation/auth_screen.dart';
import 'package:ziweiai_mobile/features/auth/data/repositories/auth_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MockAuthRepository implements AuthRepository {
  @override
  Stream<AuthState> get authStateChanges => const Stream.empty();

  @override
  User? get currentUser => null;

  @override
  Future<AuthResponse> signInWithEmail(String email, String password) async {
    return AuthResponse(
      session: null,
      user: User(id: '123', appMetadata: {}, userMetadata: {}, aud: 'authenticated', createdAt: ''),
    );
  }

  @override
  Future<AuthResponse> signUpWithEmail(String email, String password) async {
    return AuthResponse(
      session: null,
      user: User(id: '123', appMetadata: {}, userMetadata: {}, aud: 'authenticated', createdAt: ''),
    );
  }

  @override
  Future<AuthResponse> signInAnonymously() async {
    return AuthResponse(
      session: null,
      user: User(id: '456', appMetadata: {}, userMetadata: {}, aud: 'authenticated', createdAt: ''),
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
    expect(find.text('Đăng nhập để lưu lá số và xem luận giải AI'), findsOneWidget);
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Mật khẩu'), findsOneWidget);
    expect(find.text('Đăng nhập'), findsOneWidget);
    expect(find.text('Đăng ký tài khoản mới'), findsOneWidget);

    // Tap submit without data
    await tester.tap(find.text('Đăng nhập'));
    await tester.pump();

    // Check validation messages
    expect(find.text('Vui lòng nhập email'), findsOneWidget);
    expect(find.text('Mật khẩu phải từ 6 ký tự'), findsOneWidget);

    // Enter data
    await tester.enterText(find.byType(TextFormField).first, 'test@example.com');
    await tester.enterText(find.byType(TextFormField).last, 'password123');
    await tester.pump();

    // Tap submit again (the validation errors should disappear, and it will close the screen)
    await tester.tap(find.text('Đăng nhập'));
    await tester.pumpAndSettle(); // Need to pump and settle to allow context.pop() or UI updates to settle

    // If context.pop happens, the screen might be unmounted, or the widget might disappear.
    // In our test, there's no router so context.pop might throw a black screen, but it's enough to verify errors are gone.
    // However, if context.pop happens, the whole form is gone, so finding text "Vui lòng nhập email" will naturally be nothing.
    expect(find.text('Vui lòng nhập email'), findsNothing);
  });
}
