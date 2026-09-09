import 'package:dio/dio.dart';
import '../models/bazi_models.dart';

class BaziRepository {
  final Dio? dio;

  BaziRepository({this.dio});

  Future<BaziChartData> getBaziChart({
    String? name,
    String? gender,
    DateTime? birthDate,
    int? birthHour,
  }) async {
    // Giả lập network delay nhẹ nếu gọi local
    await Future.delayed(const Duration(milliseconds: 300));

    // Dữ liệu chuẩn Hoàng Gia Khâm Thiên Giám (Stitch Screen 041e4565)
    return const BaziChartData(
      clientName: 'Hoàng Nam',
      solarDate: '15/08/1993 (Dương Lịch)',
      lunarDate: '28/06 Quý Dậu (Âm Lịch)',
      gender: 'Nam Mạng',
      dayMasterElement: 'Tân Kim (Âm Kim)',
      pillars: [
        BaziPillarData(
          name: 'Trụ Năm',
          stem: 'Quý',
          branch: 'Dậu',
          stemElement: 'Thủy',
          branchElement: 'Kim',
          tenGod: 'Thực Thần',
          hiddenStems: ['Tân'],
          lifeStage: 'Lâm Quan',
          isDayMaster: false,
        ),
        BaziPillarData(
          name: 'Trụ Tháng',
          stem: 'Canh',
          branch: 'Thân',
          stemElement: 'Kim',
          branchElement: 'Kim',
          tenGod: 'Kiếp Tài',
          hiddenStems: ['Canh', 'Nhâm', 'Mậu'],
          lifeStage: 'Đế Vượng',
          isDayMaster: false,
        ),
        BaziPillarData(
          name: 'Trụ Ngày',
          stem: 'Tân',
          branch: 'Hợi',
          stemElement: 'Kim',
          branchElement: 'Thủy',
          tenGod: 'Nhật Chủ',
          hiddenStems: ['Nhâm', 'Giáp'],
          lifeStage: 'Mộc Dục',
          isDayMaster: true,
        ),
        BaziPillarData(
          name: 'Trụ Giờ',
          stem: 'Bính',
          branch: 'Thân',
          stemElement: 'Hỏa',
          branchElement: 'Kim',
          tenGod: 'Chính Quan',
          hiddenStems: ['Canh', 'Nhâm', 'Mậu'],
          lifeStage: 'Đế Vượng',
          isDayMaster: false,
        ),
      ],
      elementRatios: [
        ElementRatio(element: 'Kim', percentage: 38, status: 'Cực Vượng'),
        ElementRatio(element: 'Thủy', percentage: 28, status: 'Vượng'),
        ElementRatio(element: 'Thổ', percentage: 14, status: 'Bình Hòa'),
        ElementRatio(element: 'Hỏa', percentage: 12, status: 'Hưu Tù'),
        ElementRatio(element: 'Mộc', percentage: 8, status: 'Bất Cập'),
      ],
      yongShen: DeityDefinition(
        type: 'Chân Dụng Thần',
        element: 'Thổ (Chính Ấn)',
        description:
            'Thổ sinh Kim điều hòa vượng khí, bồi dưỡng căn cơ, mang lại phúc lộc bền vững và quý nhân phò trợ.',
      ),
      xiShen: DeityDefinition(
        type: 'Hỷ Thần',
        element: 'Thủy (Thực Thương)',
        description:
            'Thủy tiết tú Kim vượng, khơi thông tài trí mẫn tiệp, xuất chúng trên con đường hoạn lộ và sáng tạo.',
      ),
      jiShen: DeityDefinition(
        type: 'Kỵ Thần',
        element: 'Hỏa (Quan Sát)',
        description:
            'Hỏa khắc Kim quá vội khi Kim chưa thành khí, dễ phát sinh tranh chấp pháp lý hoặc hao tổn tâm lực.',
      ),
      forecast2026: [
        ForecastPillar(
          title: 'Sự Nghiệp & Công Danh',
          score: 88,
          verdict: 'Đại Cát',
          advice:
              'Bính Hỏa hợp Tân Kim (Nhật Chủ) hóa Thủy tương sinh. Sự nghiệp có bước ngoặt vĩ đại, được cấp trên trao trọng trách hoặc mở rộng cơ đồ kinh doanh vượt bậc.',
        ),
        ForecastPillar(
          title: 'Tài Chính & Tiền Tài',
          score: 82,
          verdict: 'Vượng Phát',
          advice:
              'Thực Thần sinh Tài, dòng tiền luân chuyển dồi dào từ các dự án đối tác chiến lược. Nên tích trữ tài sản hiện vật (bất động sản, kim hoàn) thay vì lướt sóng mạo hiểm.',
        ),
        ForecastPillar(
          title: 'Tình Cảm & Gia Đạo',
          score: 75,
          verdict: 'Hòa Hợp',
          advice:
              'Hỏa vượng sinh thổ tương trợ cung phu thê. Gia đạo êm ấm, có tin vui về thêm người thêm của hoặc kết duyên lành vững bền.',
        ),
        ForecastPillar(
          title: 'Sức Khỏe & Tinh Thần',
          score: 70,
          verdict: 'Thận Trọng',
          advice:
              'Hỏa khắc chế Kim và Thủy bị hao tiết trong tiết hạ. Cần chú ý thanh nhiệt dưỡng phế, điều hòa giấc ngủ và tránh làm việc quá sức về đêm.',
        ),
      ],
      annualAnalysis:
          'Năm 2026 Bính Ngọ (Thiên Hà Thủy) mang năng lượng Hỏa cực vượng tại Địa Chi. Tuy nhiên, thiên can Bính Hỏa tương hợp với Nhật Chủ Tân Kim hóa Thủy, tạo thế hóa sát vi quyền. Thân chủ được chiếu mệnh bởi cát tinh Thiên Đức và Quốc Ấn, mưu sự đại thành nếu biết dĩ nhu thắng cương.',
      aiExplanation: null,
    );
  }

