import '../models/dossier_models.dart';

class DossierRepository {
  Future<RoyalDossierData> getRoyalDossier({String? chartId}) async {
    await Future.delayed(const Duration(milliseconds: 250));

    final pages = <DossierPageData>[
      // Trang 1: Bìa Hoàng Gia
      const DossierPageData(
        pageNumber: 1,
        title: 'HỒ SƠ MỆNH LÝ HOÀNG GIA',
        category: 'NGỰ THƯ',
        subTitle: 'Khâm Thiên Giám Ngự Chế · Đại Việt Cổ Pháp',
        dropCapLetter: 'H',
        isCover: true,
        content:
            'Tập hồ sơ khảo sát toàn diện tử vi đẩu số, bát tự và trạch mệnh của thân chủ Hoàng Nam. Toàn bộ sao cát hung, tứ hóa, thế trận đại vận và cẩm nang hành sự đã được Khâm Thiên Giám phụng mệnh nghiên cứu và ngự bút phê chuẩn.',
        keyAttributes: {
          'Đương Số': 'Hoàng Nam',
          'Bản Mệnh': 'Kiếm Phong Kim',
          'Cục Số': 'Kim Tứ Cục',
          'Niên Đại': 'Bính Ngọ 2026',
        },
      ),

      // Trang 2: Toàn Cảnh Tinh Bàn 12 Cung
      const DossierPageData(
        pageNumber: 2,
        title: 'TOÀN CẢNH TINH BÀN 12 CUNG',
        category: 'TỔNG QUAN',
        subTitle: 'Thiên Tâm Hoàng Triều · 108 Tinh Diệu Chiếu Mệnh',
        dropCapLetter: 'T',
        content:
            'Tinh bàn an vị tại 12 cung địa chi, lấy Mệnh tại Tý làm trục then chốt. Cung Thân đồng tọa Mệnh báo hiệu mẫu người tự lực cánh sinh, lập thân kiến quốc từ bàn tay trắng. Các trục Tam Hợp Mệnh - Tài - Quan thụ hưởng cát khí trọn vẹn từ Tử Phủ Triều Viên.',
        keyAttributes: {
          'Mệnh Cư': 'Tý (Dương Thủy)',
          'Thân Cư': 'Đồng Cung Mệnh',
          'Cát Tinh Hội': 'Tả Phụ, Hữu Bật, Văn Xương, Văn Khúc, Thiên Khôi',
          'Điểm Tinh Bàn': '96 / 100',
        },
      ),

      // Trang 3: Khảo Cứu Bản Mệnh & Cục
      const DossierPageData(
        pageNumber: 3,
        title: 'BẢN MỆNH VÀ CỤC SỐ',
        category: 'CĂN CƠ',
        subTitle: 'Âm Dương Thuận Lý · Mệnh Cục Tương Hòa',
        dropCapLetter: 'Â',
        content:
            'Âm Nam sinh giờ Thân, Âm Dương thuận lý giúp cuộc đời gặp nghịch cảnh vẫn dễ dàng hóa giải. Kim Tứ Cục tương hòa với Bản Mệnh Kiếm Phong Kim, tạo nên cốt cách cương trực, quyết đoán, nói đi đôi với làm, có duyên với các chức vụ lãnh đạo quản lý.',
        keyAttributes: {
          'Thế Đứng': 'Thuận Lý Âm Dương',
          'Tương Tác': 'Mệnh Cục Tương Sinh',
          'Khí Chất': 'Cương mãnh dũng khí',
        },
      ),

      // Trang 4 - 15: Chi tiết 12 cung vị
      const DossierPageData(
        pageNumber: 4,
        title: 'CUNG MỆNH & THÂN TỰ BẢN',
        category: '12 CUNG ĐỊA BÀN',
        subTitle: 'Cung Tý · Tử Vi (Miếu) & Thiên Phủ (Vượng)',
        dropCapLetter: 'M',
        content:
            'Cung Mệnh đóng tại Tý ngộ cặp Đế Tinh Tử Vi và Thiên Phủ, đắc thế Tử Phủ Triều Viên - cách cục bậc vương giả danh giá nhất trời Nam. Thân chủ có phong thái uy nghi, lời nói có sức nặng, mưu lược sâu rộng, hậu vận đạt đến đỉnh cao danh vọng và tài phú vinh hoa.',
        keyAttributes: {
          'Chính Tinh': 'Tử Vi (M), Thiên Phủ (V)',
          'Tứ Hóa': 'Hóa Khoa chiếu mệnh',
          'Đánh Giá': 'Đại Cát Thượng Cách (98/100)',
        },
      ),
      const DossierPageData(
        pageNumber: 5,
        title: 'CUNG PHỤ MẪU',
        category: '12 CUNG ĐỊA BÀN',
        subTitle: 'Cung Sửu · Thái Âm (Đắc)',
        dropCapLetter: 'P',
        content:
            'Thái Âm đắc địa ngộ Nguyệt Đức tại Sửu. Cha mẹ có nền tảng gia giáo uy nghiêm, phúc đức dày dặn. Thân chủ nhận được sự dạy bảo chuẩn mực từ song thân, sớm được kế thừa gia phong tốt lành và sự bảo trợ vững chắc về tinh thần.',
      ),
      const DossierPageData(
        pageNumber: 6,
        title: 'CUNG PHÚC ĐỨC',
        category: '12 CUNG ĐỊA BÀN',
        subTitle: 'Cung Dần · Vũ Khúc (Miếu) & Thiên Tướng (Vượng)',
        dropCapLetter: 'P',
        content:
            'Cung Phúc Đức đắc song tinh Vũ Khúc Thiên Tướng. Dòng họ nhiều đời có người đỗ đạt cao, lập công danh hiển hách. Mồ mả tổ tiên phát tích hướng Đông Bắc, con cháu đời đời phát tài và trường thọ viên mãn.',
      ),
      const DossierPageData(
        pageNumber: 7,
        title: 'CUNG ĐIỀN TRẠCH',
        category: '12 CUNG ĐỊA BÀN',
        subTitle: 'Cung Mão · Thái Dương (Vượng)',
        dropCapLetter: 'Đ',
        content:
            'Thái Dương tại Mão rực sáng như vầng thái dương buổi sớm. Điền sản gia tăng vượt bậc qua từng đại vận, tự tay tạo lập nhiều bất động sản vị trí đắc địa, nhà cửa khang trang lộng lẫy, gia cư tụ khí sinh tài.',
      ),
      const DossierPageData(
        pageNumber: 8,
        title: 'CUNG QUAN LỘC',
        category: '12 CUNG ĐỊA BÀN',
        subTitle: 'Cung Thìn · Liêm Trinh (Đắc) & Thiên Phủ chiếu',
        dropCapLetter: 'Q',
        content:
            'Cung Quan Lộc gặp Liêm Trinh đắc cách, lại có Tam Thai Bát Tọa phò tá. Con đường công danh thăng tiến thần tốc, nắm giữ chức quyền quan trọng trong các tổ chức lớn, có tài tổ chức và quản trị nhân sự xuất chúng.',
      ),
      const DossierPageData(
        pageNumber: 9,
        title: 'CUNG NÔ BỘC',
        category: '12 CUNG ĐỊA BÀN',
        subTitle: 'Cung Tỵ · Cự Môn (Đắc)',
        dropCapLetter: 'N',
        content:
            'Cự Môn tại Tỵ gặp Hóa Quyền tam hợp. Thân chủ có bạn bè, đối tác tài năng, cấp dưới trung thành tận tụy. Tuy nhiên cần lưu ý lời ăn tiếng nói nơi hội thảo đông người để tránh thị phi đố kỵ từ kẻ tiểu nhân ganh ghét.',
      ),
      const DossierPageData(
        pageNumber: 10,
        title: 'CUNG THIÊN DI',
        category: '12 CUNG ĐỊA BÀN',
        subTitle: 'Cung Ngọ · Thất Sát (Miếu)',
        dropCapLetter: 'T',
        content:
            'Thất Sát triều đẩu tại Ngọ. Bước chân ra ngoài uy nghi lẫm liệt, đi xa làm ăn càng đại phát, thường xuyên gặp gỡ quý nhân ở phương xa, kết giao với các bậc quyền quý và chính khách có tầm ảnh hưởng.',
      ),
      const DossierPageData(
        pageNumber: 11,
        title: 'CUNG TẬT ÁCH',
        category: '12 CUNG ĐỊA BÀN',
        subTitle: 'Cung Mùi · Thiên Cơ (Hãm) hội Tuần',
        dropCapLetter: 'T',
        content:
            'Thiên Cơ ngộ Tuần Triệt đồng cung tạo thế phản vi kỳ cách, biến hung thành cát. Cần chú ý các bệnh liên quan đến hệ thần kinh, thị lực và khí huyết khi thời tiết chuyển mùa hanh khô.',
      ),
      const DossierPageData(
        pageNumber: 12,
        title: 'CUNG TÀI BẠCH',
        category: '12 CUNG ĐỊA BÀN',
        subTitle: 'Cung Thân · Lộc Tồn & Hóa Lộc',
        dropCapLetter: 'T',
        content:
            'Cách cục Song Lộc Triều Viên vô cùng hiếm có! Tiền bạc dồi dào như nước triều dâng, kinh doanh buôn bán một vốn bốn lời, kho tàng luôn đầy ắp tài lộc, không bao giờ phải lo lắng về phương diện vật chất sinh nhai.',
      ),
      const DossierPageData(
        pageNumber: 13,
        title: 'CUNG TỬ TỨC',
        category: '12 CUNG ĐỊA BÀN',
        subTitle: 'Cung Dậu · Thiên Khôi & Văn Tinh',
        dropCapLetter: 'T',
        content:
            'Con cái sinh ra thông minh đĩnh ngộ, tướng mạo khôi ngô tuấn tú, học hành đỗ đạt cao. Hậu vận con cháu hiếu thảo, rạng danh dòng tộc và là chỗ dựa vững chắc cho cha mẹ khi về già.',
      ),
      const DossierPageData(
        pageNumber: 14,
        title: 'CUNG PHU THÊ',
        category: '12 CUNG ĐỊA BÀN',
        subTitle: 'Cung Tuất · Thiên Đồng & Hồng Loan',
        dropCapLetter: 'P',
        content:
            'Người phối ngẫu đoan trang thùy mị, tính tình hiền thục chu đáo, có tài thêu thùa nữ công và trợ giúp đắc lực cho sự nghiệp của thân chủ. Vợ chồng tương kính như tân, bạc đầu giai lão.',
      ),
      const DossierPageData(
        pageNumber: 15,
        title: 'CUNG HUYNH ĐỆ',
        category: '12 CUNG ĐỊA BÀN',
        subTitle: 'Cung Hợi · Hữu Bật & Thiên Hỷ',
        dropCapLetter: 'H',
        content:
            'Anh chị em trong nhà hòa thuận, gắn kết bền chặt keo sơn. Khi gặp khó khăn hoạn nạn luôn có sự tương trợ kịp thời từ người ruột thịt, cùng nhau gây dựng cơ nghiệp gia đình thịnh vượng.',
      ),

      // Trang 16: Đại Hạn 10 Năm
      const DossierPageData(
        pageNumber: 16,
        title: 'VẬN TRÌNH ĐẠI HẠN 10 NĂM',
        category: 'VẬN SỐ',
        subTitle: 'Đại Hạn 34 - 43 Tuổi tại Cung Thìn (Quan Lộc)',
        dropCapLetter: 'V',
        content:
            'Bước vào đại hạn vàng rực rỡ nhất cuộc đời từ 34 đến 43 tuổi. Cung Thìn hội đủ Liêm Phủ Khôi Việt, mở ra thời kỳ đỉnh cao sự nghiệp. Đây là giai đoạn thân chủ mở rộng quy mô kinh doanh, thăng quan tiến chức vượt bậc và tạo dựng cơ đồ trường cửu.',
        keyAttributes: {
          'Đại Hạn Hiện Tại': '34 - 43 Tuổi',
          'Cung Đóng': 'Thìn (Quan Lộc)',
          'Khí Vận': 'Cực Vượng Đại Cát',
        },
      ),

      // Trang 17: Lưu Niên 2026 Bính Ngọ
      const DossierPageData(
        pageNumber: 17,
        title: 'LƯU NIÊN VẬN HẠN 2026 BÍNH NGỌ',
        category: 'LƯU NIÊN',
        subTitle: 'Năm Bính Ngọ (Thiên Hà Thủy) · Thái Tuế Nhập Cung',
        dropCapLetter: 'N',
        content:
            'Năm 2026 Bính Ngọ, Lưu Thái Tuế nhập cung Thiên Di tại Ngọ gặp Thất Sát miếu địa. Thân chủ có nhiều chuyến xuất ngoại công tác lớn, ký kết các hợp đồng kinh tế quy mô triệu đô. Tài chính đại lợi vào các tháng 7, 8 và 11 âm lịch.',
        keyAttributes: {
          'Lưu Thái Tuế': 'Cung Ngọ (Thiên Di)',
          'Lưu Lộc Tồn': 'Cung Tỵ',
          'Điểm Vận Năm': '92 / 100',
        },
      ),

      // Trang 18: Khâm Thiên Giám Ngự Phê Sâu Sắc
      const DossierPageData(
        pageNumber: 18,
        title: 'KHÂM THIÊN GIÁM NGỰ PHÊ',
        category: 'NGỰ BÚT',
        subTitle: 'Bản Sớ Cơ Mật Khai Vận · Trích Ngự Thư Đình Thần',
        dropCapLetter: 'K',
        content:
            'Khâm Thiên Giám phụng mệnh chiếu xét tinh bàn đương số Hoàng Nam: Mệnh vững như bàn thạch, Tài vượng tợ hải triều. Khuyên đương số giữ vững đạo lý dĩ nhân vi bản, hành thiện tích đức để phước lộc lưu truyền trăm năm. Năm 2026 nên chú trọng mở rộng liên minh đối tác và bảo vệ sức khỏe dưỡng phế vào mùa hạ.',
      ),

      // Trang 19: Lời Bạt & Con Dấu Triện Son
      const DossierPageData(
        pageNumber: 19,
        title: 'LỜI BẠT & CHỨNG THỰC BẢO MẬT',
        category: 'CHỨNG THỰC',
        subTitle: 'Khâm Thiên Bảo Chứng · Mã Số Hồ Sơ VIOS-ROYAL-8899',
        dropCapLetter: 'K',
        hasSeal: true,
        content:
            'Tập hồ sơ này được lưu trữ vĩnh viễn trên tinh bàn số ViOS, được đóng dấu bảo chứng tâm linh bởi Khâm Thiên Giám. Bản quyền số hóa và thủy ấn cá nhân hóa thuộc về thân chủ Hoàng Nam. Kính chúc thân chủ vạn thọ vô cương, công thành danh toại!',
        keyAttributes: {
          'Mã Hồ Sơ': 'VIOS-ROYAL-8899',
          'Ngày Chứng Thực': '09/09/2026',
          'Cơ Quan Phụng Mệnh': 'Khâm Thiên Giám Triều Nguyễn',
        },
      ),
    ];

    return RoyalDossierData(
      clientName: 'Hoàng Nam',
      securityWatermark: 'VIOS-ROYAL-8899 · KHÂM THIÊN BẢO MẬT',
      birthInfo: '15/08/1993 (Dương Lịch) · Giờ Thân',
      lunarBirthInfo: '28/06 Quý Dậu (Âm Lịch)',
      elementAndDestiny: 'Kiếm Phong Kim · Kim Tứ Cục',
      pages: pages,
    );
  }
}
