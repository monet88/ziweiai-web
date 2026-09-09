import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/features/numerology/domain/feng_shui_number_calculator.dart';
import 'package:ziweiai_mobile/features/numerology/presentation/feng_shui_number_tab.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('FengShuiNumberCalculator Unit Tests', () {
    test('calculates correct lucky index, rating, and element for 4-digit number', () {
      // 3456 / 80 = 43.2 -> 0.2 * 80 = 16 (Quẻ 16: Đại Cát)
      final result = FengShuiNumberCalculator.calculate('0988.123.456');
      expect(result.luckyIndex, equals(16));
      expect(result.rating, equals('Đại Cát'));
      expect(result.element, contains('Thủy'));
      expect(result.meaning, contains('Đại quý hiển vinh'));
    });

    test('handles empty input gracefully with default advice', () {
      final result = FengShuiNumberCalculator.calculate('');
      expect(result.rating, equals('Bình Hòa'));
      expect(result.advice, contains('Vui lòng nhập'));
    });
  });

  group('FengShuiNumberTab Widget Tests', () {
    testWidgets('renders input fields, title, and calculate button', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: FengShuiNumberTab(),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('BÁCH KHOA LINH SỐ PHONG THỦY'), findsOneWidget);
      expect(find.text('NHẬP DÃY SỐ CẦN TRA CỨU'), findsOneWidget);
      expect(find.text('Luận Đoán Phong Thủy'), findsOneWidget);
    });

    testWidgets('entering number and tapping button displays result card', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: FengShuiNumberTab(),
          ),
        ),
      );
      await tester.pump();

      final input = find.byType(TextField);
      await tester.enterText(input, '0912345678');
      await tester.pump();

      final btn = find.text('Luận Đoán Phong Thủy');
      await tester.tap(btn);
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.textContaining('LINH SỐ QUẺ'), findsOneWidget);
      expect(find.textContaining('Ngũ Hành:'), findsOneWidget);
      expect(find.text('Ý NGHĨA LINH ỨNG'), findsOneWidget);
    });
  });
}
