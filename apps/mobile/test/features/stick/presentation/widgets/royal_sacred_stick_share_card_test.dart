import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/features/stick/data/models/stick_models.dart';
import 'package:ziweiai_mobile/features/stick/presentation/widgets/royal_sacred_stick_share_card.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final mockStickDraw = StickDraw(
    question: 'Công danh sự nghiệp năm nay ra sao?',
    stick: DivinationStick(
      id: 28,
      title: 'Đông Pha Đề Thi',
      level: 'Thượng Cát',
      poem: 'Năm ấy lều tranh đỗ bảng rồng\nHoa đào rực rỡ đón xuân nồng\nMột mai danh toại mười phương phục\nTiếng tốt ngàn thu tỏa sắc hồng.',
      interpretation: 'Quẻ này báo hiệu thời vận mở rộng, mọi sự hanh thông đại cát.',
      advice: 'Cần giữ lòng thanh bạch, chuyên cần tu dưỡng đức hạnh.',
      story: 'Tô Đông Pha đi thi đỗ đầu bảng vàng.',
    ),
    narrative: 'Lời ngự phê Khâm Thiên Giám: Vận hội hanh thông, công danh hiển đạt.',
  );

  testWidgets('RoyalSacredStickShareCard renders imperial header, bamboo stick, poem, seal and QR', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.mystical,
        home: Scaffold(
          body: SingleChildScrollView(
            child: RoyalSacredStickShareCard(
              data: mockStickDraw,
            ),
          ),
        ),
      ),
    );

    // Header
    expect(find.text('KHÂM THIÊN GIÁM'), findsOneWidget);
    expect(find.text('LINH XĂM QUAN THÁNH'), findsOneWidget);

    // Question
    expect(find.textContaining('Công danh sự nghiệp năm nay'), findsOneWidget);

    // Bamboo Stick Info
    expect(find.text('THẺ SỐ 28'), findsOneWidget);
    expect(find.text('THƯỢNG CÁT'), findsOneWidget);
    expect(find.text('ĐÔNG PHA ĐỀ THI'), findsOneWidget);

    // Sacred Poem
    expect(find.text('THI THÁNH ĐẾ BAN'), findsOneWidget);
    expect(find.textContaining('Năm ấy lều tranh đỗ bảng rồng'), findsOneWidget);

    // Interpretation & Advice
    expect(find.text('Ý NGHĨA & LỜI KHUYÊN'), findsOneWidget);
    expect(find.textContaining('Quẻ này báo hiệu thời vận'), findsOneWidget);

    // Red Seal & Footer
    expect(find.text('LINH XĂM'), findsOneWidget);
    expect(find.text('TRẤN BẢO'), findsOneWidget);
    expect(find.text('TỬ VI TOÀN TẬP'), findsOneWidget);
    expect(find.text('tuvitoantap.vercel.app'), findsOneWidget);
  });
}
