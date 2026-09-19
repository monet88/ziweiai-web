import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/features/bazi/data/models/bazi_models.dart';
import 'package:ziweiai_mobile/features/bazi/data/repositories/bazi_repository.dart';
import 'package:ziweiai_mobile/features/bazi/presentation/bazi_screen.dart';
import 'package:ziweiai_mobile/features/bazi/providers/bazi_provider.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';

class FakeBaziRepository extends BaziRepository {
  @override
  Future<BaziChartData> getBaziChart({
    String? name,
    String? gender,
    DateTime? birthDate,
    int? birthHour,
  }) async {
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
            'Thổ sinh Kim điều hòa vượng khí, bồi dưỡng căn cơ, mang lại phúc lộc bền vững.',
      ),
      xiShen: DeityDefinition(
        type: 'Hỷ Thần',
        element: 'Thủy (Thực Thương)',
        description: 'Thủy tiết tú Kim vượng, khơi thông tài trí mẫn tiệp.',
      ),
      jiShen: DeityDefinition(
        type: 'Kỵ Thần',
        element: 'Hỏa (Quan Sát)',
        description: 'Hỏa khắc Kim quá vội, dễ phát sinh hao tổn tâm lực.',
      ),
      forecast2026: [
        ForecastPillar(
          title: 'Sự Nghiệp & Công Danh',
          score: 88,
          verdict: 'Đại Cát',
          advice: 'Bính Hỏa hợp Tân Kim hóa Thủy tương sinh đại cát.',
        ),
        ForecastPillar(
          title: 'Tài Chính & Tiền Tài',
          score: 82,
          verdict: 'Vượng Phát',
          advice: 'Thực Thần sinh Tài, dòng tiền luân chuyển dồi dào.',
        ),
      ],
      annualAnalysis:
          'Năm 2026 Bính Ngọ thiên can Bính Hỏa tương hợp với Nhật Chủ Tân Kim hóa Thủy.',
      aiExplanation: null,
    );
  }

  @override
  Future<String> requestAiExplanation({
    required BaziChartData chart,
    String? focusArea,
  }) async {
    return '### 👑 KHÂM THIÊN GIÁM NGỰ PHÊ · ĐẠI VẬN 2026\n\nBản mệnh Tân Kim tọa Hợi đại cát!';
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late FakeBaziRepository fakeRepository;

  setUp(() {
    fakeRepository = FakeBaziRepository();
  });

  Widget buildTestWidget() {
    return ProviderScope(
      overrides: [
        baziRepositoryProvider.overrideWithValue(fakeRepository),
        walletBalanceProvider.overrideWith((ref) => Future.value(88)),
      ],
      child: MaterialApp(
        theme: AppTheme.mystical,
        home: const BaziScreen(),
      ),
    );
  }

  group('BaziScreen Four Pillars & 2026 Forecast Tests', () {
    testWidgets(
        'renders royal bazi header, client profile card, four pillars matrix, five elements, and 2026 forecast',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1000, 2000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestWidget());
      await tester.pump(const Duration(milliseconds: 500));

      // 1. Verify Top App Bar
      expect(find.text('BÁT TỰ TỨ TRỤ'), findsOneWidget);
      expect(
          find.text('Vận Khí Bính Ngọ 2026 · Tử Bình Cổ Pháp'), findsOneWidget);
      expect(find.text('88 XU'), findsOneWidget);

      // 2. Verify Client Profile Card
      expect(find.text('Hoàng Nam'), findsOneWidget);
      expect(find.text('Nam Mạng'), findsOneWidget);
      expect(find.text('Nhật Chủ: Tân Kim (Âm Kim)'), findsOneWidget);

      // 3. Verify Four Pillars Matrix
      expect(find.text('TỨ TRỤ TIÊN THIÊN'), findsOneWidget);
      expect(find.text('Trụ Năm'), findsOneWidget);
      expect(find.text('Trụ Tháng'), findsOneWidget);
      expect(find.text('Trụ Ngày'), findsOneWidget);
      expect(find.text('Trụ Giờ'), findsOneWidget);

      // 4. Verify Five Elements Meter & Deities
      expect(find.text('CÂN BẰNG NGŨ HÀNH'), findsOneWidget);
      expect(find.text('TAM THẦN ĐỊNH MỆNH'), findsOneWidget);
      expect(find.text('Chân Dụng Thần'), findsOneWidget);
      expect(find.text('Hỷ Thần'), findsOneWidget);
      expect(find.text('Kỵ Thần'), findsOneWidget);

      // 5. Verify 2026 Forecast Section
      expect(find.text('VẬN KHÍ NĂM 2026 BÍNH NGỌ'), findsOneWidget);
      expect(find.text('Sự Nghiệp & Công Danh'), findsOneWidget);
      expect(find.text('Tài Chính & Tiền Tài'), findsOneWidget);

      // 6. Verify Royal Dossier 17 Pages Button
      expect(
          find.text('MỞ HỒ SƠ BÁT TỰ HOÀNG GIA 17 TRANG'), findsOneWidget);
    });

    testWidgets(
        'confirms unlock AI explanation and reveals royal imperial decree with 5 XU',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1000, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestWidget());
      await tester.pump(const Duration(milliseconds: 500));

      // Verify AI CTA box exists
      expect(find.text('Khâm Thiên Giám Ngự Phê 2026'), findsOneWidget);
      final unlockBtn =
          find.text('MỞ KHÓA LUẬN GIẢI CHUYÊN SÂU (5 XU)');
      expect(unlockBtn, findsOneWidget);

      // Tap Unlock Button ➜ Should show Confirmation Dialog
      await tester.tap(unlockBtn);
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Xác Nhận Thỉnh Sớ AI'), findsOneWidget);
      expect(find.text('XÁC NHẬN (5 XU)'), findsOneWidget);

      // Confirm dialog
      await tester.tap(find.text('XÁC NHẬN (5 XU)'));
      await tester.pump(const Duration(milliseconds: 500));

      // Verify Imperial Decree appears
      expect(find.text('KHÂM THIÊN GIÁM NGỰ PHÊ'), findsOneWidget);
      expect(find.byType(MarkdownBody), findsOneWidget);
      final markdown = tester.widget<MarkdownBody>(find.byType(MarkdownBody));
      expect(markdown.data.contains('Bản mệnh Tân Kim tọa Hợi đại cát!'), isTrue);
    });
  });
}
