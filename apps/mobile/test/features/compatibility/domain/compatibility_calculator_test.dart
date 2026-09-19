import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/features/compatibility/domain/models/compatibility_models.dart';
import 'package:ziweiai_mobile/features/compatibility/domain/services/compatibility_calculator.dart';

void main() {
  group('CompatibilityCalculator Tests', () {
    test('Can Chi and Nap Am lookups for classic years', () {
      // 1984 -> Giáp Tý (Hải Trung Kim)
      expect(CompatibilityCalculator.getCanChi(1984), equals('Giáp Tý'));
      expect(CompatibilityCalculator.napAmMap['Giáp Tý'], equals('Hải Trung Kim'));
      expect(CompatibilityCalculator.getElement('Hải Trung Kim'), equals('Kim'));

      // 1990 -> Canh Ngọ (Lộ Bàng Thổ)
      expect(CompatibilityCalculator.getCanChi(1990), equals('Canh Ngọ'));
      expect(CompatibilityCalculator.napAmMap['Canh Ngọ'], equals('Lộ Bàng Thổ'));
      expect(CompatibilityCalculator.getElement('Lộ Bàng Thổ'), equals('Thổ'));

      // 1995 -> Ất Hợi (Sơn Đầu Hỏa)
      expect(CompatibilityCalculator.getCanChi(1995), equals('Ất Hợi'));
      expect(CompatibilityCalculator.napAmMap['Ất Hợi'], equals('Sơn Đầu Hỏa'));
      expect(CompatibilityCalculator.getElement('Sơn Đầu Hỏa'), equals('Hỏa'));
    });

    test('Cung Phi Bat Trach calculation for male and female', () {
      // 1990: sum = 1+9+9+0 = 19 -> 1+9 = 10 -> 1+0 = 1
      // Nam: 10 - 1 = 9 -> Ly (remainder 9 is Ly)
      // Nữ: 5 + 1 = 6 -> Càn
      final male1990 = CompatibilityCalculator.getCungPhi(1990, true);
      final female1990 = CompatibilityCalculator.getCungPhi(1990, false);
      expect(male1990, equals('Ly'));
      expect(female1990, equals('Càn'));

      // 1988: sum = 1+9+8+8 = 26 -> 8
      // Nam: 10 - 8 = 2 -> Khôn
      // Nữ: 5 + 8 = 13 -> 4 -> Tốn
      final male1988 = CompatibilityCalculator.getCungPhi(1988, true);
      final female1988 = CompatibilityCalculator.getCungPhi(1988, false);
      expect(male1988, equals('Khôn'));
      expect(female1988, equals('Tốn'));
    });

    test('Bat Trach combinations return valid auspicious or inauspicious ratings', () {
      final sinhKhi = CompatibilityCalculator.evaluateBatTrach('Càn', 'Đoài');
      expect(sinhKhi['name'], equals('Sinh Khí'));
      expect(sinhKhi['score'], equals(25));

      final dienNien = CompatibilityCalculator.evaluateBatTrach('Khảm', 'Ly');
      expect(dienNien['name'], equals('Diên Niên'));
      expect(dienNien['score'], equals(24));

      final tuyetMenh = CompatibilityCalculator.evaluateBatTrach('Càn', 'Ly');
      expect(tuyetMenh['name'], equals('Tuyệt Mệnh'));
      expect(tuyetMenh['score'], equals(4));
    });

    test('Full Compatibility calculation produces valid scores and aspects', () {
      const p1 = CompatibilityPerson(
        name: 'Hoàng Thượng',
        year: 1990, // Canh Ngọ (Thổ)
        gender: 'male',
      );
      const p2 = CompatibilityPerson(
        name: 'Hoàng Hậu',
        year: 1995, // Ất Hợi (Hỏa)
        gender: 'female',
      );

      final result = CompatibilityCalculator.calculate(
        person1: p1,
        person2: p2,
        category: CompatibilityCategory.love,
      );

      // Thổ & Hỏa -> Tương sinh (+25)
      expect(result.elementAspect.score, equals(25));
      // Ất & Canh -> Thiên Can Ngũ Hợp (+25)
      expect(result.canAspect.score, equals(25));

      expect(result.totalScore, greaterThanOrEqualTo(20));
      expect(result.totalScore, lessThanOrEqualTo(100));
      expect(result.verdictTitle.isNotEmpty, isTrue);
      expect(result.imperialPoem.isNotEmpty, isTrue);
      expect(result.advice.isNotEmpty, isTrue);
    });
  });
}
