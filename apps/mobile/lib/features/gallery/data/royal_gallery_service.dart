import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/royal_share_item.dart';
import '../../subscription/providers/subscription_provider.dart';

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

  Future<void> addItem(RoyalShareItem item, {bool? isPro}) async {
    final service = ref.read(royalGalleryServiceProvider);
    final bool isProUser = isPro ?? ref.read(isProUserProvider);
    await service.saveItem(item, isPro: isProUser);
    state = AsyncData(await service.getItems());
  }

  Future<void> removeItem(String id, {bool? isPro}) async {
    final service = ref.read(royalGalleryServiceProvider);
    final bool isProUser = isPro ?? ref.read(isProUserProvider);
    await service.deleteItem(id, isPro: isProUser);
    state = AsyncData(await service.getItems());
  }

  Future<int> syncCloud() async {
    final service = ref.read(royalGalleryServiceProvider);
    final isProUser = ref.read(isProUserProvider);
    final count = await service.syncCloudGallery(isPro: isProUser);
    state = AsyncData(await service.getItems());
    return count;
  }

  Future<void> refresh() async {
    final service = ref.read(royalGalleryServiceProvider);
    state = AsyncData(await service.getItems());
  }
}

class RoyalGalleryService {
  static const String _kStorageKey = 'vios_royal_share_gallery_items_v1';
  final SupabaseClient? _customClient;

  RoyalGalleryService({SupabaseClient? supabaseClient})
      : _customClient = supabaseClient;

  SupabaseClient? get _client {
    if (_customClient != null) return _customClient;
    try {
      return Supabase.instance.client;
    } catch (_) {
      return null;
    }
  }

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

  Future<void> saveItem(RoyalShareItem item, {bool isPro = false}) async {
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

      // Nếu là tài khoản VIP PRO, đồng bộ lên Supabase Cloud
      if (isPro) {
        final client = _client;
        final user = client?.auth.currentUser;
        if (client != null && user != null) {
          await client.from('royal_gallery_shares').upsert({
            'id': item.id,
            'owner_user_id': user.id,
            'card_type': item.type.name,
            'title': item.title,
            'subtitle': item.subtitle,
            'aspect_ratio': item.aspectRatio.name,
            'custom_seal_name': item.customSealName,
            'image_path': item.imagePath,
            'created_at': item.createdAt.toIso8601String(),
          });
        }
      }
    } catch (_) {
      // Bỏ qua lỗi lưu trữ âm thầm
    }
  }

  Future<void> deleteItem(String id, {bool isPro = false}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final current = await getItems();
      final updated = current.where((i) => i.id != id).toList();
      final stringList = updated.map((i) => json.encode(i.toMap())).toList();
      await prefs.setStringList(_kStorageKey, stringList);

      if (isPro) {
        final client = _client;
        final user = client?.auth.currentUser;
        if (client != null && user != null) {
          await client
              .from('royal_gallery_shares')
              .delete()
              .eq('id', id)
              .eq('owner_user_id', user.id);
        }
      }
    } catch (_) {
      // Bỏ qua lỗi
    }
  }

  /// Đồng bộ hai chiều Thư Viện Hoàng Triều với Supabase Cloud (Đặc quyền VIP PRO)
  Future<int> syncCloudGallery({required bool isPro}) async {
    if (!isPro) return 0;
    final client = _client;
    final user = client?.auth.currentUser;
    if (client == null || user == null) return 0;

    try {
      // 1. Kéo toàn bộ danh sách thiệp từ Cloud của user
      final response = await client
          .from('royal_gallery_shares')
          .select()
          .eq('owner_user_id', user.id)
          .order('created_at', ascending: false);

      final remoteRows = (response as List).cast<Map<String, dynamic>>();
      final remoteItems = remoteRows.map((row) {
        return RoyalShareItem(
          id: row['id'] as String,
          title: row['title'] as String,
          type: RoyalCardType.values.firstWhere(
            (e) => e.name == row['card_type'],
            orElse: () => RoyalCardType.ziwei,
          ),
          createdAt: DateTime.tryParse(row['created_at'] as String? ?? '') ?? DateTime.now(),
          imagePath: (row['image_path'] as String?) ?? (row['image_url'] as String?) ?? '',
          subtitle: row['subtitle'] as String?,
          aspectRatio: (row['aspect_ratio'] == 'story9_16')
              ? RoyalAspectRatio.story9_16
              : RoyalAspectRatio.standard,
          customSealName: row['custom_seal_name'] as String?,
        );
      }).toList();

      final localItems = await getItems();
      final remoteIds = remoteItems.map((e) => e.id).toSet();

      // 2. Đẩy các bản ghi local chưa có trên remote lên Cloud
      for (final local in localItems) {
        if (!remoteIds.contains(local.id)) {
          await client.from('royal_gallery_shares').upsert({
            'id': local.id,
            'owner_user_id': user.id,
            'card_type': local.type.name,
            'title': local.title,
            'subtitle': local.subtitle,
            'aspect_ratio': local.aspectRatio.name,
            'custom_seal_name': local.customSealName,
            'image_path': local.imagePath,
            'created_at': local.createdAt.toIso8601String(),
          });
        }
      }

      // 3. Hợp nhất hai nguồn dữ liệu, sắp xếp mới nhất và lưu lại local
      final mergedMap = <String, RoyalShareItem>{};
      for (final item in remoteItems) {
        mergedMap[item.id] = item;
      }
      for (final item in localItems) {
        mergedMap[item.id] = item;
      }

      final mergedList = mergedMap.values.toList()
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
      final trimmed = mergedList.take(50).toList();

      final prefs = await SharedPreferences.getInstance();
      final stringList = trimmed.map((i) => json.encode(i.toMap())).toList();
      await prefs.setStringList(_kStorageKey, stringList);

      return trimmed.length;
    } catch (_) {
      return 0;
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

