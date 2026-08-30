import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:ziweiai_mobile/features/charts/data/models/chart_snapshot.dart';
import 'package:ziweiai_mobile/features/charts/data/repositories/charts_repository.dart';
import 'package:ziweiai_mobile/features/charts/presentation/annual_horoscope_screen.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';

class MockChartsRepository extends Mock implements ChartsRepository {}

void main() {
  late MockChartsRepository mockRepository;

  setUp(() {
    mockRepository = MockChartsRepository();
  });

  final dummyChartData = ChartDetailResponse(
    chartRecord: ChartRecord(
      id: 'chart-test-123',
      ownerUserId: 'user-1',
      chartSystem: 'zi-wei-dou-shu',
      snapshot: ChartSnapshot(
        snapshotId: 'snap-123',
        chartSystem: 'zi-wei-dou-shu',
        birth: {
          'name': 'Nguyễn Văn Test',
          'gender': 'male',
          'solarDate': '1995-10-20',
          'solarTime': '08:00',
        },
        summary: {
          'fiveElements': 'Hải Trung Kim',
          'yearPillar': 'Ất Hợi',
          'monthPillar': 'Bính Tuất',
          'dayPillar': 'Đinh Dậu',
          'hourPillar': 'Giáp Thìn',
        },
        palaces: [],
      ),
    ),
    snapshot: {},
  );

  testWidgets('AnnualHoroscopeScreen renders title, year selector, and CTA button', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          chartsRepositoryProvider.overrideWithValue(mockRepository),
          walletBalanceProvider.overrideWith((ref) => Future.value(100)),
        ],
        child: MaterialApp(
          home: AnnualHoroscopeScreen(chartData: dummyChartData),
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    // Verify Title and overview
    expect(find.text('Vận Hạn Lưu Niên'), findsOneWidget);
    expect(find.text('Chọn Năm Xem Vận Hạn'), findsOneWidget);
    expect(find.text('Vận Hạn 12 Lưu Nguyệt (Âm Lịch)'), findsOneWidget);
    expect(find.text('Luận Giải Với AI (15 XU)'), findsOneWidget);

    // Verify PDF action button icon
    expect(find.byIcon(Icons.picture_as_pdf_outlined), findsOneWidget);
  });
}
