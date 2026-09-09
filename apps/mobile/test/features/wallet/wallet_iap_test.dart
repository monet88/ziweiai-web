import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/features/wallet/presentation/wallet_screen.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';

void main() {
  group('WalletScreen In-App Purchase & Royal Packages Tests', () {
    testWidgets('WalletScreen renders Tabs, Balance, and In-App Store elements',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            walletBalanceProvider.overrideWith((ref) => 150),
          ],
          child: const MaterialApp(
            home: WalletScreen(),
          ),
        ),
      );

      await tester.pump();

      // Verify Header & Balance Display
      expect(find.text('VÍ THUẬT SỐ XU'), findsOneWidget);
      expect(find.text('SỐ DƯ HIỆN TẠI'), findsOneWidget);
      expect(find.text('150'), findsOneWidget);

      // Verify 2 Tabs
      expect(find.text('Chuyển Khoản VietQR'), findsOneWidget);
      expect(find.text('In-App Store / VIP'), findsOneWidget);

      // Switch to In-App Store Tab
      await tester.tap(find.text('In-App Store / VIP'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));
      await tester.pump(const Duration(seconds: 1));

      // Verify VIP Pro Banner
      expect(find.text('TỬ VI TOÀN TẬP PRO'), findsOneWidget);
      expect(find.text('GÓI IN-APP PURCHASE STORE'), findsOneWidget);
      expect(find.text('Khôi phục'), findsOneWidget);

      // Verify Fallback Packages exist when offerings are null/offline
      expect(find.text('Gói Khởi Điểm'), findsOneWidget);
      expect(find.text('Gói Phổ Biến'), findsOneWidget);
      expect(find.text('Gói Nâng Cao'), findsOneWidget);
      expect(find.text('Gói Hoàng Cung VIP'), findsOneWidget);
    });

    testWidgets('Tapping a fallback package opens royal payment guide dialog',
        (WidgetTester tester) async {
      await tester.binding.setSurfaceSize(const Size(800, 1400));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            walletBalanceProvider.overrideWith((ref) => 50),
          ],
          child: const MaterialApp(
            home: WalletScreen(),
          ),
        ),
      );

      await tester.pump();

      // Switch to In-App Store Tab
      await tester.tap(find.text('In-App Store / VIP'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));
      await tester.pump(const Duration(milliseconds: 400));

      // Tap on 'Gói Phổ Biến' in In-App Store Tab
      final packageFinder = find.text('Gói Phổ Biến').last;
      await tester.tap(packageFinder);
      await tester.pump(const Duration(milliseconds: 300));

      // Verify Dialog opens with guidance
      expect(find.text('Nạp VietQR Ngay'), findsOneWidget);
      expect(find.text('Đóng'), findsOneWidget);

      // Tap 'Đóng' closes dialog
      await tester.tap(find.text('Đóng'));
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Nạp VietQR Ngay'), findsNothing);
    });
  });
}
