class FengShuiNumberResult {
  final String rawNumber;
  final int luckyIndex; // 1 -> 80
  final String rating; // Đại Cát, Cát, Bình Hòa, Hung, Đại Hung
  final String element; // Kim, Mộc, Thủy, Hỏa, Thổ
  final String meaning;
  final String advice;

  const FengShuiNumberResult({
    required this.rawNumber,
    required this.luckyIndex,
    required this.rating,
    required this.element,
    required this.meaning,
    required this.advice,
  });
}

class FengShuiNumberCalculator {
  static const Map<int, ({String rating, String meaning, String advice})> _meanings = {
    1: (rating: 'Đại Cát', meaning: 'Đại triển hoành đồ, tài nguyên phong phú', advice: 'Sự nghiệp hanh thông, công danh rực rỡ'),
    2: (rating: 'Bình Hòa', meaning: 'Nhất thịnh nhất suy, chìm nổi bất định', advice: 'Cần kiên định, chớ manh động'),
    3: (rating: 'Đại Cát', meaning: 'Vạn bảo quy triều, tài phúc viên mãn', advice: 'Càng nỗ lực càng gặt hái lớn'),
    4: (rating: 'Hung', meaning: 'Tiền đồ trắc trở, gian nan vất vả', advice: 'Lấy đức tích phúc, thận trọng làm ăn'),
    5: (rating: 'Đại Cát', meaning: 'Phúc lộc trường thọ, đại nghiệp hưng long', advice: 'Được quý nhân nâng đỡ, gia đạo an khang'),
    6: (rating: 'Cát', meaning: 'Trời ban phúc lộc, quý nhân phò trợ', advice: 'Mở rộng giao lưu, kết giao bằng hữu'),
    7: (rating: 'Cát', meaning: 'Độc lập kinh doanh, tất đạt công thành', advice: 'Tự lực tự cường, quyết đoán là thắng'),
    8: (rating: 'Đại Cát', meaning: 'Ý chí kiên định, tương lai xán lạn', advice: 'Vượt qua thử thách sẽ chạm đỉnh cao'),
    9: (rating: 'Hung', meaning: 'Phú quý khó giữ, tận tụy công cốc', advice: 'Cần tỉnh táo quản lý tài chính'),
    10: (rating: 'Hung', meaning: 'Tử khí tiềm ẩn, vạn sự tiêu ma', advice: 'Tĩnh tâm tu dưỡng, tránh liều lĩnh'),
    11: (rating: 'Đại Cát', meaning: 'Cỏ cây gặp xuân, tươi tốt phát triển', advice: 'Khởi nghiệp hanh thông, tài lộc sinh sôi'),
    12: (rating: 'Hung', meaning: 'Bạc nhược vô lực, dễ gặp suy thoái', advice: 'Tìm kiếm đồng đội, không nên đi một mình'),
    13: (rating: 'Đại Cát', meaning: 'Thiên tài tài hoa, trí tuệ xuất chúng', advice: 'Phát huy chuyên môn nghệ thuật/khoa học'),
    14: (rating: 'Bình Hòa', meaning: 'Từng bước thăng trầm, duyên phận mỏng manh', advice: 'Chăm lo sức khỏe và tình cảm gia đình'),
    15: (rating: 'Đại Cát', meaning: 'Đức vọng cao dày, trường thọ phú quý', advice: 'Vượng khí viên mãn, làm việc gì cũng thành'),
    16: (rating: 'Đại Cát', meaning: 'Đại quý hiển vinh, muôn người kính phục', advice: 'Dẫn dắt tổ chức, mở rộng uy tín'),
    17: (rating: 'Cát', meaning: 'Cương nghị quả cảm, biến hung thành cát', advice: 'Giữ lòng kiên trinh, không ngại khó khăn'),
    18: (rating: 'Cát', meaning: 'Có chí thì nên, sự nghiệp vang dội', advice: 'Cần nhẫn nại đợi đúng thời cơ'),
    19: (rating: 'Hung', meaning: 'Gió bão dập dồn, tài lộc trôi nổi', advice: 'Thận trọng giấy tờ, tránh tranh chấp'),
    20: (rating: 'Đại Hung', meaning: 'Trí dũng bất tương thông, lo âu trùng trùng', advice: 'Tránh xa đầu cơ may rủi'),
    21: (rating: 'Đại Cát', meaning: 'Minh nguyệt quang chiếu, thế như chẻ tre', advice: 'Lãnh đạo tài ba, tiền đồ vô lượng'),
    23: (rating: 'Đại Cát', meaning: 'Húc nhật đông thăng, danh dương tứ hải', advice: 'Thời cơ hoàng kim để bứt phá'),
    24: (rating: 'Đại Cát', meaning: 'Gia môn dư khánh, tiền của dồi dào', advice: 'Hậu vận sung túc, con cháu thành đạt'),
    25: (rating: 'Cát', meaning: 'Thiên thời địa lợi, vững vàng tiến bước', advice: 'Giữ chữ tín làm đầu'),
    28: (rating: 'Hung', meaning: 'Tài hoa bạc mệnh, gian nan vây hãm', advice: 'Học cách buông bỏ, tích lũy công đức'),
    29: (rating: 'Cát', meaning: 'Như rồng gặp nước, tài lộc dâng tràn', advice: 'Nắm bắt cơ hội khi thiên thời đến'),
    31: (rating: 'Đại Cát', meaning: 'Hòa khí sinh tài, đại cát đại lợi', advice: 'Cả đời an vui, ít gặp sóng gió'),
    32: (rating: 'Cát', meaning: 'Cành vàng lá ngọc, phúc lộc tự sinh', advice: 'Thích hợp cho cả nam và nữ kinh doanh'),
    33: (rating: 'Đại Cát', meaning: 'Gia thế hưng vượng, danh lợi tề toàn', advice: 'Cực vượng cho con đường quyền lực'),
    35: (rating: 'Cát', meaning: 'Bảo kính bình an, văn nghệ phát đạt', advice: 'Thích hợp nghiên cứu, nghệ thuật, kinh doanh'),
    37: (rating: 'Đại Cát', meaning: 'Cát nhân thiên tướng, tài lộc viên dung', advice: 'Quý nhân phù trợ từng bước đi'),
    39: (rating: 'Đại Cát', meaning: 'Phúc lộc thọ khảo, chấn hưng đại nghiệp', advice: 'Số vương giả, uy danh vang dội'),
    41: (rating: 'Đại Cát', meaning: 'Đức vọng tối cao, ngàn thu vững chãi', advice: 'Trí dũng song toàn, tiền bạc rủng rỉnh'),
    45: (rating: 'Đại Cát', meaning: 'Tân phong như ý, vạn sự thuận buồm', advice: 'Kinh doanh phát tài, đại sự tất thành'),
    47: (rating: 'Đại Cát', meaning: 'Hoa nở rộ ngát, hưng gia lập nghiệp', advice: 'Vạn sự hanh thông, đón lộc tứ phương'),
    48: (rating: 'Đại Cát', meaning: 'Thanh nhã xuất trần, danh vang bốn bể', advice: 'Thành công bằng chính tài năng'),
    52: (rating: 'Cát', meaning: 'Dự liệu như thần, đại sự tất thành', advice: 'Có mắt nhìn xa trông rộng'),
    63: (rating: 'Đại Cát', meaning: 'Thần linh phù trợ, phúc tự ngút trời', advice: 'Mọi ước nguyện đều dễ đạt được'),
    65: (rating: 'Đại Cát', meaning: 'Cự phú nhất phương, phúc trạch diên niên', advice: 'Tài chính cực thịnh, của cải vững bền'),
    67: (rating: 'Đại Cát', meaning: 'Vạn hoa hướng dương, hanh thông tấn tới', advice: 'Gặp gỡ tri kỷ, cộng sự ăn ý'),
    68: (rating: 'Đại Cát', meaning: 'Hưng gia thịnh vượng, trí dũng siêu phàm', advice: 'Tài chính vững chãi như bàn thạch'),
    73: (rating: 'Cát', meaning: 'Tự nhiên thành tựu, phúc ấm tổ tiên', advice: 'Biết đủ là vui, tài lộc tự đến'),
    80: (rating: 'Cát', meaning: 'Tu dưỡng chân thành, hậu phúc vô cùng', advice: 'Càng về già càng hưởng vinh hoa'),
  };

