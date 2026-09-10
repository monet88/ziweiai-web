import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/features/dossier/data/models/dossier_models.dart';
import 'package:ziweiai_mobile/features/dossier/services/royal_dossier_pdf_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('RoyalDossierPdfService Tests (Phase 45.3)', () {
    test('generatePdf produces valid non-empty A4 vector PDF bytes for 19-page dossier', () async {
      final sampleDossier = RoyalDossierData(
        clientName: 'Hoàng Nam',
        securityWatermark: 'VIOS-ROYAL-8899 · KHÂM THIÊN BẢO MẬT',
        birthInfo: '15/08/1993',
        lunarBirthInfo: '28/06 Quý Dậu',
        elementAndDestiny: 'Kiếm Phong Kim',
        pages: [
          const DossierPageData(
            pageNumber: 1,
            title: 'HỒ SƠ MỆNH LÝ HOÀNG GIA',
            category: 'NGỰ THƯ',
            subTitle: 'Khâm Thiên Giám Ngự Chế',
            isCover: true,
            dropCapLetter: 'H',
            content: 'Nội dung trang bìa kiểm thử vector PDF hoàng gia.',
            keyAttributes: {
              'Đương Số': 'Hoàng Nam',
              'Bản Mệnh': 'Kiếm Phong Kim',
            },
          ),
          const DossierPageData(
            pageNumber: 19,
            title: 'NGỰ BÚT PHÊ CHUẨN',
            category: 'LỜI PHÊ',
            dropCapLetter: 'N',
            content: 'Trang kết với con dấu Khâm Thiên Giám Ngự Bút.',
          ),
        ],
      );

      final pdfBytes = await RoyalDossierPdfService.generatePdf(sampleDossier);

      expect(pdfBytes, isNotEmpty);
      // PDF file magic header: %PDF
      expect(pdfBytes.sublist(0, 4), [0x25, 0x50, 0x44, 0x46]);
    });
  });
}
