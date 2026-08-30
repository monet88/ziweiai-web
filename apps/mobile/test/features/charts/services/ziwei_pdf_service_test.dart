import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/features/charts/data/models/chart_snapshot.dart';
import 'package:ziweiai_mobile/features/charts/data/models/horoscope_models.dart';
import 'package:ziweiai_mobile/features/charts/services/ziwei_pdf_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ZiweiPdfService Tests', () {
    test('generateZiweiReportPdf creates valid non-empty PDF bytes', () async {
      final snapshot = ChartSnapshot(
        snapshotId: 'snap-test-123',
        chartSystem: 'zi-wei-dou-shu',
        birth: {
          'name': 'Nguyễn Văn A',
          'gender': 'male',
          'solarDate': '1990-05-15',
          'solarTime': '06:30',
          'lunarDate': '1990-04-21',
        },
        summary: {
          'yearPillar': 'Canh Ngọ',
          'monthPillar': 'Tân Tỵ',
          'dayPillar': 'Mậu Thìn',
          'hourPillar': 'Ất Mão',
          'fiveElements': 'Lộ Bàng Thổ',
          'destinyYinYang': 'Dương Nam',
          'bodyPalace': 'Quan Lộc',
        },
        palaces: List.generate(
          12,
          (i) => Palace(
            nameKey: 'palace.ming',
            index: i,
            heavenlyStemKey: 'stem.geng',
            earthlyBranchKey: 'branch.wu',
            isBodyPalace: i == 0,
            isOriginalPalace: i == 0,
            majorStars: [
              Star(nameKey: 'star.zi_wei', group: 'major', displayName: 'Tử Vi'),
              Star(nameKey: 'star.tian_fu', group: 'major', displayName: 'Thiên Phủ'),
            ],
            minorStars: [
              Star(nameKey: 'star.wen_chang', group: 'minor', displayName: 'Văn Xương'),
            ],
            adjectiveStars: [],
            ages: [10, 22],
            displayName: 'Mệnh',
          ),
        ),
      );

      final annualReport = AnnualReportResponse(
        chartId: 'chart-123',
        year: 2026,
        frame: AnnualReportFrame(
          yearly: const HoroscopeItem(
            index: 6,
            heavenlyStemKey: 'stem.bing',
            earthlyBranchKey: 'branch.wu',
            palaceNameKeys: ['palace.guan_lu'],
            mutagenStarKeys: ['star.lian_zhen.ji'],
          ),
          monthly: List.generate(
            12,
            (i) => HoroscopeItem(
              index: i,
              heavenlyStemKey: 'stem.jia',
              earthlyBranchKey: 'branch.zi',
              palaceNameKeys: ['palace.ming'],
              mutagenStarKeys: [],
            ),
          ),
        ),
        markdown: '# Luận Giải Vận Hạn Năm 2026\nBản mệnh gặp Lưu Thái Tuế tại cung Quan Lộc.',
      );

      final Uint8List pdfBytes = await ZiweiPdfService.generateZiweiReportPdf(
        snapshot: snapshot,
        annualReport: annualReport,
        systemKey: 'zi-wei-dou-shu',
        userName: 'Nguyễn Văn A',
      );

      expect(pdfBytes, isNotNull);
      expect(pdfBytes.isNotEmpty, isTrue);
      // PDF documents must start with %PDF header
      final header = String.fromCharCodes(pdfBytes.sublist(0, 4));
      expect(header, equals('%PDF'));
      // Minimum size should be at least a few kilobytes
      expect(pdfBytes.length, greaterThan(1000));
    });
  });
}
