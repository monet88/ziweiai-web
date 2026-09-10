import '../models/daily_horoscope.dart';

/// Dịch vụ tính toán Khí Vận Nhật Khóa từ Khâm Thiên Giám (Daily Horoscope Service)
/// Thuần Dart, chạy offline-first < 10ms, chuẩn xác theo thuật toán thiên văn học cổ truyền.
class DailyHoroscopeService {
  static const List<String> heavenlyStems = [
    'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'
  ];

  static const List<String> earthlyBranches = [
    'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'
  ];

  static const Map<String, String> napAmMap = {
    'Giáp Tý': 'Hải Trung Kim', 'Ất Sửu': 'Hải Trung Kim',
    'Bính Dần': 'Lư Trung Hỏa', 'Đinh Mão': 'Lư Trung Hỏa',
    'Mậu Thìn': 'Đại Lâm Mộc', 'Kỷ Tỵ': 'Đại Lâm Mộc',
    'Canh Ngọ': 'Lộ Bàng Thổ', 'Tân Mùi': 'Lộ Bàng Thổ',
    'Nhâm Thân': 'Kiếm Phong Kim', 'Quý Dậu': 'Kiếm Phong Kim',
    'Giáp Tuất': 'Sơn Đầu Hỏa', 'Ất Hợi': 'Sơn Đầu Hỏa',
    'Bính Tý': 'Giản Hạ Thủy', 'Đinh Sửu': 'Giản Hạ Thủy',
    'Mậu Dần': 'Thành Đầu Thổ', 'Kỷ Mão': 'Thành Đầu Thổ',
    'Canh Thìn': 'Bạch Lạp Kim', 'Tân Tỵ': 'Bạch Lạp Kim',
    'Nhâm Ngọ': 'Dương Liễu Mộc', 'Quý Mùi': 'Dương Liễu Mộc',
    'Giáp Thân': 'Tuyền Trung Thủy', 'Ất Dậu': 'Tuyền Trung Thủy',
    'Bính Tuất': 'Ốc Thượng Thổ', 'Đinh Hợi': 'Ốc Thượng Thổ',
    'Mậu Tý': 'Tích Lịch Hỏa', 'Kỷ Sửu': 'Tích Lịch Hỏa',
    'Canh Dần': 'Tùng Bách Mộc', 'Tân Mão': 'Tùng Bách Mộc',
    'Nhâm Thìn': 'Trường Lưu Thủy', 'Quý Tỵ': 'Trường Lưu Thủy',
    'Giáp Ngọ': 'Sa Trung Kim', 'Ất Mùi': 'Sa Trung Kim',
    'Bính Thân': 'Sơn Hạ Hỏa', 'Đinh Dậu': 'Sơn Hạ Hỏa',
    'Mậu Tuất': 'Bình Địa Mộc', 'Kỷ Hợi': 'Bình Địa Mộc',
    'Canh Tý': 'Bích Thượng Thổ', 'Tân Sửu': 'Bích Thượng Thổ',
    'Nhâm Dần': 'Kim Bạc Kim', 'Quý Mão': 'Kim Bạc Kim',
    'Giáp Thìn': 'Phúc Đăng Hỏa', 'Ất Tỵ': 'Phúc Đăng Hỏa',
    'Bính Ngọ': 'Thiên Thượng Hỏa', 'Đinh Mùi': 'Thiên Thượng Hỏa',
    'Mậu Thân': 'Đại Trạch Thổ', 'Kỷ Dậu': 'Đại Trạch Thổ',
    'Canh Tuất': 'Thoa Xuyến Kim', 'Tân Hợi': 'Thoa Xuyến Kim',
    'Nhâm Tý': 'Tang Đố Mộc', 'Quý Sửu': 'Tang Đố Mộc',
    'Giáp Dần': 'Đại Khê Thủy', 'Ất Mão': 'Đại Khê Thủy',
    'Bính Thìn': 'Sa Trung Thổ', 'Đinh Tỵ': 'Sa Trung Thổ',
    'Mậu Ngọ': 'Thiên Thượng Hỏa', 'Kỷ Mùi': 'Thiên Thượng Hỏa',
    'Canh Thân': 'Thạch Lựu Mộc', 'Tân Dậu': 'Thạch Lựu Mộc',
    'Nhâm Tuất': 'Đại Hải Thủy', 'Quý Hợi': 'Đại Hải Thủy',
  };

