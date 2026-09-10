import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/features/charts/data/models/chart_snapshot.dart';
import 'package:ziweiai_mobile/features/charts/presentation/widgets/royal_ziwei_share_card.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final mockChartData = ChartDetailResponse(
    chartRecord: ChartRecord(
      id: 'test-chart-uuid-12345',
      ownerUserId: 'user-1',
      chartSystem: 'ziwei',
      snapshot: ChartSnapshot(
        snapshotId: 'snap-1',
        chartSystem: 'ziwei',
        birth: {
          'name': 'Nguyễn Văn An',
          'gender': 'male',
          'solarDate': '1990-08-15',
          'solarTime': '09:30',
          'lunarDate': '25/06/Canh Ngọ',
        },
        summary: {
          'yearPillar': 'Canh Ngọ',
          'monthPillar': 'Giáp Thân',
          'dayPillar': 'Ất Dậu',
          'hourPillar': 'Tân Tỵ',
          'fiveElements': 'Lộ Bàng Thổ',
          'destinyYinYang': 'Dương Nam',
          'bodyPalace': 'Quan Lộc',
        },
        palaces: [
          Palace(
            nameKey: 'destiny',
            displayName: 'Mệnh',
            index: 2,
            heavenlyStemKey: 'stem.GENG',
            earthlyBranchKey: 'branch.YIN',
            isBodyPalace: false,
            isOriginalPalace: true,
            majorStars: [
              Star(nameKey: 'ziwei', displayName: 'Tử Vi', group: 'major', brightnessKey: 'mieu'),
              Star(nameKey: 'tianfu', displayName: 'Thiên Phủ', group: 'major', brightnessKey: 'mieu'),
            ],
            minorStars: [],
            adjectiveStars: [],
            ages: [1, 13, 25],
          ),
          Palace(
            nameKey: 'career',
            displayName: 'Quan Lộc',
            index: 6,
            heavenlyStemKey: 'stem.JIA',
            earthlyBranchKey: 'branch.WU',
            isBodyPalace: true,
            isOriginalPalace: false,
            majorStars: [
              Star(nameKey: 'lianzhen', displayName: 'Liêm Trinh', group: 'major', brightnessKey: 'vuong'),
            ],
            minorStars: [],
            adjectiveStars: [],
            ages: [5, 17, 29],
          ),
        ],
      ),
    ),
    snapshot: {},
  );

  testWidgets('RoyalZiweiCertificateCard renders decree header, destiny info, seal and QR code', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.mystical,
        home: Scaffold(
          body: SingleChildScrollView(
            child: RoyalZiweiCertificateCard(
              chartData: mockChartData,
            ),
          ),
        ),
      ),
    );

    // Header
    expect(find.text('KHÂM THIÊN GIÁM'), findsOneWidget);
    expect(find.text('CHIẾU CHỈ MỆNH SỐ'), findsOneWidget);

    // Personal Info
    expect(find.text('NGUYỄN VĂN AN'), findsOneWidget);
    expect(find.textContaining('Nam Mạng'), findsOneWidget);
    expect(find.textContaining('1990-08-15'), findsOneWidget);
    expect(find.textContaining('25/06/Canh Ngọ'), findsOneWidget);

    // Four Pillars
    expect(find.text('NĂM'), findsOneWidget);
    expect(find.text('Canh Ngọ'), findsOneWidget);
    expect(find.text('THÁNG'), findsOneWidget);
    expect(find.text('Giáp Thân'), findsOneWidget);

    // Essence & Palaces
    expect(find.text('CỤC & BẢN MỆNH'), findsOneWidget);
    expect(find.text('Lộ Bàng Thổ'), findsOneWidget);
    expect(find.text('CUNG MỆNH'), findsOneWidget);
    expect(find.text('CUNG THÂN'), findsOneWidget);

    // Seal & Footer
    expect(find.text('KHÂM THIÊN'), findsOneWidget);
    expect(find.text('NGỰ BÚT'), findsOneWidget);
    expect(find.text('TỬ VI TOÀN TẬP'), findsOneWidget);
    expect(find.text('tuvitoantap.vercel.app'), findsOneWidget);
  });
}
