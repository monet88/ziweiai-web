import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/daily_horoscope.dart';
import 'daily_horoscope_service.dart';

/// Trạng thái cấu hình thông báo Khâm Thiên Giám Ngự Báo
class DailyNotificationState {
  final bool isEnabled;
  final int scheduledHour;
  final int scheduledMinute;
  final DateTime? lastSentDate;

  const DailyNotificationState({
    this.isEnabled = true,
    this.scheduledHour = 7,
    this.scheduledMinute = 0,
    this.lastSentDate,
  });

  DailyNotificationState copyWith({
    bool? isEnabled,
    int? scheduledHour,
    int? scheduledMinute,
    DateTime? lastSentDate,
  }) {
    return DailyNotificationState(
      isEnabled: isEnabled ?? this.isEnabled,
      scheduledHour: scheduledHour ?? this.scheduledHour,
      scheduledMinute: scheduledMinute ?? this.scheduledMinute,
      lastSentDate: lastSentDate ?? this.lastSentDate,
    );
  }
}

/// Dịch vụ quản lý Thông Báo Đẩy Sáng 07:00 Khâm Thiên Giám Ngự Báo
class DailyNotificationNotifier extends Notifier<DailyNotificationState> {
  @override
  DailyNotificationState build() {
    return const DailyNotificationState();
  }

  /// Bật hoặc tắt thông báo 07:00 sáng
  void setEnabled(bool enabled) {
    state = state.copyWith(isEnabled: enabled);
  }

  /// Toggle thông báo
  void toggleNotification() {
    state = state.copyWith(isEnabled: !state.isEnabled);
  }

  /// Tính thời điểm thông báo 07:00 sáng tiếp theo
  DateTime getNextScheduledTime([DateTime? referenceTime]) {
    final now = referenceTime ?? DateTime.now();
    var scheduled = DateTime(
      now.year,
      now.month,
      now.day,
      state.scheduledHour,
      state.scheduledMinute,
    );

    if (now.isAfter(scheduled)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }
    return scheduled;
  }

  /// Tạo nội dung thông điệp thông báo dựa trên khí vận ngày
  Map<String, String> generateNotificationPayload([DailyHoroscope? horoscope]) {
    final h = horoscope ?? DailyHoroscopeService.calculateHoroscope();
    final firstHoangDao = h.hoangDaoHours.isNotEmpty ? h.hoangDaoHours.first : 'Tý';

    return {
      'title': '✦ Khâm Thiên Giám Ngự Báo: Khí Vận Ngày Mới',
      'body':
          'Ngày ${h.canChiDay} (${h.element}) đã giáng thế. Cát thần ngự hướng ${h.huongTaiThan}. Giờ hoàng đạo: $firstHoangDao. Mời Đại Hiệp khai mở ngự thư!',
      'canChi': h.canChiDay,
      'element': h.element,
      'taiThan': h.huongTaiThan,
    };
  }

  /// Đánh dấu đã gửi thông báo hôm nay
  void recordSent() {
    state = state.copyWith(lastSentDate: DateTime.now());
  }
}

/// Provider toàn cục cho DailyNotificationNotifier
final dailyNotificationProvider =
    NotifierProvider<DailyNotificationNotifier, DailyNotificationState>(() {
  return DailyNotificationNotifier();
});

/// Provider cung cấp DailyHoroscope của ngày hôm nay
final todayHoroscopeProvider = Provider<DailyHoroscope>((ref) {
  return DailyHoroscopeService.calculateHoroscope();
});