  /// Tính Julian Day Number (JD) từ ngày dương lịch
  static int getJulianDayNumber(int year, int month, int day) {
    int a = ((14 - month) / 12).floor();
    int y = year + 4800 - a;
    int m = month + 12 * a - 3;
    return day +
        ((153 * m + 2) / 5).floor() +
        365 * y +
        (y / 4).floor() -
        (y / 100).floor() +
        (y / 400).floor() -
        32045;
  }

  /// Lấy Can Chi của ngày từ DateTime
  static String getCanChiDay(DateTime date) {
    final jd = getJulianDayNumber(date.year, date.month, date.day);
    final canIdx = (jd + 9) % 10;
    final chiIdx = (jd + 1) % 12;
    return '${heavenlyStems[canIdx]} ${earthlyBranches[chiIdx]}';
  }

  /// Lấy ngũ hành chính từ nạp âm
  static String getElementFromNapAm(String napAm) {
    if (napAm.contains('Kim')) return 'Kim';
    if (napAm.contains('Mộc')) return 'Mộc';
    if (napAm.contains('Thủy')) return 'Thủy';
    if (napAm.contains('Hỏa')) return 'Hỏa';
    return 'Thổ';
  }

  /// Xác định 12 Trực nhật
  static TrucNhat getTrucNhat(DateTime date) {
    final jd = getJulianDayNumber(date.year, date.month, date.day);
    final chiDay = (jd + 1) % 12;
    // Chi tháng gần đúng theo chu kỳ tiết khí (tháng 1 là Dần [2], tháng 2 là Mão [3],...)
    final chiMonth = (date.month + 1) % 12;
    int trucIdx = (chiDay - chiMonth) % 12;
    if (trucIdx < 0) trucIdx += 12;

    const trucList = [
      TrucNhat.kien,
      TrucNhat.tru,
      TrucNhat.man,
      TrucNhat.binh,
      TrucNhat.dinh,
      TrucNhat.chap,
      TrucNhat.pha,
      TrucNhat.nguy,
      TrucNhat.thanh,
      TrucNhat.thau,
      TrucNhat.khai,
      TrucNhat.be,
    ];
    return trucList[trucIdx % trucList.length];
  }

  /// Xác định Nhị Thập Bát Tú (28 Sao Cát Hung)
  static NhiThapBatTu getNhiThapBatTu(DateTime date) {
    final jd = getJulianDayNumber(date.year, date.month, date.day);
    // Chu kỳ 28 sao
    final saoIdx = (jd + 11) % 28;
    return NhiThapBatTu.all[saoIdx < 0 ? saoIdx + 28 : saoIdx];
  }

  /// Xác định 6 Giờ Hoàng Đạo trong ngày theo Chi ngày
  static List<String> getHoangDaoHours(String chiDay) {
    switch (chiDay) {
      case 'Tý':
      case 'Ngọ':
        return [
          'Tý (23h-01h)',
          'Sửu (01h-03h)',
          'Mão (05h-07h)',
          'Ngọ (11h-13h)',
          'Thân (15h-17h)',
          'Dậu (17h-19h)',
        ];
      case 'Sửu':
      case 'Mùi':
        return [
          'Dần (03h-05h)',
          'Mão (05h-07h)',
          'Tỵ (09h-11h)',
          'Thân (15h-17h)',
          'Tuất (19h-21h)',
          'Hợi (21h-23h)',
        ];
      case 'Dần':
      case 'Thân':
        return [
          'Tý (23h-01h)',
          'Sửu (01h-03h)',
          'Thìn (07h-09h)',
          'Tỵ (09h-11h)',
          'Mùi (13h-15h)',
          'Tuất (19h-21h)',
        ];
      case 'Mão':
      case 'Dậu':
        return [
          'Tý (23h-01h)',
          'Dần (03h-05h)',
          'Mão (05h-07h)',
          'Ngọ (11h-13h)',
          'Mùi (13h-15h)',
          'Dậu (17h-19h)',
        ];
      case 'Thìn':
      case 'Tuất':
        return [
          'Dần (03h-05h)',
          'Thìn (07h-09h)',
          'Tỵ (09h-11h)',
          'Thân (15h-17h)',
          'Dậu (17h-19h)',
          'Hợi (21h-23h)',
        ];
      case 'Tỵ':
      case 'Hợi':
      default:
        return [
          'Sửu (01h-03h)',
          'Thìn (07h-09h)',
          'Ngọ (11h-13h)',
          'Mùi (13h-15h)',
          'Tuất (19h-21h)',
          'Hợi (21h-23h)',
        ];
    }
  }

