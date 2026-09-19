/// Model đại diện cho khí vận nhật khóa từ Khâm Thiên Giám Ngự Báo
class DailyHoroscope {
  final DateTime date;
  final String canChiDay;
  final String napAm;
  final String element;
  final TrucNhat truc;
  final NhiThapBatTu sao;
  final List<String> hoangDaoHours;
  final String huongTaiThan;
  final String huongHyThan;
  final String huongHacThan;
  final List<String> auspiciousActivities;
  final List<String> tabooActivities;
  final String royalDecree;

  const DailyHoroscope({
    required this.date,
    required this.canChiDay,
    required this.napAm,
    required this.element,
    required this.truc,
    required this.sao,
    required this.hoangDaoHours,
    required this.huongTaiThan,
    required this.huongHyThan,
    required this.huongHacThan,
    required this.auspiciousActivities,
    required this.tabooActivities,
    required this.royalDecree,
  });
}

/// 12 Trực Nhật (Thập Nhị Kiến Trừ)
class TrucNhat {
  final String name;
  final bool isGood;
  final String description;

  const TrucNhat({
    required this.name,
    required this.isGood,
    required this.description,
  });

  static const TrucNhat kien = TrucNhat(name: 'Kiến', isGood: false, description: 'Khởi đầu muôn sự, kỵ động thổ');
  static const TrucNhat tru = TrucNhat(name: 'Trừ', isGood: true, description: 'Tẩy uế trừ tà, trị bệnh trừ phục');
  static const TrucNhat man = TrucNhat(name: 'Mãn', isGood: true, description: 'Viên mãn sung túc, cầu tài tế tự');
  static const TrucNhat binh = TrucNhat(name: 'Bình', isGood: false, description: 'Bình ổn hòa hoãn, kỵ mạo hiểm');
  static const TrucNhat dinh = TrucNhat(name: 'Định', isGood: true, description: 'Định ước ký kết, khai trương xuất hành');
  static const TrucNhat chap = TrucNhat(name: 'Chấp', isGood: false, description: 'Cố thủ kỷ cương, kỵ di dời chuyển nhượng');
  static const TrucNhat pha = TrucNhat(name: 'Phá', isGood: false, description: 'Đại hung phá toái, chỉ nên dỡ bỏ dọn dẹp');
  static const TrucNhat nguy = TrucNhat(name: 'Nguy', isGood: true, description: 'Cẩn trọng vượt khó, an định gia trạch');
  static const TrucNhat thanh = TrucNhat(name: 'Thành', isGood: true, description: 'Đại cát đại lợi, muôn sự hanh thông thành tựu');
  static const TrucNhat thau = TrucNhat(name: 'Thâu', isGood: true, description: 'Thu hoạch gom tài, nạp tài tích phúc');
  static const TrucNhat khai = TrucNhat(name: 'Khai', isGood: true, description: 'Khai mở vận hội, khai trương nghênh phúc');
  static const TrucNhat be = TrucNhat(name: 'Bế', isGood: false, description: 'Đóng kín bế tắc, chỉ nên an táng đắp đập');
}

/// Nhị Thập Bát Tú (28 Sao Cát Hung)
class NhiThapBatTu {
  final String name;
  final String animal;
  final bool isGood;
  final String meaning;

  const NhiThapBatTu({
    required this.name,
    required this.animal,
    required this.isGood,
    required this.meaning,
  });

