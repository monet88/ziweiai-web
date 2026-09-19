import '../models/compatibility_models.dart';

class CompatibilityCalculator {
  static const List<String> heavenlyStems = [
    'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'
  ];

  static const List<String> earthlyBranches = [
    'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'
  ];

  /// Tra cứu Can Chi năm sinh
  static String getCanChi(int year) {
    // Năm 1984 là Giáp Tý (Can: (1984 - 4) % 10 = 0 -> Giáp, Chi: (1984 - 4) % 12 = 0 -> Tý)
    final canIndex = (year - 4) % 10;
    final chiIndex = (year - 4) % 12;
    final safeCan = canIndex < 0 ? canIndex + 10 : canIndex;
    final safeChi = chiIndex < 0 ? chiIndex + 12 : chiIndex;
    return '${heavenlyStems[safeCan]} ${earthlyBranches[safeChi]}';
  }

  static String getCan(int year) {
    final canIndex = (year - 4) % 10;
    final safeCan = canIndex < 0 ? canIndex + 10 : canIndex;
    return heavenlyStems[safeCan];
  }

  static String getChi(int year) {
    final chiIndex = (year - 4) % 12;
    final safeChi = chiIndex < 0 ? chiIndex + 12 : chiIndex;
    return earthlyBranches[safeChi];
  }

  /// 60 Hoa Giáp Nạp Âm
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

  /// Lấy bản mệnh ngũ hành chính: Kim, Mộc, Thủy, Hỏa, Thổ
  static String getElement(String napAm) {
    if (napAm.contains('Kim')) return 'Kim';
    if (napAm.contains('Mộc')) return 'Mộc';
    if (napAm.contains('Thủy')) return 'Thủy';
    if (napAm.contains('Hỏa')) return 'Hỏa';
    return 'Thổ';
  }

  /// Tra Cung Phi Bát Trạch theo năm sinh và giới tính
  static String getCungPhi(int year, bool isMale) {
    int sum = 0;
    var y = year;
    while (y > 0) {
      sum += y % 10;
      y ~/= 10;
    }
    while (sum >= 10) {
      int s = 0;
      while (sum > 0) {
        s += sum % 10;
        sum ~/= 10;
      }
      sum = s;
    }

    int remainder;
    if (year < 2000) {
      if (isMale) {
        remainder = (10 - sum) % 9;
        if (remainder == 0) remainder = 9;
      } else {
        remainder = (5 + sum) % 9;
        if (remainder == 0) remainder = 9;
      }
    } else {
      if (isMale) {
        remainder = (9 - sum) % 9;
        if (remainder == 0) remainder = 9;
      } else {
        remainder = (6 + sum) % 9;
        if (remainder == 0) remainder = 9;
      }
    }

    // Nếu rơi vào số 5: Nam biến thành Khôn (2), Nữ biến thành Cấn (8)
    if (remainder == 5) {
      return isMale ? 'Khôn' : 'Cấn';
    }

    switch (remainder) {
      case 1: return 'Khảm';
      case 2: return 'Khôn';
      case 3: return 'Chấn';
      case 4: return 'Tốn';
      case 6: return 'Càn';
      case 7: return 'Đoài';
      case 8: return 'Cấn';
      case 9: return 'Ly';
      default: return 'Càn';
    }
  }

