import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/features/horoscope/domain/models/daily_horoscope.dart';
import 'package:ziweiai_mobile/features/horoscope/domain/services/daily_notification_service.dart';
import 'package:ziweiai_mobile/features/horoscope/presentation/widgets/royal_daily_horoscope_card.dart';
import 'package:ziweiai_mobile/features/horoscope/presentation/widgets/royal_horoscope_sheet.dart';

void main() {
  group('Royal Daily Horoscope Widget Tests', () {
    late DailyHoroscope mockHoroscope;

    setUp(() {
      mockHoroscope = DailyHoroscope(
        date: DateTime(2026, 9, 9),
        canChiDay: 'Giáp Tý',
        napAm: 'Hải Trung Kim',
        element: 'Kim',
        truc: TrucNhat.thanh,
        sao: NhiThapBatTu.all.first, // Giác
        hoangDaoHours: const [
          'Tý (23h-01h)',
          'Sửu (01h-03h)',
          'Mão (05h-07h)',
          'Ngọ (11h-13h)',
          'Thân (15h-17h)',
          'Dậu (17h-19h)',
        ],
        huongTaiThan: 'Đông Nam',
        huongHyThan: 'Đông Bắc',
        huongHacThan: 'Chính Nam',
        auspiciousActivities: const [
          'Cầu tài lộc, giao dịch ký kết',
          'Khai trương, xuất hành nghênh cát',
        ],
        tabooActivities: const [
          'Tranh cãi, kiện tụng thị phi',
          'Khởi công động thổ',
        ],
        royalDecree:
            'Khí Kim sắc bén, cương trực quang minh. Hôm nay là ngày đại cát để quyết đoán ký kết, khai mở đường lối.',
      );
    });

    testWidgets('RoyalDailyHoroscopeCard displays rich cosmic and almanac data',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            todayHoroscopeProvider.overrideWithValue(mockHoroscope),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: SingleChildScrollView(
                child: RoyalDailyHoroscopeCard(customHoroscope: mockHoroscope),
              ),
            ),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 300));

      // Kiểm tra tiêu đề và Can Chi
      expect(find.text('KHÂM THIÊN GIÁM NGỰ BÁO'), findsOneWidget);
      expect(find.text('Giáp Tý'), findsOneWidget);
      expect(find.text('Hải Trung Kim'), findsOneWidget);
      expect(find.text('TRỰC THÀNH (CÁT)'), findsOneWidget);

      // Kiểm tra Hướng Tài Thần & Hỷ Thần
      expect(find.text('Tài Thần: Đông Nam'), findsOneWidget);
      expect(find.text('Hỷ Thần: Đông Bắc'), findsOneWidget);

      // Kiểm tra nút Khai Mở Ngự Báo
      expect(find.byKey(const Key('open_royal_horoscope_button')), findsOneWidget);
    });

    testWidgets('Tapping notification bell toggles schedule and shows SnackBar',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            todayHoroscopeProvider.overrideWithValue(mockHoroscope),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: SingleChildScrollView(
                child: RoyalDailyHoroscopeCard(customHoroscope: mockHoroscope),
              ),
            ),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 300));

      final bellButton = find.byKey(const Key('daily_notification_bell_button'));
      expect(bellButton, findsOneWidget);

      // Tap để tắt
      await tester.tap(bellButton);
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Đã tắt ngự báo sáng hàng ngày'), findsOneWidget);

      // Tap lần nữa để bật lại
      await tester.tap(bellButton);
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Đã bật ngự báo 07:00 sáng mỗi ngày'), findsOneWidget);
    });

    testWidgets('RoyalHoroscopeSheet renders royal decree, seal, and action buttons',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: RoyalHoroscopeSheet(horoscope: mockHoroscope),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 300));

      // Kiểm tra ấn triện son NGỰ PHÊ
      expect(find.text('NGỰ PHÊ'), findsOneWidget);
      expect(find.text('CHỈ DỤ ĐẦU NGÀY'), findsOneWidget);
      expect(find.text(mockHoroscope.royalDecree), findsOneWidget);

      // Kiểm tra các cột Trực Nhật & Phương vị
      expect(find.text('Trực Thành (Cát)'), findsOneWidget);
      expect(find.text('Đông Nam'), findsOneWidget);
      expect(find.text('Đông Bắc'), findsOneWidget);

      // Scroll đến nút hành động nếu cần
      await tester.scrollUntilVisible(find.text('ĐÓNG NGỰ THƯ'), 300);
      await tester.pump(const Duration(milliseconds: 100));

      // Kiểm tra nút bấm hành động
      expect(find.text('ĐÓNG NGỰ THƯ'), findsOneWidget);
      expect(find.text('VẤN ĐÁP THỜI VẬN'), findsOneWidget);
    });
  });
}
