import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/royal_share_item.dart';

final royalGalleryServiceProvider = Provider<RoyalGalleryService>((ref) {
  return RoyalGalleryService();
});

final royalGalleryItemsProvider =
    AsyncNotifierProvider<RoyalGalleryNotifier, List<RoyalShareItem>>(() {
  return RoyalGalleryNotifier();
});

class RoyalGalleryNotifier extends AsyncNotifier<List<RoyalShareItem>> {
  @override
  Future<List<RoyalShareItem>> build() async {
    final service = ref.watch(royalGalleryServiceProvider);
    return service.getItems();
  }

  Future<void> addItem(RoyalShareItem item) async {
    final service = ref.read(royalGalleryServiceProvider);
    await service.saveItem(item);
    state = AsyncData(await service.getItems());
  }

  Future<void> removeItem(String id) async {
    final service = ref.read(royalGalleryServiceProvider);
    await service.deleteItem(id);
    state = AsyncData(await service.getItems());
  }

  Future<void> refresh() async {
    final service = ref.read(royalGalleryServiceProvider);
    state = AsyncData(await service.getItems());
  }
}

class RoyalGalleryService {
  static const String _kStorageKey = 'vios_royal_share_gallery_items_v1';

  Future<List<RoyalShareItem>> getItems({RoyalCardType? filterType}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final rawList = prefs.getStringList(_kStorageKey) ?? [];
      final items = rawList
          .map((jsonStr) {
            try {
              return RoyalShareItem.fromJson(jsonStr);
            } catch (_) {
              return null;
            }
          })
          .whereType<RoyalShareItem>()
          .toList();

      // Sắp xếp mới nhất lên đầu
      items.sort((a, b) => b.createdAt.compareTo(a.createdAt));

      if (filterType != null) {
        return items.where((i) => i.type == filterType).toList();
      }
      return items;
    } catch (_) {
      return [];
    }
  }

  Future<void> saveItem(RoyalShareItem item) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final current = await getItems();

      // Tránh trùng lặp ID
      final updated = [
        item,
        ...current.where((i) => i.id != item.id),
      ];

      // Giữ tối đa 50 item gần nhất để tối ưu dung lượng
      final trimmed = updated.take(50).toList();
      final stringList = trimmed.map((i) => json.encode(i.toMap())).toList();

      await prefs.setStringList(_kStorageKey, stringList);
    } catch (_) {
      // Bỏ qua lỗi lưu trữ âm thầm
    }
  }

  Future<void> deleteItem(String id) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final current = await getItems();
      final updated = current.where((i) => i.id != id).toList();
      final stringList = updated.map((i) => json.encode(i.toMap())).toList();
      await prefs.setStringList(_kStorageKey, stringList);
    } catch (_) {
      // Bỏ qua lỗi
    }
  }

  Future<void> clearAll() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_kStorageKey);
    } catch (_) {
      // Bỏ qua lỗi
    }
  }
}
