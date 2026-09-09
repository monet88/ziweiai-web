import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/features/compatibility/presentation/screens/compatibility_screen.dart';
import 'package:ziweiai_mobile/features/compatibility/presentation/widgets/royal_compatibility_card.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Widget buildTestWidget({int walletBalance = 50}) {
    return ProviderScope(
      overrides: [
        walletBalanceProvider.overrideWith((ref) => Future.value(walletBalance)),
      ],
      child: MaterialApp(
        theme: AppTheme.mystical,
        home: const CompatibilityScreen(),
      ),
    );
  }

  group('CompatibilityScreen & RoyalCompatibilityCard Tests', () {
    testWidgets('renders initial UI elements properly', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(buildTestWidget());
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('DUYÊN ĐỊNH CUNG ĐÌNH'), findsOneWidget);
      expect(find.text('Tình'), findsOneWidget);
      expect(find.text('Hợp'), findsOneWidget);
      expect(find.text('Bạn'), findsOneWidget);

      expect(find.textContaining('Người Thứ Nhất'), findsOneWidget);
      expect(find.textContaining('Người Thứ Hai'), findsOneWidget);
      expect(find.text('Tra Cứu Duyên Định Cung Đình 👑'), findsOneWidget);
    });

    testWidgets('calculates compatibility and renders result aspects', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(buildTestWidget());
      await tester.pump(const Duration(milliseconds: 300));

      // Tap calculate button
      final calcBtn = find.text('Tra Cứu Duyên Định Cung Đình 👑');
      await tester.ensureVisible(calcBtn);
      await tester.tap(calcBtn);
      await tester.pump(const Duration(milliseconds: 300));

      // Result header should appear
      expect(find.text('KẾT QUẢ TƯƠNG HỢP CUNG ĐÌNH'), findsOneWidget);
      expect(find.text('/100 điểm'), findsOneWidget);

      // 4 Pillars aspects should be rendered
      expect(find.text('Ngũ Hành Nạp Âm'), findsOneWidget);
      expect(find.text('Cung Phi Bát Trạch'), findsOneWidget);
      expect(find.text('Thiên Can Hợp Phối'), findsOneWidget);
      expect(find.text('Địa Chi Tương Phối'), findsOneWidget);

      // Export 9:16 button & AI button
      expect(find.text('Xuất Thẻ Duyên Định Story 9:16 👑'), findsOneWidget);
      expect(find.text('Thỉnh Ý Khâm Thiên Giám (15 XU) 👑'), findsOneWidget);
    });

    testWidgets('tapping export 9:16 button opens bottom sheet with RoyalCompatibilityCard', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(buildTestWidget());
      await tester.pump(const Duration(milliseconds: 300));

      // Calculate first
      final calcBtn = find.text('Tra Cứu Duyên Định Cung Đình 👑');
      await tester.ensureVisible(calcBtn);
      await tester.tap(calcBtn);
      await tester.pump(const Duration(milliseconds: 300));

      // Tap export button
      final exportBtn = find.text('Xuất Thẻ Duyên Định Story 9:16 👑');
      await tester.ensureVisible(exportBtn);
      await tester.tap(exportBtn);
      await tester.pump(const Duration(milliseconds: 300));

      // BottomSheet and RoyalCompatibilityCard should be displayed
      expect(find.text('THẺ DUYÊN ĐỊNH CUNG ĐÌNH 9:16'), findsOneWidget);
      expect(find.byType(RoyalCompatibilityCard), findsOneWidget);
      expect(find.text('Chia Sẻ Story 👑'), findsOneWidget);
    });

    testWidgets('unlock AI explanation with sufficient XU reveals imperial decree', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(buildTestWidget(walletBalance: 30));
      await tester.pump(const Duration(milliseconds: 300));

      // Calculate
      final calcBtn = find.text('Tra Cứu Duyên Định Cung Đình 👑');
      await tester.ensureVisible(calcBtn);
      await tester.tap(calcBtn);
      await tester.pump(const Duration(milliseconds: 300));

      // Scroll down to AI unlock button
      final aiBtn = find.text('Thỉnh Ý Khâm Thiên Giám (15 XU) 👑');
      await tester.ensureVisible(aiBtn);
      await tester.tap(aiBtn);
      await tester.pump(const Duration(milliseconds: 300));

      // Confirm dialog appears
      expect(find.text('Thỉnh Ý Khâm Thiên Giám'), findsOneWidget);
      expect(find.text('Xác Nhận (15 XU)'), findsOneWidget);

      // Confirm unlock
      await tester.tap(find.text('Xác Nhận (15 XU)'));
      await tester.pump(const Duration(milliseconds: 300));

      // AI explanation should be revealed
      expect(find.text('📜 NGỰ BÚT KHÂM THIÊN GIÁM:'), findsOneWidget);
    });
  });
}
