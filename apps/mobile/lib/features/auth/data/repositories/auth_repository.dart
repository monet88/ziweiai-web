import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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

  Future<void> signOut() async {
    await _authClient.signOut();
  }
}