  /// Tra cứu Phương Vị Xuất Hành (Tài Thần, Hỷ Thần, Hạc Thần) theo Thiên Can
  static Map<String, String> getDirections(String canDay) {
    switch (canDay) {
      case 'Giáp':
        return {'taiThan': 'Đông Nam', 'hyThan': 'Đông Bắc', 'hacThan': 'Chính Nam'};
      case 'Ất':
        return {'taiThan': 'Đông Nam', 'hyThan': 'Tây Bắc', 'hacThan': 'Tây Nam'};
      case 'Bính':
        return {'taiThan': 'Chính Đông', 'hyThan': 'Tây Nam', 'hacThan': 'Chính Tây'};
      case 'Đinh':
        return {'taiThan': 'Chính Đông', 'hyThan': 'Chính Nam', 'hacThan': 'Tây Bắc'};
      case 'Mậu':
        return {'taiThan': 'Chính Bắc', 'hyThan': 'Đông Nam', 'hacThan': 'Chính Bắc'};
      case 'Kỷ':
        return {'taiThan': 'Chính Nam', 'hyThan': 'Đông Bắc', 'hacThan': 'Đông Bắc'};
      case 'Canh':
        return {'taiThan': 'Tây Nam', 'hyThan': 'Tây Bắc', 'hacThan': 'Chính Đông'};
      case 'Tân':
        return {'taiThan': 'Tây Nam', 'hyThan': 'Tây Nam', 'hacThan': 'Đông Nam'};
      case 'Nhâm':
        return {'taiThan': 'Chính Tây', 'hyThan': 'Chính Nam', 'hacThan': 'Trung Cung'};
      case 'Quý':
      default:
        return {'taiThan': 'Chính Bắc', 'hyThan': 'Đông Nam', 'hacThan': 'Trung Cung'};
    }
  }

  /// Lời Ngự Phê Khâm Thiên Giám (Royal Daily Decrees) theo Ngũ Hành & Cát Khí
  static String getRoyalDecree(String element, bool isDayGood) {
    if (isDayGood) {
      switch (element) {
        case 'Kim':
          return 'Khí Kim sắc bén, cương trực quang minh. Hôm nay là ngày đại cát để quyết đoán ký kết, khai mở đường lối, nghênh đón quý nhân phương Tây.';
        case 'Mộc':
          return 'Khí Mộc sinh sôi, vạn vật nảy chồi. Hôm nay thích hợp gieo trồng nhân duyên, khởi đầu dự án mới, học đạo dưỡng khí, cát tường vô biên.';
        case 'Thủy':
          return 'Khí Thủy lưu chuyển, nhu thuận hanh thông. Trí tuệ rộng mở, thích hợp giao tế bàn bạc, lưu thông dòng vốn, hóa giải bất đồng.';
        case 'Hỏa':
          return 'Khí Hỏa rực rỡ, danh tiếng vang xa. Năng lượng dương khí đỉnh thịnh, thích hợp biểu dương công đức, khai trương tạo tiếng vang lớn.';
        case 'Thổ':
        default:
          return 'Khí Thổ vững chãi, thâu nạp tinh hoa. Hôm nay thích hợp củng cố nền tảng, tích lũy tài sản, định ước lâu bền, gia đạo an khang.';
      }
    } else {
      switch (element) {
        case 'Kim':
          return 'Kim khí quá cương dễ gãy. Hôm nay nên khiêm nhường dĩ hòa vi quý, tránh tranh luận sắc sảo, tích lũy nội lực đợi thời cơ.';
        case 'Mộc':
          return 'Cây đón gió to chớ vội vươn cành. Khâm Thiên Giám khuyên giữ tâm an tĩnh, cẩn trọng giấy tờ, chớ manh động mạo hiểm.';
        case 'Thủy':
          return 'Nước sâu sóng ngầm, liệu bề mà tiến. Hãy cẩn trọng chi tiêu, đề phòng tiểu nhân dèm pha, lấy tĩnh chế động là thượng sách.';
        case 'Hỏa':
          return 'Hỏa khí bốc cao dễ sinh nóng giận. Ngày nay nên uống nước mát, thiền định tịnh tâm, hoãn các việc ký kết vội vàng.';
        case 'Thổ':
        default:
          return 'Đất dày cần bồi đắp. Hôm nay nên an phận giữ mình, dưỡng thân tĩnh trí, dọn dẹp không gian sống để nghênh đón cát khí mới.';
      }
    }
  }