  /// Tính Bát Trạch kết hợp 2 Cung Phi
  static Map<String, dynamic> evaluateBatTrach(String cung1, String cung2) {
    final pair = '$cung1-$cung2';
    // 8 Cung x 8 Cung
    const sinhKhi = [
      'Càn-Đoài', 'Đoài-Càn', 'Khôn-Cấn', 'Cấn-Khôn',
      'Khảm-Tốn', 'Tốn-Khảm', 'Chấn-Ly', 'Ly-Chấn'
    ];
    const dienNien = [
      'Càn-Khôn', 'Khôn-Càn', 'Đoài-Cấn', 'Cấn-Đoài',
      'Khảm-Ly', 'Ly-Khảm', 'Chấn-Tốn', 'Tốn-Chấn'
    ];
    const thienY = [
      'Càn-Cấn', 'Cấn-Càn', 'Khôn-Đoài', 'Đoài-Khôn',
      'Khảm-Chấn', 'Chấn-Khảm', 'Tốn-Ly', 'Ly-Tốn'
    ];
    const phucVi = [
      'Càn-Càn', 'Đoài-Đoài', 'Khôn-Khôn', 'Cấn-Cấn',
      'Khảm-Khảm', 'Chấn-Chấn', 'Tốn-Tốn', 'Ly-Ly'
    ];
    const tuyetMenh = [
      'Càn-Ly', 'Ly-Càn', 'Đoài-Chấn', 'Chấn-Đoài',
      'Khôn-Khảm', 'Khảm-Khôn', 'Cấn-Tốn', 'Tốn-Cấn'
    ];
    const nguQuy = [
      'Càn-Chấn', 'Chấn-Càn', 'Đoài-Ly', 'Ly-Đoài',
      'Khôn-Tốn', 'Tốn-Khôn', 'Cấn-Khảm', 'Khảm-Cấn'
    ];
    const lucSat = [
      'Càn-Khảm', 'Khảm-Càn', 'Đoài-Tốn', 'Tốn-Đoài',
      'Khôn-Chấn', 'Chấn-Khôn', 'Cấn-Ly', 'Ly-Cấn'
    ];

    if (sinhKhi.contains(pair)) {
      return {'name': 'Sinh Khí', 'rating': 'Đại Cát', 'score': 25, 'desc': 'Chủ về tài lộc thăng tiến, vinh hiển bền lâu'};
    }
    if (dienNien.contains(pair)) {
      return {'name': 'Diên Niên', 'rating': 'Đại Cát', 'score': 24, 'desc': 'Chủ về tình cảm bền chặt, gia đạo êm ấm trăm năm'};
    }
    if (thienY.contains(pair)) {
      return {'name': 'Thiên Y', 'rating': 'Đại Cát', 'score': 23, 'desc': 'Chủ về quý nhân phù trợ, sức khỏe dồi dào bình an'};
    }
    if (phucVi.contains(pair)) {
      return {'name': 'Phục Vị', 'rating': 'Cát', 'score': 21, 'desc': 'Chủ về tinh thần vững chãi, cuộc sống bình yên thuận hòa'};
    }
    if (tuyetMenh.contains(pair)) {
      return {'name': 'Tuyệt Mệnh', 'rating': 'Đại Hung', 'score': 4, 'desc': 'Chủ về bất an trắc trở, cần tích đức hành thiện hóa giải'};
    }
    if (nguQuy.contains(pair)) {
      return {'name': 'Ngũ Quỷ', 'rating': 'Hung', 'score': 6, 'desc': 'Chủ về thị phi tranh chấp, hao tài tốn của'};
    }
    if (lucSat.contains(pair)) {
      return {'name': 'Lục Sát', 'rating': 'Hung', 'score': 8, 'desc': 'Chủ về gia đạo bất hòa, duyên nợ gập ghềnh'};
    }
    // Còn lại là Họa Hại
    return {'name': 'Họa Hại', 'rating': 'Thứ Hung', 'score': 10, 'desc': 'Chủ về trở ngại mưu sự, tiểu nhân quấy phá'};
  }

