import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/features/charts/presentation/ziwei_board.dart';
import 'package:ziweiai_mobile/features/charts/data/models/chart_snapshot.dart';

void main() {
  testWidgets('ZiweiBoard renders 12 palaces and center info', (WidgetTester tester) async {
    // Create mock snapshot
    final palaces = List.generate(12, (index) {
      return Palace(
        nameKey: 'palace_$index',
        index: index,
        heavenlyStemKey: 'stem',
        earthlyBranchKey: 'branch',
        isBodyPalace: false,
        isOriginalPalace: false,
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

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ZiweiBoard(snapshot: snapshot),
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
  });
}
