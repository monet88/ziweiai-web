import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(Supabase.instance.client.auth);
});

class AuthRepository {
  final GoTrueClient _authClient;

  AuthRepository(this._authClient);

  Stream<AuthState> get authStateChanges => _authClient.onAuthStateChange;
  User? get currentUser => _authClient.currentUser;

  Future<AuthResponse> signInWithEmail(String email, String password) async {
    return await _authClient.signInWithPassword(email: email, password: password);
  }

  Future<AuthResponse> signUpWithEmail(String email, String password) async {
    return await _authClient.signUp(email: email, password: password);
  }

  Future<AuthResponse> signInAnonymously() async {
    return await _authClient.signInAnonymously();
  }

  Future<bool> signInWithGoogle() async {
    final isAnon = _authClient.currentUser?.isAnonymous ?? false;
    if (isAnon) {
      return await _authClient.linkIdentity(
        OAuthProvider.google,
        redirectTo: 'app.ziweiai.auth://login-callback',
      );
    } else {
      return await _authClient.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'app.ziweiai.auth://login-callback',
      );
    }
  }

  Future<AuthResponse> signInWithApple() async {
    final rawNonce = Supabase.instance.client.auth.generateRawNonce();
    final hashedNonce = sha256.convert(utf8.encode(rawNonce)).toString();

    final credential = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
      nonce: hashedNonce,
    );

    final idToken = credential.identityToken;
    if (idToken == null) {
      throw const AuthException('Không thể lấy mã thông báo nhận dạng từ Apple.');
    }

    final isAnon = _authClient.currentUser?.isAnonymous ?? false;
    if (isAnon) {
      return await _authClient.linkIdentityWithIdToken(
        provider: OAuthProvider.apple,
        idToken: idToken,
        nonce: rawNonce,
      );
    } else {
      return await _authClient.signInWithIdToken(
        provider: OAuthProvider.apple,
        idToken: idToken,
        nonce: rawNonce,
      );
    }
  }

  Future<void> signOut() async {
    await _authClient.signOut();
  }
}
