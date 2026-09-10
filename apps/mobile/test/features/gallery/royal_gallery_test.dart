import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:ziweiai_mobile/features/gallery/data/royal_gallery_service.dart';
import 'package:ziweiai_mobile/features/gallery/models/royal_share_item.dart';
import 'package:ziweiai_mobile/features/gallery/presentation/widgets/royal_seal_widget.dart';

void main() {
  group('RoyalShareItem Model Tests', () {
    test('Serializes to map and deserializes from JSON correctly', () {
      final now = DateTime(2026, 9, 10, 13, 30);
      final item = RoyalShareItem(
        id: 'test_1',
        title: 'Chiếu Chỉ Tử Vi Thượng Cát',
        type: RoyalCardType.ziwei,
        createdAt: now,
        imagePath: '/path/to/image.png',
        subtitle: 'Giáp Tuất · Dương Nam',
        aspectRatio: RoyalAspectRatio.story9_16,
        customSealName: 'TRẦN ĐẠI KA',
      );

      final jsonStr = item.toJson();
      final decoded = RoyalShareItem.fromJson(jsonStr);

      expect(decoded.id, 'test_1');
      expect(decoded.title, 'Chiếu Chỉ Tử Vi Thượng Cát');
      expect(decoded.type, RoyalCardType.ziwei);
      expect(decoded.createdAt, now);
      expect(decoded.imagePath, '/path/to/image.png');
      expect(decoded.subtitle, 'Giáp Tuất · Dương Nam');
      expect(decoded.aspectRatio, RoyalAspectRatio.story9_16);
      expect(decoded.customSealName, 'TRẦN ĐẠI KA');
    });

    test('RoyalCardType and RoyalAspectRatio extensions provide expected labels', () {
      expect(RoyalCardType.ziwei.displayName, 'Chiếu Chỉ Tử Vi');
      expect(RoyalCardType.sacredStick.displayName, 'Thẻ Quẻ Thánh');
      expect(RoyalCardType.tarot.displayName, 'Tarot Cung Đình');
      expect(RoyalCardType.iching.displayName, 'Lục Hào Chiêm Bốc');

      expect(RoyalAspectRatio.standard.label, contains('3:4'));
      expect(RoyalAspectRatio.story9_16.label, contains('9:16'));

      expect(RoyalSealType.khamThien.lines, ('KHÂM THIÊN', 'NGỰ BÚT'));
      expect(RoyalSealType.menhChu.lines, ('MỆNH CHỦ', 'CHI BẢO'));
      expect(RoyalSealType.linhXam.lines, ('LINH XĂM', 'TRẤN BẢO'));
      expect(RoyalSealType.huyenCo.lines, ('HUYỀN CƠ', 'TRẤN BẢO'));
    });
  });

  group('RoyalGalleryService Tests', () {
    late RoyalGalleryService service;

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      service = RoyalGalleryService();
    });

    test('Saves and retrieves share items sorted by newest', () async {
      final item1 = RoyalShareItem(
        id: 'item_1',
        title: 'Thẻ 1',
        type: RoyalCardType.ziwei,
        createdAt: DateTime(2026, 9, 10, 10, 0),
        imagePath: '/img1.png',
      );
      final item2 = RoyalShareItem(
        id: 'item_2',
        title: 'Thẻ 2',
        type: RoyalCardType.tarot,
        createdAt: DateTime(2026, 9, 10, 11, 0),
        imagePath: '/img2.png',
      );

      await service.saveItem(item1);
      await service.saveItem(item2);

      final items = await service.getItems();
      expect(items.length, 2);
      expect(items.first.id, 'item_2'); // Newest first
      expect(items.last.id, 'item_1');
    });

    test('Filters items by RoyalCardType', () async {
      await service.saveItem(RoyalShareItem(
        id: 'ziwei_1',
        title: 'Tử Vi',
        type: RoyalCardType.ziwei,
        createdAt: DateTime.now(),
        imagePath: '/p1.png',
      ));
      await service.saveItem(RoyalShareItem(
        id: 'stick_1',
        title: 'Quẻ Thánh',
        type: RoyalCardType.sacredStick,
        createdAt: DateTime.now(),
        imagePath: '/p2.png',
      ));

      final ziweiOnly = await service.getItems(filterType: RoyalCardType.ziwei);
      expect(ziweiOnly.length, 1);
      expect(ziweiOnly.first.type, RoyalCardType.ziwei);

      final tarotOnly = await service.getItems(filterType: RoyalCardType.tarot);
      expect(tarotOnly, isEmpty);
    });

    test('Deletes item and clears all items', () async {
      await service.saveItem(RoyalShareItem(
        id: 'del_me',
        title: 'Delete test',
        type: RoyalCardType.iching,
        createdAt: DateTime.now(),
        imagePath: '/p.png',
      ));

      expect((await service.getItems()).length, 1);
      await service.deleteItem('del_me');
      expect((await service.getItems()), isEmpty);

      await service.saveItem(RoyalShareItem(
        id: 'keep_or_clear',
        title: 'Clear test',
        type: RoyalCardType.iching,
        createdAt: DateTime.now(),
        imagePath: '/p.png',
      ));
      await service.clearAll();
      expect((await service.getItems()), isEmpty);
    });

    test('syncCloudGallery returns notPro when isPro is false and unauthenticated when no user', () async {
      final syncedNonPro = await service.syncCloudGallery(isPro: false);
      expect(syncedNonPro.status, SyncStatus.notPro);
      expect(syncedNonPro.isSuccess, isFalse);

      final syncedNoClient = await service.syncCloudGallery(isPro: true);
      expect(syncedNoClient.status, SyncStatus.unauthenticated);
      expect(syncedNoClient.isSuccess, isFalse);
    });

    test('RoyalShareItem handles copyWith, isDeleted and cloud storage fields', () {
      final now = DateTime.now();
      final item = RoyalShareItem(
        id: 'c1',
        title: 'Thẻ Gốc',
        type: RoyalCardType.ziwei,
        createdAt: now,
        imagePath: '/local.png',
        storagePath: 'royal-gallery/user1/c1.webp',
        imageUrl: 'https://supabase.co/signed/c1.webp',
      );

      expect(item.isDeleted, isFalse);
      expect(item.storagePath, 'royal-gallery/user1/c1.webp');

      final softDeleted = item.copyWith(deletedAt: DateTime.now());
      expect(softDeleted.isDeleted, isTrue);

      final jsonStr = softDeleted.toJson();
      final restored = RoyalShareItem.fromJson(jsonStr);
      expect(restored.isDeleted, isTrue);
      expect(restored.storagePath, 'royal-gallery/user1/c1.webp');
    });
  });

  group('RoyalSealWidget and Watermark Tests', () {
    testWidgets('Renders standard royal seal', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: RoyalSealWidget(
              sealType: RoyalSealType.khamThien,
            ),
          ),
        ),
      );

      expect(find.text('KHÂM THIÊN'), findsOneWidget);
      expect(find.text('NGỰ BÚT'), findsOneWidget);
    });

    testWidgets('Renders custom seal with text split into 2 lines', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: RoyalSealWidget(
              sealType: RoyalSealType.custom,
              customSealText: 'TRẦN ĐẠI KA',
            ),
          ),
        ),
      );

      // "TRẦN ĐẠI KA" -> words length 3 -> ceil(3/2)=2 words first line: "TRẦN ĐẠI", "KA" second line
      expect(find.text('TRẦN ĐẠI'), findsOneWidget);
      expect(find.text('KA'), findsOneWidget);
    });

    testWidgets('Renders royal watermark widget', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Stack(
              children: [
                RoyalWatermarkWidget(text: 'KHÂM THIÊN GIÁM CHÍNH KHẢO'),
              ],
            ),
          ),
        ),
      );

      expect(find.text('KHÂM THIÊN GIÁM CHÍNH KHẢO'), findsOneWidget);
    });
  });
}
