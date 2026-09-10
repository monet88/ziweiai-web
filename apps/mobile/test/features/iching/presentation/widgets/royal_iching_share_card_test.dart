import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/features/iching/data/models/iching_models.dart';
import 'package:ziweiai_mobile/features/iching/presentation/widgets/royal_iching_share_card.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final mockDraw = IChingDraw(
    question: 'Công việc kinh doanh năm nay có khởi sắc không?',
    baseHexagram: IChingHexagram(
      id: '1',
      name: 'Thuần Càn',
      lines: [1, 1, 1, 1, 1, 1],
    ),
    changedHexagram: IChingHexagram(
      id: '44',
      name: 'Thiên Phong Cấu',
      lines: [0, 1, 1, 1, 1, 1],
    ),
    changingLines: [1],
    narrative: 'Thời vận hanh thông đại cát. Hào sơ biến đem lại luồng sinh khí mới.',
  );

  testWidgets('RoyalIChingShareCard renders royal header, dual hexagrams, seal and QR code', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.mystical,
        home: Scaffold(
          body: SingleChildScrollView(
            child: RoyalIChingShareCard(
              data: mockDraw,
              question: mockDraw.question,
            ),
          ),
        ),
      ),
    );

    // Header
    expect(find.text('KHÂM THIÊN GIÁM'), findsOneWidget);
    expect(find.text('THIỆP PHÁN LỤC HÀO KINH DỊCH'), findsOneWidget);

    // Question
    expect(find.textContaining('Công việc kinh doanh năm nay'), findsOneWidget);

    // Dual Hexagrams
    expect(find.text('QUẺ GỐC'), findsOneWidget);
    expect(find.text('Thuần Càn'), findsOneWidget);
    expect(find.text('QUẺ BIẾN'), findsOneWidget);
    expect(find.text('Thiên Phong Cấu'), findsOneWidget);

    // Seal & Footer
    expect(find.text('KHÂM THIÊN'), findsOneWidget);
    expect(find.text('NGỰ BÚT'), findsOneWidget);
    expect(find.text('TỬ VI TOÀN TẬP'), findsOneWidget);
    expect(find.text('tuvitoantap.vercel.app'), findsOneWidget);
  });
}
