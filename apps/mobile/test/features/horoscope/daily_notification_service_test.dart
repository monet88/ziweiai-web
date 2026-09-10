import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/features/horoscope/domain/services/daily_notification_service.dart';

void main() {
  group('DailyNotificationNotifier Unit Tests', () {
    test('Initial state is enabled for 07:00 AM', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final state = container.read(dailyNotificationProvider);
      expect(state.isEnabled, isTrue);
      expect(state.scheduledHour, equals(7));
      expect(state.scheduledMinute, equals(0));
      expect(state.lastSentDate, isNull);
    });

    test('setEnabled and toggleNotification change state correctly', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(dailyNotificationProvider.notifier);

      notifier.setEnabled(false);
      expect(container.read(dailyNotificationProvider).isEnabled, isFalse);

      notifier.toggleNotification();
      expect(container.read(dailyNotificationProvider).isEnabled, isTrue);

      notifier.toggleNotification();
      expect(container.read(dailyNotificationProvider).isEnabled, isFalse);
    });

    test('getNextScheduledTime schedules for today if before 7:00 AM', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(dailyNotificationProvider.notifier);
      // Lúc 05:30 sáng ngày 09/09/2026 -> Lịch là 07:00 sáng ngày 09/09/2026
      final morningTime = DateTime(2026, 9, 9, 5, 30);
      final nextTime = notifier.getNextScheduledTime(morningTime);

      expect(nextTime.year, equals(2026));
      expect(nextTime.month, equals(9));
      expect(nextTime.day, equals(9));
      expect(nextTime.hour, equals(7));
      expect(nextTime.minute, equals(0));
    });

    test('getNextScheduledTime schedules for tomorrow if after 7:00 AM', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(dailyNotificationProvider.notifier);
      // Lúc 08:30 sáng ngày 09/09/2026 -> Lịch là 07:00 sáng ngày 10/09/2026
      final daytime = DateTime(2026, 9, 9, 8, 30);
      final nextTime = notifier.getNextScheduledTime(daytime);

      expect(nextTime.year, equals(2026));
      expect(nextTime.month, equals(9));
      expect(nextTime.day, equals(10));
      expect(nextTime.hour, equals(7));
      expect(nextTime.minute, equals(0));
    });

    test('generateNotificationPayload contains rich imperial decree elements', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(dailyNotificationProvider.notifier);
      final payload = notifier.generateNotificationPayload();

      expect(payload['title'], contains('Khâm Thiên Giám Ngự Báo'));
      expect(payload['body'], contains('giáng thế'));
      expect(payload['body'], contains('Cát thần ngự hướng'));
      expect(payload['canChi']?.isNotEmpty, isTrue);
      expect(payload['element']?.isNotEmpty, isTrue);
      expect(payload['taiThan']?.isNotEmpty, isTrue);
    });

    test('recordSent updates lastSentDate timestamp', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(dailyNotificationProvider.notifier);
      expect(container.read(dailyNotificationProvider).lastSentDate, isNull);

      notifier.recordSent();
      expect(container.read(dailyNotificationProvider).lastSentDate, isNotNull);
    });
  });
}
