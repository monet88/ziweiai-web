import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:io';
import 'core/env/env.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Environment variables
  await Env.init();

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
    return MaterialApp.router(
      title: 'Tử Vi Toàn Tập',
      theme: AppTheme.paperCalm,
      routerConfig: appRouter,
      debugShowCheckedModeBanner: false,
    );
  }
}