  /// Tính Ngũ Hành Tương Sinh Tương Khắc
  static CompatibilityAspect calculateElementAspect(String napAm1, String napAm2) {
    final e1 = getElement(napAm1);
    final e2 = getElement(napAm2);

    final isSinh = (e1 == 'Thủy' && e2 == 'Mộc') || (e1 == 'Mộc' && e2 == 'Thủy') ||
                   (e1 == 'Mộc' && e2 == 'Hỏa') || (e1 == 'Hỏa' && e2 == 'Mộc') ||
                   (e1 == 'Hỏa' && e2 == 'Thổ') || (e1 == 'Thổ' && e2 == 'Hỏa') ||
                   (e1 == 'Thổ' && e2 == 'Kim') || (e1 == 'Kim' && e2 == 'Thổ') ||
                   (e1 == 'Kim' && e2 == 'Thủy') || (e1 == 'Thủy' && e2 == 'Kim');

    final isHoa = e1 == e2;

    final isKhac = (e1 == 'Thủy' && e2 == 'Hỏa') || (e1 == 'Hỏa' && e2 == 'Thủy') ||
                   (e1 == 'Hỏa' && e2 == 'Kim') || (e1 == 'Kim' && e2 == 'Hỏa') ||
                   (e1 == 'Kim' && e2 == 'Mộc') || (e1 == 'Mộc' && e2 == 'Kim') ||
                   (e1 == 'Mộc' && e2 == 'Thổ') || (e1 == 'Thổ' && e2 == 'Mộc') ||
                   (e1 == 'Thổ' && e2 == 'Thủy') || (e1 == 'Thủy' && e2 == 'Thổ');

    if (isSinh) {
      return CompatibilityAspect(
        title: 'Ngũ Hành Nạp Âm',
        score: 25,
        rating: 'Tương Sinh (Đại Cát)',
        detail: '$napAm1 ($e1) ⟷ $napAm2 ($e2)',
        explanation: 'Hai bản mệnh tương sinh nâng đỡ, khí vượng tài lộc hanh thông, ví như rồng gặp mây bay.',
      );
    } else if (isHoa) {
      return CompatibilityAspect(
        title: 'Ngũ Hành Nạp Âm',
        score: 21,
        rating: 'Tương Hòa (Cát)',
        detail: '$napAm1 ($e1) ⟷ $napAm2 ($e2)',
        explanation: 'Đồng hành tương hỗ, chí hướng tương đồng, dễ dàng thấu hiểu và cùng nhau tạo dựng sự nghiệp.',
      );
    } else if (isKhac) {
      return CompatibilityAspect(
        title: 'Ngũ Hành Nạp Âm',
        score: 8,
        rating: 'Tương Khắc (Hung)',
        detail: '$napAm1 ($e1) ⟷ $napAm2 ($e2)',
        explanation: 'Hai khí đối xung khắc chế nhau, dễ phát sinh tranh cãi. Cần dùng ngũ hành trung gian để hóa giải.',
      );
    } else {
      return CompatibilityAspect(
        title: 'Ngũ Hành Nạp Âm',
        score: 16,
        rating: 'Bình Hòa',
        detail: '$napAm1 ($e1) ⟷ $napAm2 ($e2)',
        explanation: 'Khí vận bình ổn, không tương sinh cũng không tương khắc, phụ thuộc vào nỗ lực vun đắp.',
      );
    }
  }

  /// Tính Thiên Can Hợp Xung
  static CompatibilityAspect calculateCanAspect(String can1, String can2) {
    final pair = '$can1-$can2';
    final rev = '$can2-$can1';

    // Thiên can ngũ hợp
    const canHop = [
      'Giáp-Kỷ', 'Kỷ-Giáp', 'Ất-Canh', 'Canh-Ất',
      'Bính-Tân', 'Tân-Bính', 'Đinh-Nhâm', 'Nhâm-Đinh',
      'Mậu-Quý', 'Quý-Mậu'
    ];

    // Thiên can tương xung
    const canXung = [
      'Giáp-Canh', 'Canh-Giáp', 'Ất-Tân', 'Tân-Ất',
      'Bính-Nhâm', 'Nhâm-Bính', 'Đinh-Quý', 'Quý-Đinh',
      'Giáp-Mậu', 'Mậu-Giáp', 'Ất-Kỷ', 'Kỷ-Ất'
    ];

    if (canHop.contains(pair) || canHop.contains(rev)) {
      return CompatibilityAspect(
        title: 'Thiên Can Hợp Phối',
        score: 25,
        rating: 'Thiên Can Tương Hợp (Đại Cát)',
        detail: '$can1 ⟷ $can2 (Cát Thần)',
        explanation: 'Thiên Can chính hợp, trời ban duyên lành, tâm linh tương thông, tương trợ đắc lực.',
      );
    } else if (canXung.contains(pair) || canXung.contains(rev)) {
      return CompatibilityAspect(
        title: 'Thiên Can Hợp Phối',
        score: 7,
        rating: 'Thiên Can Tương Xung (Hung)',
        detail: '$can1 ⟷ $can2 (Trực Xung)',
        explanation: 'Tính cách có phần đối nghịch, tôi và người dễ xảy ra bất đồng ý kiến, cần học chữ Nhẫn.',
      );
    } else {
      return CompatibilityAspect(
        title: 'Thiên Can Hợp Phối',
        score: 18,
        rating: 'Bình Hòa (Cát)',
        detail: '$can1 ⟷ $can2 (Hài Hòa)',
        explanation: 'Thiên can hòa nhã, không xung không khắc, cư xử tôn trọng lẫn nhau.',
      );
    }
  }

