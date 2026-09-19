import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'dart:io' show Platform;

import '../data/repositories/auth_repository.dart';
import '../../../core/theme/app_theme.dart';
import '../../../ui/animated_background.dart';
import '../../../ui/glass_panel.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  
  bool _isLoading = false;
  bool _isSignUpMode = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleAuth() async {
    if (!_formKey.currentState!.validate()) return;
    
    HapticFeedback.mediumImpact();
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      final email = _emailController.text.trim();
      final password = _passwordController.text.trim();

      if (!_isSignUpMode) {
        await repo.signInWithEmail(email, password);
      } else {
        await repo.signUpWithEmail(email, password);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Đăng ký thành công! Vui lòng kiểm tra email nếu yêu cầu xác thực.')),
          );
        }
      }
      
      if (mounted) {
        context.pop();
      }
    } on AuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi không xác định: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleAnonymousLogin() async {
    HapticFeedback.lightImpact();
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      await repo.signInAnonymously();
      if (mounted) {
        context.pop();
      }
    } on AuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi không xác định: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleGoogleLogin() async {
    HapticFeedback.lightImpact();
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      final success = await repo.signInWithGoogle();
      if (!success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Không thể đăng nhập bằng Google')),
          );
        }
      }
    } on AuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi không xác định: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleAppleLogin() async {
    HapticFeedback.lightImpact();
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      await repo.signInWithApple();
    } on AuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi đăng nhập Apple: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text(
          _isSignUpMode ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập',
          style: GoogleFonts.cinzel(
            fontWeight: FontWeight.w700,
            color: AppTheme.goldBright,
            letterSpacing: 1.2,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: AppTheme.goldBright),
          onPressed: () => context.pop(),
        ),
      ),
      body: AnimatedBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    GlassPanel(
                      padding: const EdgeInsets.all(24),
                      borderGradient: CelestialGradients.goldBorder,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: CelestialGradients.imperialGold,
                              boxShadow: CelestialShadows.goldGlow,
                            ),
                            child: const Center(
                              child: Icon(Icons.auto_awesome, size: 32, color: Color(0xFF141026)),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'TỬ VI TOÀN TẬP',
                            style: GoogleFonts.cinzel(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.goldBright,
                              letterSpacing: 2.0,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Đăng nhập để bảo lưu lá số & nhận ưu đãi XU',
                            style: TextStyle(fontSize: 13, color: AppTheme.mysticalTextSecondary),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 24),

                          // Email Input
                          TextFormField(
                            controller: _emailController,
                            style: const TextStyle(color: AppTheme.mysticalText),
                            keyboardType: TextInputType.emailAddress,
                            decoration: _inputDecoration('Email đăng nhập', Icons.email_outlined),
                            validator: (value) => value == null || value.isEmpty ? 'Vui lòng nhập email' : null,
                          ),
                          const SizedBox(height: 14),

                          // Password Input
                          TextFormField(
                            controller: _passwordController,
                            style: const TextStyle(color: AppTheme.mysticalText),
                            obscureText: true,
                            decoration: _inputDecoration('Mật khẩu', Icons.lock_outline),
                            validator: (value) => value == null || value.length < 6 ? 'Mật khẩu phải từ 6 ký tự' : null,
                          ),
                          const SizedBox(height: 24),

                          // Submit Button
                          if (_isLoading)
                            const Center(child: CircularProgressIndicator(color: AppTheme.goldBright))
                          else
                            Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                gradient: CelestialGradients.imperialGold,
                                boxShadow: CelestialShadows.goldGlow,
                              ),
                              child: ElevatedButton(
                                onPressed: _handleAuth,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  foregroundColor: const Color(0xFF141026),
                                  shadowColor: Colors.transparent,
                                  padding: const EdgeInsets.symmetric(vertical: 15),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                child: Text(
                                  _isSignUpMode ? 'ĐĂNG KÝ NGAY' : 'ĐĂNG NHẬP',
                                  style: GoogleFonts.cinzel(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                              ),
                            ),
                          const SizedBox(height: 12),

                          // Toggle Sign In / Sign Up
                          TextButton(
                            onPressed: () {
                              HapticFeedback.lightImpact();
                              setState(() => _isSignUpMode = !_isSignUpMode);
                            },
                            child: Text(
                              _isSignUpMode
                                  ? 'Đã có tài khoản? Đăng nhập ngay'
                                  : 'Chưa có tài khoản? Đăng ký mới',
                              style: const TextStyle(color: AppTheme.goldBright, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Social Logins
                    Row(
                      children: [
                        const Expanded(child: Divider(color: Colors.white12)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12.0),
                          child: Text(
                            'HOẶC TIẾP TỤC VỚI',
                            style: GoogleFonts.cinzel(
                              color: AppTheme.mysticalTextSecondary,
                              fontSize: 11,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ),
                        const Expanded(child: Divider(color: Colors.white12)),
                      ],
                    ),

                    const SizedBox(height: 16),

                    OutlinedButton.icon(
                      onPressed: _isLoading ? null : _handleGoogleLogin,
                      icon: const Icon(Icons.g_mobiledata, size: 28, color: Colors.white),
                      label: const Text('Tiếp tục với Google', style: TextStyle(color: Colors.white, fontSize: 14)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        side: BorderSide(color: AppTheme.mysticalGold.withValues(alpha: 0.35)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),

                    if (Platform.isIOS) ...[
                      const SizedBox(height: 12),
                      SignInWithAppleButton(
                        onPressed: _handleAppleLogin,
                        text: 'Tiếp tục với Apple',
                      ),
                    ],

                    const SizedBox(height: 16),

                    // Guest mode button
                    TextButton(
                      onPressed: _isLoading ? null : _handleAnonymousLogin,
                      child: const Text(
                        'Trải nghiệm ẩn danh (Không cần đăng nhập)',
                        style: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint, IconData icon) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.white30, fontSize: 14),
      prefixIcon: Icon(icon, color: AppTheme.goldBright, size: 20),
      filled: true,
      fillColor: AppTheme.cosmosElevated.withValues(alpha: 0.6),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: AppTheme.mysticalGold.withValues(alpha: 0.3)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: AppTheme.mysticalGold.withValues(alpha: 0.2)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppTheme.goldBright, width: 1.5),
      ),
    );
  }
}
