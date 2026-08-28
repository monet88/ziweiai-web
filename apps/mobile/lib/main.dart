import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:io';
import 'core/env/env.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/services/push_notification_service.dart';
import 'core/presentation/widgets/global_paywall_wrapper.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Environment variables
  await Env.init();

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
  await Purchases.setLogLevel(LogLevel.debug);
  
  PurchasesConfiguration? configuration;
  if (Platform.isAndroid && Env.revenuecatApiKeyPlayStore.isNotEmpty) {
    configuration = PurchasesConfiguration(Env.revenuecatApiKeyPlayStore);
  } else if (Platform.isIOS && Env.revenuecatApiKeyAppStore.isNotEmpty) {
    configuration = PurchasesConfiguration(Env.revenuecatApiKeyAppStore);
  }

  if (configuration != null) {
    await Purchases.configure(configuration);
  }

  // Sync Supabase Auth state with RevenueCat only if configured
  if (configuration != null) {
    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      final session = data.session;
      if (session != null) {
        Purchases.logIn(session.user.id);
      } else {
        Purchases.logOut();
      }
    });
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
    return GlobalPaywallWrapper(
      child: MaterialApp.router(
        title: 'Tử Vi Toàn Tập',
        theme: AppTheme.mystical,
        routerConfig: appRouter,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
