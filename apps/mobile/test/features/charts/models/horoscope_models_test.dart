import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/features/charts/data/models/horoscope_models.dart';

void main() {
  group('HoroscopeModels Serialization Tests', () {
    test('HoroscopeItem fromJson and toJson maps correctly', () {
      final json = {
        'index': 3,
        'heavenlyStemKey': 'stem.bing',
        'earthlyBranchKey': 'branch.chen',
        'palaceNameKeys': ['palace.ming', 'palace.shen'],
        'mutagenStarKeys': ['star.tian_tong.lu', 'star.tian_liang.quan'],
      };

      final item = HoroscopeItem.fromJson(json);

      expect(item.index, 3);
      expect(item.heavenlyStemKey, 'stem.bing');
      expect(item.earthlyBranchKey, 'branch.chen');
      expect(item.palaceNameKeys, ['palace.ming', 'palace.shen']);
      expect(item.mutagenStarKeys, ['star.tian_tong.lu', 'star.tian_liang.quan']);

      final serialized = item.toJson();
      expect(serialized['index'], 3);
      expect(serialized['heavenlyStemKey'], 'stem.bing');
    });

    test('AnnualReportResponse fromJson and toJson maps complete structure', () {
      final json = {
        'chartId': 'c7b57b98-333e-436d-9610-1c3fa36efea1',
        'year': 2026,
        'frame': {
          'yearly': {
            'index': 6,
            'heavenlyStemKey': 'stem.bing',
            'earthlyBranchKey': 'branch.wu',
            'palaceNameKeys': ['palace.guan_lu'],
            'mutagenStarKeys': ['star.lian_zhen.ji'],
          },
          'monthly': List.generate(
            12,
            (i) => {
              'index': i,
              'heavenlyStemKey': 'stem.jia',
              'earthlyBranchKey': 'branch.zi',
              'palaceNameKeys': ['palace.ming'],
              'mutagenStarKeys': [],
            },
          ),
        },
        'markdown': '# Luận Giải Vận Hạn Năm 2026\nNăm Bính Ngọ cát hung tương bán.',
      };

      final response = AnnualReportResponse.fromJson(json);

      expect(response.chartId, 'c7b57b98-333e-436d-9610-1c3fa36efea1');
      expect(response.year, 2026);
      expect(response.frame.yearly.index, 6);
      expect(response.frame.yearly.heavenlyStemKey, 'stem.bing');
      expect(response.frame.monthly.length, 12);
      expect(response.markdown, contains('Luận Giải Vận Hạn Năm 2026'));

      final serialized = response.toJson();
      expect(serialized['chartId'], 'c7b57b98-333e-436d-9610-1c3fa36efea1');
      expect(serialized['year'], 2026);
    });
  });
}