  static const List<NhiThapBatTu> all = [
    NhiThapBatTu(name: 'Giác', animal: 'Mộc Giao', isGood: true, meaning: 'Đại cát khởi công, thi cử đỗ đạt'),
    NhiThapBatTu(name: 'Cang', animal: 'Kim Long', isGood: false, meaning: 'Bất lợi hôn nhân, kiện tụng tranh chấp'),
    NhiThapBatTu(name: 'Đê', animal: 'Thổ Lạc', isGood: false, meaning: 'Kỵ khởi sự lớn, phòng hao tài tốn của'),
    NhiThapBatTu(name: 'Phòng', animal: 'Nhật Thố', isGood: true, meaning: 'Cát tinh chiếu rọi, gia đạo an vui, vinh hoa'),
    NhiThapBatTu(name: 'Tâm', animal: 'Nguyệt Hồ', isGood: false, meaning: 'Hung tinh tranh đấu, thị phi khẩu thiệt'),
    NhiThapBatTu(name: 'Vĩ', animal: 'Hỏa Hổ', isGood: true, meaning: 'Đại cát xuất hành, tạo dựng cơ nghiệp'),
    NhiThapBatTu(name: 'Cơ', animal: 'Thủy Báo', isGood: true, meaning: 'Hỷ khí đầy nhà, hợp tác đắc lợi'),
    NhiThapBatTu(name: 'Đẩu', animal: 'Mộc Giải', isGood: true, meaning: 'Phúc lộc thọ toàn, vạn sự thuận buồm'),
    NhiThapBatTu(name: 'Ngưu', animal: 'Kim Ngưu', isGood: false, meaning: 'Tránh việc hôn giá, đề phòng rủi ro'),
    NhiThapBatTu(name: 'Nữ', animal: 'Thổ Bức', isGood: false, meaning: 'Bất lợi nữ giới, kỵ tranh cãi'),
    NhiThapBatTu(name: 'Hư', animal: 'Nhật Thử', isGood: false, meaning: 'Hư hao hao tổn, nên tu dưỡng tĩnh tâm'),
    NhiThapBatTu(name: 'Nguy', animal: 'Nguyệt Yến', isGood: false, meaning: 'Cẩn trọng đi xa, phòng trượt ngã'),
    NhiThapBatTu(name: 'Thất', animal: 'Hỏa Trư', isGood: true, meaning: 'Khai sơn phá thạch, kinh doanh phát đạt'),
    NhiThapBatTu(name: 'Bích', animal: 'Thủy Dư', isGood: true, meaning: 'Học hành hanh thông, an cư lạc nghiệp'),
    NhiThapBatTu(name: 'Khuê', animal: 'Mộc Lang', isGood: false, meaning: 'Kỵ khai trương, xuất hành trắc trở'),
    NhiThapBatTu(name: 'Lâu', animal: 'Kim Cẩu', isGood: true, meaning: 'Thu hoạch phát tài, tăng phúc tăng thọ'),
    NhiThapBatTu(name: 'Vị', animal: 'Thổ Trĩ', isGood: true, meaning: 'Khai trương cầu tài, may mắn song toàn'),
    NhiThapBatTu(name: 'Mão', animal: 'Nhật Kê', isGood: false, meaning: 'Bất hòa xích mích, kiêng cữ cưới hỏi'),
    NhiThapBatTu(name: 'Tất', animal: 'Nguyệt Ô', isGood: true, meaning: 'Thi cử đỗ cao, công danh rực rỡ'),
    NhiThapBatTu(name: 'Chủy', animal: 'Hỏa Hầu', isGood: false, meaning: 'Thị phi điều tiếng, kỵ kiện cáo'),
    NhiThapBatTu(name: 'Sâm', animal: 'Thủy Viên', isGood: true, meaning: 'Quý nhân phù trợ, kinh doanh đại lợi'),
    NhiThapBatTu(name: 'Tỉnh', animal: 'Mộc Hãn', isGood: true, meaning: 'Tạo phúc điền trạch, cầu an gia đạo'),
    NhiThapBatTu(name: 'Quỷ', animal: 'Kim Dương', isGood: false, meaning: 'Kỵ khởi công xây dựng, đề phòng tai ương'),
    NhiThapBatTu(name: 'Liễu', animal: 'Thổ Chương', isGood: false, meaning: 'Tránh đi thuyền bè, giữ gìn sức khỏe'),
    NhiThapBatTu(name: 'Tinh', animal: 'Nhật Mã', isGood: false, meaning: 'Kỵ kết hôn, đề phòng thất thoát'),
    NhiThapBatTu(name: 'Trương', animal: 'Nguyệt Lộc', isGood: true, meaning: 'Hỷ sự lâm môn, thăng quan tiến chức'),
    NhiThapBatTu(name: 'Dực', animal: 'Hỏa Xà', isGood: false, meaning: 'Kỵ đi xa, giữ tâm hòa khí'),
    NhiThapBatTu(name: 'Chẩn', animal: 'Thủy Dẫn', isGood: true, meaning: 'Cát tinh toàn thiện, phong lưu phú quý'),
  ];
}