  /// Tính Địa Chi Hợp Xung
  static CompatibilityAspect calculateChiAspect(String chi1, String chi2) {
    final pair = '$chi1-$chi2';
    final rev = '$chi2-$chi1';

    // Lục hợp
    const lucHop = [
      'Tý-Sửu', 'Sửu-Tý', 'Dần-Hợi', 'Hợi-Dần',
      'Mão-Tuất', 'Tuất-Mão', 'Thìn-Dậu', 'Dậu-Thìn',
      'Tỵ-Thân', 'Thân-Tỵ', 'Ngọ-Mùi', 'Mùi-Ngọ'
    ];

    // Tam hợp
    const tamHopGroups = [
      ['Thân', 'Tý', 'Thìn'],
      ['Dần', 'Ngọ', 'Tuất'],
      ['Tỵ', 'Dậu', 'Sửu'],
      ['Hợi', 'Mão', 'Mùi'],
    ];

    bool isTamHop = false;
    for (final group in tamHopGroups) {
      if (group.contains(chi1) && group.contains(chi2)) {
        isTamHop = true;
        break;
      }
    }

    // Tứ hành xung (Trực xung đối đỉnh)
    const trucXung = [
      'Tý-Ngọ', 'Ngọ-Tý', 'Mão-Dậu', 'Dậu-Mão',
      'Dần-Thân', 'Thân-Dần', 'Tỵ-Hợi', 'Hợi-Tỵ',
      'Thìn-Tuất', 'Tuất-Thìn', 'Sửu-Mùi', 'Mùi-Sửu'
    ];

    // Lục hại
    const lucHai = [
      'Tý-Mùi', 'Mùi-Tý', 'Sửu-Ngọ', 'Ngọ-Sửu',
      'Dần-Tỵ', 'Tỵ-Dần', 'Mão-Thìn', 'Thìn-Mão',
      'Thân-Hợi', 'Hợi-Thân', 'Dậu-Tuất', 'Tuất-Dậu'
    ];

    if (lucHop.contains(pair) || lucHop.contains(rev)) {
      return CompatibilityAspect(
        title: 'Địa Chi Tương Phối',
        score: 25,
        rating: 'Lục Hợp (Thượng Cát)',
        detail: '$chi1 ⟷ $chi2 (Âm Dương Hòa Hợp)',
        explanation: 'Địa Chi lục hợp là đại cát, gắn kết sâu sắc như bóng với hình, hậu vận sung túc.',
      );
    } else if (isTamHop) {
      return CompatibilityAspect(
        title: 'Địa Chi Tương Phối',
        score: 24,
        rating: 'Tam Hợp (Đại Cát)',
        detail: '$chi1 ⟷ $chi2 (Tam Hợp Cục)',
        explanation: 'Nằm trong cùng cục Tam Hợp, tương sinh đồng điệu, làm việc gì cũng dễ thành đại sự.',
      );
    } else if (trucXung.contains(pair) || trucXung.contains(rev)) {
      return CompatibilityAspect(
        title: 'Địa Chi Tương Phối',
        score: 5,
        rating: 'Trực Xung (Đại Hung)',
        detail: '$chi1 ⟷ $chi2 (Chính Xung)',
        explanation: 'Hai con giáp trực xung mạnh mẽ, khắc khẩu va chạm. Cần dung hòa và bao dung nhiều hơn.',
      );
    } else if (lucHai.contains(pair) || lucHai.contains(rev)) {
      return CompatibilityAspect(
        title: 'Địa Chi Tương Phối',
        score: 8,
        rating: 'Lục Hại (Hung)',
        detail: '$chi1 ⟷ $chi2 (Tương Hại)',
        explanation: 'Địa chi tương hại ngầm, dễ sinh hiểu lầm do ngoại cảnh tác động, cần minh bạch lòng dạ.',
      );
    } else {
      return CompatibilityAspect(
        title: 'Địa Chi Tương Phối',
        score: 18,
        rating: 'Bình Hòa (Hài Hòa)',
        detail: '$chi1 ⟷ $chi2 (Bình Ổn)',
        explanation: 'Địa Chi không xung không khắc, đối đãi chân tình sẽ gặt hái quả ngọt.',
      );
    }
  }