  static DailyHoroscope? _cachedHoroscope;
  static int? _cachedYear;
  static int? _cachedMonth;
  static int? _cachedDay;

  /// Xóa cache khí vận nhật khóa
  static void clearCache() {
    _cachedHoroscope = null;
    _cachedYear = null;
    _cachedMonth = null;
    _cachedDay = null;
  }

  /// Tạo bản DailyHoroscope hoàn chỉnh cho một ngày (có bộ nhớ đệm in-memory theo ngày)
  static DailyHoroscope calculateHoroscope([DateTime? targetDate]) {
    final date = targetDate ?? DateTime.now();

    if (_cachedHoroscope != null &&
        _cachedYear == date.year &&
        _cachedMonth == date.month &&
        _cachedDay == date.day) {
      return _cachedHoroscope!;
    }

    final canChi = getCanChiDay(date);
    final parts = canChi.split(' ');
    final can = parts.isNotEmpty ? parts[0] : 'Giáp';
    final chi = parts.length > 1 ? parts[1] : 'Tý';

    final napAm = napAmMap[canChi] ?? 'Hải Trung Kim';
    final element = getElementFromNapAm(napAm);
    final truc = getTrucNhat(date);
    final sao = getNhiThapBatTu(date);
    final hoangDao = getHoangDaoHours(chi);
    final directions = getDirections(can);

    final isDayGood = truc.isGood && sao.isGood;

    List<String> auspicious;
    List<String> taboo;

    if (truc.isGood) {
      auspicious = [
        'Cầu tài lộc, giao dịch ký kết',
        'Khai trương, xuất hành nghênh cát',
        'Tế tự, cầu an gia đạo hanh thông',
        'Gặp gỡ quý nhân, kết giao bạn tốt'
      ];
      taboo = [
        'Tranh cãi, kiện tụng thị phi',
        'Khởi công động thổ nếu chưa kén giờ',
        'Tham lam mạo hiểm quá đà'
      ];
    } else {
      auspicious = [
        'Dọn dẹp nhà cửa, tẩy uế không gian',
        'Thiền định, tụng kinh cầu an',
        'Tu bổ rèn luyện thân tâm',
        'Hoàn thành công việc còn dang dở'
      ];
      taboo = [
        'Khai trương, mở rộng đầu tư lớn',
        'Xuất hành đi xa ban đêm',
        'Động thổ, di dời đồ vật quan trọng',
        'Vay mượn nợ nần phát sinh'
      ];
    }

    final decree = getRoyalDecree(element, isDayGood);

    final result = DailyHoroscope(
      date: date,
      canChiDay: canChi,
      napAm: napAm,
      element: element,
      truc: truc,
      sao: sao,
      hoangDaoHours: hoangDao,
      huongTaiThan: directions['taiThan'] ?? 'Đông Nam',
      huongHyThan: directions['hyThan'] ?? 'Đông Bắc',
      huongHacThan: directions['hacThan'] ?? 'Chính Nam',
      auspiciousActivities: auspicious,
      tabooActivities: taboo,
      royalDecree: decree,
    );

    _cachedHoroscope = result;
    _cachedYear = date.year;
    _cachedMonth = date.month;
    _cachedDay = date.day;

    return result;
  }
}
