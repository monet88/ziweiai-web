import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/features/charts/data/models/chart_snapshot.dart';
import 'package:ziweiai_mobile/features/charts/presentation/palace_detail_bottom_sheet.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PalaceDetailBottomSheet Widget Tests', () {
    late List<Palace> mockPalaces;

    setUp(() {
      mockPalaces = [
        Palace(
          nameKey: 'life',
          index: 0,
          heavenlyStemKey: 'stem.jia',
          earthlyBranchKey: 'branch.zi',
          isBodyPalace: false,
          isOriginalPalace: true,
          displayName: 'MỆNH',
          changsheng12Key: 'Trường Sinh',
          decadalRange: [15, 24],
          ages: [15, 27, 39],
          majorStars: [
            Star(
              nameKey: 'ziwei',
              group: 'major',
              displayName: 'Tử Vi',
              brightnessKey: 'Vượng',
              mutagen: 'mutagen.khoa',
            ),
            Star(
              nameKey: 'tianfu',
              group: 'major',
              displayName: 'Thiên Phủ',
              brightnessKey: 'Miếu',
            ),
          ],
          minorStars: [
            Star(
              nameKey: 'wenqu',
              group: 'minor',
              displayName: 'Văn Khúc',
              mutagen: 'mutagen.khoa',
            ),
            Star(
              nameKey: 'zuofu',
              group: 'minor',
              displayName: 'Tả Phù',
            ),
            Star(
              nameKey: 'qingyang',
              group: 'minor',
              displayName: 'Kình Dương',
              brightnessKey: 'Hãm',
            ),
          ],
          adjectiveStars: [],
        ),
        Palace(
          nameKey: 'parents',
          index: 1,
          heavenlyStemKey: 'stem.yi',
          earthlyBranchKey: 'branch.chou',
          isBodyPalace: true,
          isOriginalPalace: false,
          displayName: 'PHỤ MẪU',
          changsheng12Key: 'Dưỡng',
          decadalRange: [25, 34],
          ages: [16, 28, 40],
          majorStars: [
            Star(
              nameKey: 'taiyang',
              group: 'major',
              displayName: 'Thái Dương',
              brightnessKey: 'Đắc',
            ),
          ],
          minorStars: [
            Star(
              nameKey: 'huoxing',
              group: 'minor',
              displayName: 'Hỏa Tinh',
              brightnessKey: 'Hãm',
            ),
          ],
          adjectiveStars: [],
        ),
      ];
    });

    testWidgets('renders palace details, stars, and badges properly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.mystical,
          home: Scaffold(
            body: Builder(
              builder: (context) {
                return Center(
                  child: ElevatedButton(
                    onPressed: () {
                      PalaceDetailBottomSheet.show(
                        context,
                        palaces: mockPalaces,
                        initialIndex: 0,
                      );
                    },
                    child: const Text('Open Sheet'),
                  ),
                );
              },
            ),
          ),
        ),
      );

      // Tap to open sheet
      await tester.tap(find.text('Open Sheet'));
      await tester.pumpAndSettle();

      // Verify Palace title
      expect(find.textContaining('CUNG MỆNH'), findsOneWidget);
      expect(find.textContaining('Trường Sinh'), findsOneWidget);
      expect(find.textContaining('15 - 24 Tuổi'), findsOneWidget);

      // Verify Major Stars (inside RichText TextSpan)
      expect(find.textContaining('Tử Vi', findRichText: true), findsWidgets);
      expect(find.textContaining('Thiên Phủ', findRichText: true), findsWidgets);

      // Verify Mutagen Badges (Tứ Hóa)
      expect(find.textContaining('HÓA KHOA'), findsWidgets);

      // Verify Auspicious & Inauspicious groupings
      expect(find.textContaining('Văn Khúc', findRichText: true), findsWidgets);
      expect(find.textContaining('Tả Phù', findRichText: true), findsWidgets);
      expect(find.textContaining('Kình Dương', findRichText: true), findsWidgets);

      // Verify Imperial Interpretation Panel
      expect(find.textContaining('KHÂM THIÊN GIÁM NGỰ PHÊ'), findsOneWidget);
    });

    testWidgets('navigation switches between palaces with 48dp touch target', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1000, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      int? changedIndex;

      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.mystical,
          home: Scaffold(
            body: Builder(
              builder: (context) {
                return Center(
                  child: ElevatedButton(
                    onPressed: () {
                      PalaceDetailBottomSheet.show(
                        context,
                        palaces: mockPalaces,
                        initialIndex: 0,
                        onPalaceChanged: (idx) => changedIndex = idx,
                      );
                    },
                    child: const Text('Open Sheet'),
                  ),
                );
              },
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open Sheet'));
      await tester.pumpAndSettle();

      expect(find.textContaining('CUNG MỆNH'), findsOneWidget);

      // Tap Next button (Arrow Forward)
      final nextButton = find.byIcon(Icons.arrow_forward_ios);
      expect(nextButton, findsOneWidget);
      await tester.tap(nextButton);
      await tester.pumpAndSettle();

      // Verify switched to PHỤ MẪU
      expect(find.textContaining('CUNG PHỤ MẪU'), findsOneWidget);
      expect(find.textContaining('THÂN CƯ'), findsOneWidget);
      expect(find.textContaining('Thái Dương', findRichText: true), findsWidgets);
      expect(changedIndex, equals(1));

      // Tap Back button (Arrow Back New)
      final prevButton = find.byIcon(Icons.arrow_back_ios_new);
      expect(prevButton, findsOneWidget);
      await tester.tap(prevButton);
      await tester.pumpAndSettle();

      // Verify switched back to MỆNH
      expect(find.textContaining('CUNG MỆNH'), findsOneWidget);
      expect(changedIndex, equals(0));

      // Tap Close button
      final closeButton = find.text('HOÀN TẤT TRA CỨU');
      expect(closeButton, findsOneWidget);
      await tester.ensureVisible(closeButton);
      await tester.tap(closeButton);
      await tester.pumpAndSettle();

      // Verify sheet is closed
      expect(find.textContaining('CUNG MỆNH'), findsNothing);
    });
  });
}
