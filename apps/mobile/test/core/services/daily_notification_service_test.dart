import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/core/services/daily_notification_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('DailyNotificationService Unit Tests', () {
    test('defines correct imperial channel parameters', () {
      expect(DailyNotificationService.channelId, 'vios_daily_rituals');
      expect(
        DailyNotificationService.channelName,
        'Khâm Thiên Giám — Hoàng Đạo & Quẻ Ngày',
      );
      expect(
        DailyNotificationService.channelDescription,
        contains('giờ Hoàng Đạo'),
      );
    });

    test('creates DailyNotificationService instance successfully', () {
      final service = DailyNotificationService();
      expect(service, isNotNull);
    });
  });
}