  /// Tính toán tương hợp hoàn chỉnh giữa 2 người
  static CompatibilityResult calculate({
    required CompatibilityPerson person1,
    required CompatibilityPerson person2,
    CompatibilityCategory category = CompatibilityCategory.love,
  }) {
    final canChi1 = getCanChi(person1.year);
    final canChi2 = getCanChi(person2.year);

    final can1 = getCan(person1.year);
    final can2 = getCan(person2.year);

    final chi1 = getChi(person1.year);
    final chi2 = getChi(person2.year);

    final napAm1 = napAmMap[canChi1] ?? 'Hải Trung Kim';
    final napAm2 = napAmMap[canChi2] ?? 'Hải Trung Kim';

    final cungPhi1 = getCungPhi(person1.year, person1.isMale);
    final cungPhi2 = getCungPhi(person2.year, person2.isMale);

    // 1. Ngũ Hành
    final elementAspect = calculateElementAspect(napAm1, napAm2);

    // 2. Cung Phi Bát Trạch
    final batTrachData = evaluateBatTrach(cungPhi1, cungPhi2);
    final batTrachAspect = CompatibilityAspect(
      title: 'Cung Phi Bát Trạch',
      score: batTrachData['score'] as int,
      rating: '${batTrachData['name']} (${batTrachData['rating']})',
      detail: '$cungPhi1 (${person1.isMale ? 'Nam' : 'Nữ'}) ⟷ $cungPhi2 (${person2.isMale ? 'Nam' : 'Nữ'})',
      explanation: batTrachData['desc'] as String,
    );

    // 3. Thiên Can
    final canAspect = calculateCanAspect(can1, can2);

    // 4. Địa Chi
    final chiAspect = calculateChiAspect(chi1, chi2);

    // Tổng điểm (thang 100)
    final totalScore = elementAspect.score + batTrachAspect.score + canAspect.score + chiAspect.score;

    // Đánh giá và bài thơ hoàng gia
    String verdictTitle;
    String verdictSummary;
    String imperialPoem;
    String advice;

    if (totalScore >= 85) {
      verdictTitle = 'Đại Cát Cung Đình · Kim Ngọc Lương Duyên';
      verdictSummary = 'Cặp đôi có thiên duyên tiền định hiếm có trong thiên hạ, âm dương tương phối vạn sự hanh thông.';
      imperialPoem = '“Loan phụng hòa minh cảnh thái bình,\nCung vàng điện ngọc kết duyên lành.\nTrăm năm sắt son cùng tri kỷ,\nPhú quý vinh hoa rạng sử xanh.”';
      advice = 'Duyên số trời ban vô cùng quý giá, hãy trân trọng và cùng nhau tạo dựng đại nghiệp vững bền.';
    } else if (totalScore >= 70) {
      verdictTitle = 'Cát Tường Tương Hợp · Thiên Tứ Kỳ Duyên';
      verdictSummary = 'Các yếu tố bổ trợ hài hòa, tài lộc vượng tướng, càng gắn bó càng sinh nhiều điềm lành.';
      imperialPoem = '“Trăng sáng cung thềm hoa ngát hương,\nĐôi lứa tương phùng bước chung đường.\nThuận vợ thuận chồng tát biển cạn,\nCơ đồ gầy dựng rạng ngàn phương.”';
      advice = 'Tương hợp rất tốt, chỉ cần duy trì sự chân thành và chia sẻ cởi mở thì mọi sự đều xuôi chèo mát mái.';
    } else if (totalScore >= 55) {
      verdictTitle = 'Thứ Cát Bình Hòa · Cần Tâm Ý Bồi Đắp';
      verdictSummary = 'Khí vận trung bình, có điểm hợp và cũng có điểm xung khắc nhẹ, phụ thuộc vào tâm tính đôi bên.';
      imperialPoem = '“Mây trôi nước chảy dẫu đôi miền,\nGặp gỡ âu cũng bởi chữ Duyên.\nNhường nhịn bao dung qua bão tố,\nBến đỗ bình yên trọn ước nguyền.”';
      advice = 'Nên học cách lắng nghe và bao dung, tránh tranh cãi những chuyện nhỏ nhặt để giữ hòa khí gia đạo.';
    } else {
      verdictTitle = 'Khí Vận Trắc Trở · Cần Hóa Giải Phong Thủy';
      verdictSummary = 'Tồn tại xung khắc về ngũ hành hoặc cung phi bát trạch, dễ xảy ra va chạm nếu không biết kiềm chế.';
      imperialPoem = '“Sông sâu sóng cả dẫu gian nan,\nChớ để tơ duyên phải lỡ làng.\nTu tâm dưỡng tính tiêu tai ách,\nĐức năng thắng số chuyển bình an.”';
      advice = 'Đức năng thắng số. Nên dùng màu sắc phong thủy tương sinh, làm việc thiện tích phúc và chọn ngày lành tháng tốt.';
    }

    return CompatibilityResult(
      person1: person1,
      person2: person2,
      category: category,
      totalScore: totalScore,
      verdictTitle: verdictTitle,
      verdictSummary: verdictSummary,
      elementAspect: elementAspect,
      batTrachAspect: batTrachAspect,
      canAspect: canAspect,
      chiAspect: chiAspect,
      imperialPoem: imperialPoem,
      advice: advice,
    );
  }
}