  static String _determineElement(int lastDigit) {
    switch (lastDigit) {
      case 1:
      case 6:
        return 'Thủy (Linh hoạt, sâu sắc)';
      case 2:
      case 7:
        return 'Hỏa (Nhiệt huyết, danh vọng)';
      case 3:
      case 8:
        return 'Mộc (Sinh sôi, phát triển)';
      case 4:
      case 9:
        return 'Kim (Cương quyết, sắc bén)';
      default:
        return 'Thổ (Vững chãi, bao dung)';
    }
  }

  static FengShuiNumberResult calculate(String input) {
    final digits = input.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.isEmpty) {
      return const FengShuiNumberResult(
        rawNumber: '',
        luckyIndex: 1,
        rating: 'Bình Hòa',
        element: 'Thổ (Vững chãi)',
        meaning: 'Chưa có thông tin số',
        advice: 'Vui lòng nhập số điện thoại hoặc biển số xe',
      );
    }

    // Lấy tối đa 4 số cuối
    final lastFourStr = digits.length >= 4 ? digits.substring(digits.length - 4) : digits;
    final int number = int.tryParse(lastFourStr) ?? 0;

    // Thuật toán 80 quẻ phong thủy: number / 80 -> trừ phần nguyên -> nhân 80
    final double div = number / 80.0;
    final int intPart = div.floor();
    final double remainder = div - intPart;
    int index = (remainder * 80).round();
    if (index == 0) index = 80;

    final lastDigit = number % 10;
    final element = _determineElement(lastDigit);

    final info = _meanings[index] ?? (
      rating: index % 2 == 0 ? 'Cát' : 'Bình Hòa',
      meaning: 'Vạn vật tuần hoàn, hung cát đan xen theo vận khí',
      advice: 'Tích đức hành thiện để tăng cường năng lượng tích cực',
    );

    return FengShuiNumberResult(
      rawNumber: digits,
      luckyIndex: index,
      rating: info.rating,
      element: element,
      meaning: info.meaning,
      advice: info.advice,
    );
  }
}
