import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:mocktail/mocktail.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/features/stick/data/models/stick_models.dart';
import 'package:ziweiai_mobile/features/stick/data/repositories/stick_repository.dart';
import 'package:ziweiai_mobile/features/stick/presentation/stick_screen.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';

class MockStickRepository extends Mock implements StickRepository {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late MockStickRepository mockRepository;

  setUp(() {
    mockRepository = MockStickRepository();
  });

  Widget buildTestWidget() {
    return ProviderScope(
      overrides: [
        stickRepositoryProvider.overrideWithValue(mockRepository),
        walletBalanceProvider.overrideWith((ref) => Future.value(100)),
      ],
      child: MaterialApp(
        theme: AppTheme.mystical,
        home: const StickScreen(),
      ),
    );
  }

  group('StickScreen Kwan Tai 3D Tests', () {
    testWidgets('renders royal title, bamboo cylinder, moon blocks, and wish chips', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1000, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestWidget());
      await tester.pump(const Duration(milliseconds: 500));

      // Verify Screen Title
      expect(find.text('Linh Xăm Quan Thánh 3D'), findsOneWidget);

      // Verify Cylinder & Moon Blocks altar
      expect(find.text('100 QUẺ THÁNH ĐẾ'), findsOneWidget);
      expect(find.text('CẶP KEO ÂM DƯƠNG'), findsOneWidget);

      // Verify Wish Setup & Sample chips
      expect(find.text('THÀNH TÂM KHẤN NGUYỆN'), findsOneWidget);
      expect(find.text('🎋 Cầu sự nghiệp, quan vận hanh thông đại cát?'), findsOneWidget);

      // Verify Shake/Cast Button
      expect(find.textContaining('LẮC ĐIỆN THOẠI HOẶC CHẠM ĐỂ GIEO XĂM'), findsOneWidget);

      // Tap action chip to select sample wish
      await tester.tap(find.text('🎋 Cầu sự nghiệp, quan vận hanh thông đại cát?'));
      await tester.pump(const Duration(milliseconds: 200));

      // Verify TextField has the selected wish text
      expect(find.widgetWithText(TextField, 'Cầu sự nghiệp, quan vận hanh thông đại cát?'), findsOneWidget);
    });

    testWidgets('shaking bamboo cylinder updates moon blocks to divine assent and fetches stick', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1000, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockStick = DivinationStick(
        id: 28,
        title: 'Đông Pha Đề Thi',
        level: 'Thượng thượng',
        poem: 'Công danh phú quý tại thiên tư,\nTự cổ anh hùng đắc ý thời.\nNhất triêu vũ hóa long xà biến,\nBất phụ thanh vân tráng chí sơ.',
        interpretation: 'Quẻ này ứng với thời vận rực rỡ, thi cử đỗ đạt, kinh doanh đại phát tài lộc.',
        advice: 'Tích đức hành thiện, khiêm cung cư xử, chớ kiêu căng tự mãn.',
        story: 'Tô Đông Pha thời Bắc Tống tài danh quán thế, thi đậu bảng vàng.',
        detailedInterpretations: {
          'home': 'Bình an cát khánh',
          'career': 'Thăng quan tiến chức',
          'wealth': 'Đắc đại tài lộc',
        },
      );

      final mockDraw = StickDraw(
        question: 'Cầu công danh đại cát?',
        stick: mockStick,
        narrative: 'Khâm Thiên Giám Ngự Phê: Thân chủ đắc quẻ số 28 Thượng Thượng, là quẻ cát tường bậc nhất của Quan Thánh Đế Quân.',
      );

      when(() => mockRepository.drawStick(
            question: any(named: 'question'),
          )).thenAnswer((_) async => mockDraw);

      await tester.pumpWidget(buildTestWidget());
      await tester.pump(const Duration(milliseconds: 500));

      // Tap Shake Button
      final shakeButton = find.textContaining('LẮC ĐIỆN THOẠI HOẶC CHẠM ĐỂ GIEO XĂM');
      expect(shakeButton, findsOneWidget);
      await tester.tap(shakeButton);

      // Advance through vibration & shake delay (1400ms)
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pump(const Duration(milliseconds: 500));

      // Settle response from backend
      await tester.pump(const Duration(milliseconds: 500));

      // Verify Moon Blocks confirmed
      expect(find.text('THẺ SỐ 28'), findsOneWidget);
      expect(find.text('THƯỢNG THƯỢNG'), findsOneWidget);
      expect(find.text('Đông Pha Đề Thi'), findsOneWidget);

      // Verify Poem & Classical Interpretation
      expect(find.text('THI THÁNH ĐẾ BAN'), findsOneWidget);
      expect(find.textContaining('Công danh phú quý'), findsOneWidget);
      expect(find.text('Ý NGHĨA QUẺ'), findsOneWidget);
      expect(find.text('LỜI KHUYÊN THÁNH ĐẾ'), findsOneWidget);
      expect(find.text('ĐIỂN TÍCH XƯA'), findsOneWidget);

      // Verify 7-Domain Grid
      expect(find.text('CHIÊM ĐOÁN CÁC PHƯƠNG DIỆN'), findsOneWidget);
      expect(find.textContaining('Bình an cát khánh', findRichText: true), findsOneWidget);
      expect(find.textContaining('Thăng quan tiến chức', findRichText: true), findsOneWidget);

      // Verify Imperial Commentary
      expect(find.text('KHÂM THIÊN GIÁM NGỰ PHÊ'), findsOneWidget);
      final markdown = tester.widget<MarkdownBody>(find.byType(MarkdownBody));
      expect(markdown.data, contains('quẻ cát tường bậc nhất'));
    });
  });
}
