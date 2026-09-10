import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/features/tarot/data/models/tarot_models.dart';
import 'package:ziweiai_mobile/features/tarot/presentation/widgets/royal_tarot_share_card.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final mockTarotDraw = TarotDraw(
    question: 'Kế hoạch công việc sắp tới có thuận lợi không?',
    spread: 'single',
    cards: [
      TarotCard(
        id: 'the_sun',
        name: 'The Sun',
        reversed: false,
        position: 0,
      ),
    ],
    narrative: 'Lá bài Mặt Trời tỏa ánh hào quang rực rỡ, biểu thị sự thành công trọn vẹn và niềm hân hoan to lớn.',
  );

  testWidgets('RoyalTarotShareCard renders imperial header, card name, verdict, seal and QR', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.mystical,
        home: Scaffold(
          body: SingleChildScrollView(
            child: RoyalTarotShareCard(
              data: mockTarotDraw,
            ),
          ),
        ),
      ),
    );

    // Header
    expect(find.text('KHÂM THIÊN GIÁM'), findsOneWidget);
    expect(find.text('THIỆP PHÁN TAROT AI'), findsOneWidget);

    // Question
    expect(find.textContaining('Kế hoạch công việc sắp tới'), findsOneWidget);

    // Card Details
    expect(find.text('THE SUN'), findsOneWidget);
    expect(find.text('CHIỀU XUÔI (UPRIGHT)'), findsOneWidget);

    // Oracle Verdict
    expect(find.text('THÔNG ĐIỆP VŨ TRỤ'), findsOneWidget);
    expect(find.textContaining('Lá bài Mặt Trời tỏa ánh hào quang'), findsOneWidget);

    // Red Seal & Footer
    expect(find.text('HUYỀN CƠ'), findsOneWidget);
    expect(find.text('TRẤN BẢO'), findsOneWidget);
    expect(find.text('TỬ VI TOÀN TẬP'), findsOneWidget);
    expect(find.text('tuvitoantap.vercel.app'), findsOneWidget);
  });

  testWidgets('RoyalTarotShareCard supports custom Lenormand imperial title and reversed orientation', (WidgetTester tester) async {
    final mockLenormandDraw = TarotDraw(
      question: 'Sự kiện bất ngờ nào sẽ diễn ra?',
      spread: 'single',
      cards: [
        TarotCard(
          id: 'rider',
          name: 'The Rider (Kỵ Sĩ)',
          reversed: true,
          position: 0,
        ),
      ],
      narrative: 'Có tin tức từ phương xa đến nhưng cần kiểm chứng thận trọng.',
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.mystical,
        home: Scaffold(
          body: SingleChildScrollView(
            child: RoyalTarotShareCard(
              data: mockLenormandDraw,
              systemTitle: 'THIỆP PHÁN LENORMAND HOÀNG GIA',
            ),
          ),
        ),
      ),
    );

    expect(find.text('THIỆP PHÁN LENORMAND HOÀNG GIA'), findsOneWidget);
    expect(find.text('THE RIDER (KỴ SĨ)'), findsOneWidget);
    expect(find.text('CHIỀU NGƯỢC (REVERSED)'), findsOneWidget);
  });
}
