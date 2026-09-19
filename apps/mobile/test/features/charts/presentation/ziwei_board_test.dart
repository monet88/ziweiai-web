import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/features/charts/presentation/ziwei_board.dart';
import 'package:ziweiai_mobile/features/charts/data/models/chart_snapshot.dart';

void main() {
  testWidgets('ZiweiBoard renders 12 palaces and center info', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1200, 1200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    // Create mock snapshot
    final palaces = List.generate(12, (index) {
      return Palace(
        nameKey: 'palace_$index',
        index: index,
        heavenlyStemKey: 'stem.giap',
        earthlyBranchKey: 'branch.ty',
        isBodyPalace: index == 1,
        isOriginalPalace: index == 0,
        majorStars: [],
        minorStars: [],
        adjectiveStars: [],
        ages: [10],
        displayName: 'Cung $index',
      );
    });

    final snapshot = ChartSnapshot(
      snapshotId: '123',
      chartSystem: 'zi-wei-dou-shu',
      palaces: palaces,
      summary: {'name': 'Lá số test'},
      birth: {'solarYear': 1990},
    );

    Palace? selectedPalace;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ZiweiBoard(
            snapshot: snapshot,
            onPalaceSelected: (palace) {
              selectedPalace = palace;
            },
          ),
        ),
      ),
    );

    // Verify center info
    expect(find.text('Lá số test'), findsOneWidget);
    expect(find.text('Năm sinh: 1990'), findsOneWidget);

    // Verify 12 palaces rendered
    for (int i = 0; i < 12; i++) {
      expect(find.text('Cung $i'), findsOneWidget);
    }

    // Verify InteractiveViewer is present
    expect(find.byType(InteractiveViewer), findsOneWidget);

    // Tap on palace 5 (top-left offset 0, 0)
    await tester.tap(find.text('Cung 5'));
    // Wait for double tap timeout to let single tap fire
    await tester.pump(const Duration(milliseconds: 400));

    expect(selectedPalace, isNotNull);
    expect(selectedPalace!.index, equals(5));
    expect(selectedPalace!.displayName, equals('Cung 5'));
  });
}
