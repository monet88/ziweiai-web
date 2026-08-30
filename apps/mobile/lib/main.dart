import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:io';
import 'core/env/env.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'core/services/push_notification_service.dart';
import 'core/presentation/widgets/global_paywall_wrapper.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Environment variables
  await Env.init();

  // Initialize Google AdMob
  try {
    await MobileAds.instance.initialize();
  } catch (e) {
    debugPrint('Google AdMob initialization failed: $e');
  }

  // Initialize Firebase & Push Notifications
  try {
    await Firebase.initializeApp();
    final pushService = PushNotificationService();
    await pushService.initialize();
  } catch (e) {
    debugPrint('Firebase initialization failed: $e');
  }


  // Initialize Supabase
  await Supabase.initialize(
    url: Env.supabaseUrl,
    publishableKey: Env.supabaseAnonKey,
  );

  // Initialize RevenueCat
  String? targetKey;
  if (Platform.isAndroid && Env.revenuecatApiKeyPlayStore.isNotEmpty) {
    targetKey = Env.revenuecatApiKeyPlayStore;
  } else if (Platform.isIOS && Env.revenuecatApiKeyAppStore.isNotEmpty) {
    targetKey = Env.revenuecatApiKeyAppStore;
  }

  // RevenueCat native SDK enforces that test_ keys cannot be used in release builds.
  // In release builds, only configure if a real production key (e.g. goog_ / appl_) is provided.
  final isTestKey = targetKey != null && targetKey.startsWith('test_');
  final shouldConfigureRevenueCat =
      targetKey != null && targetKey.isNotEmpty && (!kReleaseMode || !isTestKey);

  if (shouldConfigureRevenueCat) {
    try {
      await Purchases.setLogLevel(kReleaseMode ? LogLevel.info : LogLevel.debug);
      final configuration = PurchasesConfiguration(targetKey);
      await Purchases.configure(configuration);

      // Sync Supabase Auth state with RevenueCat
      final currentSession = Supabase.instance.client.auth.currentSession;
      if (currentSession != null) {
        try {
          await Purchases.logIn(currentSession.user.id);
        } catch (e) {
          debugPrint('RevenueCat logIn error on startup: $e');
        }
      }

      Supabase.instance.client.auth.onAuthStateChange.listen((data) async {
        final session = data.session;
        try {
          if (session != null) {
            await Purchases.logIn(session.user.id);
          } else {
            await Purchases.logOut();
          }
        } catch (e) {
          debugPrint('RevenueCat auth sync error: $e');
        }
      });
    } catch (e) {
      debugPrint('RevenueCat configuration error: $e');
    }
  } else {
    debugPrint(
      '[RevenueCat] Skipping Purchases.configure in release mode because test key ($targetKey) is used.',
    );
  }

  runApp(
    const ProviderScope(
      child: ZiweiAiApp(),
    ),
  );
}

class ZiweiAiApp extends ConsumerWidget {
  const ZiweiAiApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'Tử Vi Toàn Tập',
      theme: AppTheme.mystical,
      routerConfig: appRouter,
      debugShowCheckedModeBanner: false,
      builder: (context, child) => GlobalPaywallWrapper(
        child: child ?? const SizedBox.shrink(),
      ),
    );
  }
}