  Future<String> requestAiExplanation({
    required BaziChartData chart,
    String? focusArea,
  }) async {
    // Giả lập cuộc gọi API AI Khâm Thiên Giám Ngự Phê
    await Future.delayed(const Duration(milliseconds: 1200));

    return '''
### 👑 KHÂM THIÊN GIÁM NGỰ PHÊ · ĐẠI VẬN & LƯU NIÊN 2026

**1. Cách Cục Cốt Lõi: Tân Kim Tọa Hợi Thấu Bính Hỏa**
Thân chủ sinh tháng Thân, Kim khí nắm lệnh vô cùng kiên cố, bản mệnh thuộc hàng Thân Cường Đắc Lệnh. Nhật Chủ Tân Kim như ngọc quý trong lòng đất, cần Thủy rửa bụi trần (Hợi Thủy) và Hỏa luyện thành khí (Bính Hỏa). Trụ Giờ thấu Bính Hỏa tọa Thân, tạo nên cách cục "Quan Ấn Tương Sinh", người mang cốt cách thanh cao, có tài thao lược và được muôn người kính trọng.

**2. Phân Tích Lưu Niên Bính Ngọ 2026**
- *Thiên Can*: Bính Hỏa lưu niên gặp Tân Kim bản mệnh tạo thành **Bính Tân Tương Hợp**. Đây là điềm lành tối thượng về danh vị, công danh thăng tiến rực rỡ, thi cử đỗ đạt hoặc nắm giữ cương vị đầu tàu.
- *Địa Chi*: Ngọ Hỏa xung Thân Kim tại trụ tháng và trụ giờ, báo hiệu sự dịch chuyển lớn về môi trường làm việc, nhà cửa hoặc mở rộng chi nhánh quy mô lớn.

**3. Khâm Thiên Bí Chỉ Khai Vận**
- *Màu sắc trợ vận*: Hoàng kim, trắng ánh bạc (Kim) và nâu đất, vàng hoàng thổ (Thổ).
- *Phương vị xuất hành*: Hướng Tây Bắc (Tài Thần) và hướng Đông Nam (Hỷ Thần).
- *Thời điểm đại cát*: Tháng 7 (Bính Thân), Tháng 8 (Đinh Dậu) và Tháng 11 (Canh Tý).
''';
  }
}
