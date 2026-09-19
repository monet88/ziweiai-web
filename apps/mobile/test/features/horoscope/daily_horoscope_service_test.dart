import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/features/horoscope/domain/models/daily_horoscope.dart';
import 'package:ziweiai_mobile/features/horoscope/domain/services/daily_horoscope_service.dart';

void main() {
  group('DailyHoroscopeService Unit Tests', () {
    test('Julian Day Number calculation is mathematically precise', () {
      // Ngày 01/01/2000 có JD chuẩn thiên văn là 2451545
      final jd2000 = DailyHoroscopeService.getJulianDayNumber(2000, 1, 1);
      expect(jd2000, equals(2451545));
    });

    test('Can Chi Day calculation matches astronomical ephemeris', () {
      // 01/01/2000 là ngày Mậu Ngọ
      final canChi2000 = DailyHoroscopeService.getCanChiDay(DateTime(2000, 1, 1));
      expect(canChi2000, equals('Mậu Ngọ'));

      // Ngày 02/01/2000 là ngày Kỷ Mùi
      final canChiNext = DailyHoroscopeService.getCanChiDay(DateTime(2000, 1, 2));
      expect(canChiNext, equals('Kỷ Mùi'));
    });

    test('Element extraction from Nap Am is accurate', () {
      expect(DailyHoroscopeService.getElementFromNapAm('Hải Trung Kim'), equals('Kim'));
      expect(DailyHoroscopeService.getElementFromNapAm('Đại Lâm Mộc'), equals('Mộc'));
      expect(DailyHoroscopeService.getElementFromNapAm('Giản Hạ Thủy'), equals('Thủy'));
      expect(DailyHoroscopeService.getElementFromNapAm('Thiên Thượng Hỏa'), equals('Hỏa'));
      expect(DailyHoroscopeService.getElementFromNapAm('Lộ Bàng Thổ'), equals('Thổ'));
    });

    test('Truc Nhat (12 Truc) is calculated and has valid meaning', () {
      final date = DateTime(2026, 9, 9);
      final truc = DailyHoroscopeService.getTrucNhat(date);
      expect(truc.name.isNotEmpty, isTrue);
      expect(truc.description.isNotEmpty, isTrue);
    });

    test('Nhi Thap Bat Tu (28 Sao) is within valid 28 mansions', () {
      final date = DateTime(2026, 9, 9);
      final sao = DailyHoroscopeService.getNhiThapBatTu(date);
      expect(NhiThapBatTu.all.contains(sao), isTrue);
      expect(sao.name.isNotEmpty, isTrue);
      expect(sao.meaning.isNotEmpty, isTrue);
    });

    test('Hoang Dao Hours returns exactly 6 golden hours', () {
      final hoursTy = DailyHoroscopeService.getHoangDaoHours('Tý');
      expect(hoursTy.length, equals(6));
      expect(hoursTy, contains('Tý (23h-01h)'));
      expect(hoursTy, contains('Sửu (01h-03h)'));

      final hoursDan = DailyHoroscopeService.getHoangDaoHours('Dần');
      expect(hoursDan.length, equals(6));
      expect(hoursDan, contains('Thìn (07h-09h)'));
    });

    test('Directions (Tai Than, Hy Than, Hac Than) are properly mapped for Can', () {
      final giapDirs = DailyHoroscopeService.getDirections('Giáp');
      expect(giapDirs['taiThan'], equals('Đông Nam'));
      expect(giapDirs['hyThan'], equals('Đông Bắc'));

      final canhDirs = DailyHoroscopeService.getDirections('Canh');
      expect(canhDirs['taiThan'], equals('Tây Nam'));
      expect(canhDirs['hyThan'], equals('Tây Bắc'));
    });

    test('Royal Decrees generate inspiring poetic texts for all 5 elements', () {
      for (final el in ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ']) {
        final goodDecree = DailyHoroscopeService.getRoyalDecree(el, true);
        final cautionDecree = DailyHoroscopeService.getRoyalDecree(el, false);
        expect(goodDecree.isNotEmpty, isTrue);
        expect(cautionDecree.isNotEmpty, isTrue);
      }
    });

    test('calculateHoroscope produces a complete, robust DailyHoroscope object', () {
      final testDate = DateTime(2026, 9, 9);
      final horoscope = DailyHoroscopeService.calculateHoroscope(testDate);

      expect(horoscope.date, equals(testDate));
      expect(horoscope.canChiDay.isNotEmpty, isTrue);
      expect(horoscope.napAm.isNotEmpty, isTrue);
      expect(['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'], contains(horoscope.element));
      expect(horoscope.hoangDaoHours.length, equals(6));
      expect(horoscope.huongTaiThan.isNotEmpty, isTrue);
      expect(horoscope.huongHyThan.isNotEmpty, isTrue);
      expect(horoscope.auspiciousActivities.isNotEmpty, isTrue);
      expect(horoscope.tabooActivities.isNotEmpty, isTrue);
      expect(horoscope.royalDecree.isNotEmpty, isTrue);
    });

    test('calculateHoroscope returns cached instance for same day and updates on clearCache', () {
      DailyHoroscopeService.clearCache();
      final dateA = DateTime(2026, 9, 9, 8, 30);
      final first = DailyHoroscopeService.calculateHoroscope(dateA);

      final dateB = DateTime(2026, 9, 9, 14, 00);
      final cached = DailyHoroscopeService.calculateHoroscope(dateB);
      expect(identical(first, cached), isTrue);

      DailyHoroscopeService.clearCache();
      final afterClear = DailyHoroscopeService.calculateHoroscope(dateB);
      expect(afterClear.canChiDay, equals(first.canChiDay));
    });
  });
}
