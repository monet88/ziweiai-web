import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ziweiai_mobile/features/dossier/presentation/royal_dossier_screen.dart';
import 'package:ziweiai_mobile/features/dossier/providers/dossier_provider.dart';

void main() {
  group('RoyalDossierScreen 19-Page Reader Tests', () {
    Widget buildTestWidget() {
      return const ProviderScope(
        child: MaterialApp(
          home: RoyalDossierScreen(),
        ),
      );
    }

    testWidgets(
        'renders royal dossier reader with 19 pages, security watermark, and cover page info',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1000, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestWidget());
      await tester.pump(const Duration(milliseconds: 500));

      // 1. Top Bar Elements
      expect(find.text('HỒ SƠ MỆNH LÝ HOÀNG GIA'), findsNWidgets(2));
      expect(find.text('19 Trang A4 · Ngự Thư Khâm Thiên Giám'), findsOneWidget);

      // 2. Reading Progress Header
      expect(find.textContaining('Trang 01 / 19 (5%)'), findsOneWidget);
      expect(find.text('Mục lục'), findsOneWidget);

      // 3. Security Watermark & Cover Page Content
      expect(find.textContaining('VIOS-ROYAL-8899'), findsOneWidget);
      expect(find.text('TRANG 01'), findsOneWidget);
      expect(find.text('HOÀNG NAM'), findsOneWidget);
      expect(find.text('Kiếm Phong Kim · Kim Tứ Cục'), findsOneWidget);

      // 4. Bottom Navigation Bar in Book Mode
      expect(find.text('TRƯỚC'), findsOneWidget);
      expect(find.text('TIẾP'), findsOneWidget);
      expect(find.text('19 TRANG'), findsOneWidget);
    });

    testWidgets(
        'toggles view mode between Book PageView and Continuous Vertical Scroll',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1000, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestWidget());
      await tester.pump(const Duration(milliseconds: 500));

      // Initially in Book Mode (Bottom Navigation Bar with 'TRƯỚC' is visible)
      expect(find.text('TRƯỚC'), findsOneWidget);

      // Find toggle mode button
      final toggleButton = find.byTooltip('Chuyển sang chế độ cuộn dọc');
      expect(toggleButton, findsOneWidget);

      await tester.tap(toggleButton);
      await tester.pump(const Duration(milliseconds: 500));

      // Now in Scroll Mode: bottom nav bar is hidden
      expect(find.text('TRƯỚC'), findsNothing);
      expect(find.text('TIẾP'), findsNothing);

      // Find toggle mode back button
      final toggleBackButton = find.byTooltip('Chuyển sang chế độ lật sách');
      expect(toggleBackButton, findsOneWidget);

      await tester.tap(toggleBackButton);
      await tester.pump(const Duration(milliseconds: 500));

      // Back in Book Mode
      expect(find.text('TRƯỚC'), findsOneWidget);
      expect(find.text('TIẾP'), findsOneWidget);
    });

    testWidgets(
        'can flip pages using next button and open table of contents bottom sheet',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1000, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestWidget());
      await tester.pump(const Duration(milliseconds: 500));

      // Tap table of contents in bottom bar
      final tocButton = find.text('19 TRANG');
      expect(tocButton, findsOneWidget);

      await tester.tap(tocButton);
      await tester.pump(const Duration(milliseconds: 500));

      // BottomSheet is displayed
      expect(find.text('MỤC LỤC HỒ SƠ 19 TRANG A4'), findsOneWidget);

      // Close bottom sheet by popping navigator
      final navigator = tester.state<NavigatorState>(find.byType(Navigator).last);
      navigator.pop();
      await tester.pump(const Duration(milliseconds: 500));

      // Verify bottom sheet dismissed
      expect(find.text('MỤC LỤC HỒ SƠ 19 TRANG A4'), findsNothing);

      // Now test Next page button
      final nextButton = find.text('TIẾP');
      expect(nextButton, findsOneWidget);

      await tester.tap(nextButton);
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pump(const Duration(milliseconds: 350));

      // Page 2 rendered
      expect(find.text('TRANG 02'), findsOneWidget);
      expect(find.text('TOÀN CẢNH TINH BÀN 12 CUNG'), findsOneWidget);
    });

    testWidgets(
        'renders royal red seal and imperial credentials on page 19',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1000, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      // Set to Page 19 (index 18)
      container.read(dossierProvider.notifier).setPageIndex(18);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: RoyalDossierScreen(),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 500));

      // Verify Page 19 is rendered with Royal Red Seal
      expect(find.text('TRANG 19'), findsOneWidget);
      expect(find.text('LỜI BẠT & CHỨNG THỰC BẢO MẬT'), findsOneWidget);
      expect(find.text('KHÂM THIÊN'), findsOneWidget);
      expect(find.text('NGỰ BÚT'), findsOneWidget);
      expect(find.text('Bảo chứng tâm linh tối cao · ViOS'), findsOneWidget);
    });

    testWidgets(
        'shows download pdf dialog with royal certificate note',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1000, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestWidget());
      await tester.pump(const Duration(milliseconds: 500));

      // Tap download PDF button in top bar
      final downloadBtn = find.byTooltip('Tải PDF Hoàng Gia');
      expect(downloadBtn, findsOneWidget);

      await tester.tap(downloadBtn);
      await tester.pump(const Duration(milliseconds: 500));

      // Verify Download Dialog appears
      expect(find.text('Tải Hồ Sơ PDF A4'), findsOneWidget);
      expect(
          find.textContaining(
              'Xuất trọn bộ 19 trang Hồ Sơ Mệnh Lý Hoàng Gia'),
          findsOneWidget);
      expect(find.text('TẢI PDF'), findsOneWidget);

      // Tap Close button
      await tester.tap(find.text('ĐÓNG'));
      await tester.pump(const Duration(milliseconds: 500));

      // Dialog dismissed
      expect(find.text('Tải Hồ Sơ PDF A4'), findsNothing);
    });
  });
}
