import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/royal_share_item.dart';
import '../../subscription/providers/subscription_provider.dart';

enum SyncStatus {
  success,
  notPro,
  unauthenticated,
  error,
}

class SyncResult {
  final SyncStatus status;
  final int count;
  final String? errorMessage;

  const SyncResult({
    required this.status,
    this.count = 0,
    this.errorMessage,
  });

  bool get isSuccess => status == SyncStatus.success;
}

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

  Future<SyncResult> syncCloud() async {
    final service = ref.read(royalGalleryServiceProvider);
    final isProUser = ref.read(isProUserProvider);
    final result = await service.syncCloudGallery(isPro: isProUser);
    state = AsyncData(await service.getItems());
    return result;
  }

  Future<void> clearAll({bool? isPro}) async {
    final service = ref.read(royalGalleryServiceProvider);
    final bool isProUser = isPro ?? ref.read(isProUserProvider);
    await service.clearAll(isPro: isProUser);
    state = AsyncData(await service.getItems());
  }

  Future<void> refresh() async {
    final service = ref.read(royalGalleryServiceProvider);
    state = AsyncData(await service.getItems());
  }
}

class RoyalGalleryService {
  static const String _kStorageKey = 'vios_royal_share_gallery_items_v1';
  static const String _kBucketName = 'royal-gallery';

  final SharedPreferences? _prefsOverride;
  final SupabaseClient? _supabaseOverride;

  RoyalGalleryService({
    SharedPreferences? prefs,
    SupabaseClient? supabase,
  })  : _prefsOverride = prefs,
        _supabaseOverride = supabase;

  SupabaseClient? get _client {
    if (_supabaseOverride != null) return _supabaseOverride;
    try {
      return Supabase.instance.client;
    } catch (_) {
      return null;
    }
  }

  Future<List<RoyalShareItem>> getItems({RoyalCardType? filterType}) async {
    try {
      final prefs = _prefsOverride ?? await SharedPreferences.getInstance();
      final rawList = prefs.getStringList(_kStorageKey) ?? [];
      final items = rawList
          .map((jsonStr) {
            try {
              final item = RoyalShareItem.fromJson(jsonStr);
              if (item.isDeleted) return null;
              return item;
            } catch (_) {
              return null;
            }
          })
          .whereType<RoyalShareItem>()
          .toList();

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
      final prefs = _prefsOverride ?? await SharedPreferences.getInstance();
      final current = await getItems();

      var itemToSave = item;

      if (isPro) {
        final client = _client;
        final user = client?.auth.currentUser;
        final bool isIdentified = user != null && user.email != null && user.email!.isNotEmpty && !(user.isAnonymous);
        if (client != null && isIdentified) {
          String? storagePath = item.storagePath;
          String? signedUrl = item.imageUrl;

          final localFile = File(item.imagePath);
          if (localFile.existsSync() && (storagePath == null || storagePath.isEmpty)) {
            try {
              final ext = item.imagePath.split('.').last;
              final path = '${user.id}/${item.id}.$ext';
              final fileBytes = await localFile.readAsBytes();
              await client.storage.from(_kBucketName).uploadBinary(
                    path,
                    fileBytes,
                    fileOptions: FileOptions(
                      upsert: true,
                      contentType: ext == 'webp' ? 'image/webp' : 'image/png',
                    ),
                  );
              storagePath = path;
              signedUrl = await client.storage
                  .from(_kBucketName)
                  .createSignedUrl(path, 3600 * 24 * 7);
            } catch (storageErr) {
              debugPrint('[RoyalGalleryService] Upload binary to storage failed: $storageErr');
            }
          }

          itemToSave = item.copyWith(
            storagePath: storagePath,
            imageUrl: signedUrl,
            updatedAt: DateTime.now(),
          );

          try {
            await client.from('royal_gallery_shares').upsert({
              'id': itemToSave.id,
              'owner_user_id': user.id,
              'card_type': itemToSave.type.name,
              'title': itemToSave.title,
              'subtitle': itemToSave.subtitle,
              'aspect_ratio': itemToSave.aspectRatio.name,
              'custom_seal_name': itemToSave.customSealName,
              'image_path': itemToSave.imagePath,
              'storage_path': itemToSave.storagePath,
              'image_url': itemToSave.imageUrl,
              'created_at': itemToSave.createdAt.toIso8601String(),
              'updated_at': (itemToSave.updatedAt ?? DateTime.now()).toIso8601String(),
              'deleted_at': null,
            });
          } catch (upsertErr) {
            debugPrint('[RoyalGalleryService] Upsert share record failed: $upsertErr');
          }
        }
      }

      // Tránh trùng lặp ID ở local
      final updated = [
        itemToSave,
        ...current.where((i) => i.id != itemToSave.id),
      ];

      // Giữ tối đa 50 item gần nhất để tối ưu dung lượng
      final trimmed = updated.take(50).toList();
      final stringList = trimmed.map((i) => json.encode(i.toMap())).toList();

      await prefs.setStringList(_kStorageKey, stringList);
    } catch (err) {
      debugPrint('[RoyalGalleryService] saveItem local storage error: $err');
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
        final bool isIdentified = user != null && user.email != null && user.email!.isNotEmpty && !(user.isAnonymous);
        if (client != null && isIdentified) {
          try {
            await client.from('royal_gallery_shares').update({
              'deleted_at': DateTime.now().toIso8601String(),
              'updated_at': DateTime.now().toIso8601String(),
            }).eq('id', id).eq('owner_user_id', user.id);
          } catch (delErr) {
            debugPrint('[RoyalGalleryService] Remote soft-delete failed: $delErr');
          }
        }
      }
    } catch (err) {
      debugPrint('[RoyalGalleryService] deleteItem local error: $err');
    }
  }

  /// Đồng bộ hai chiều Thư Viện Hoàng Triều với Supabase Cloud (Đặc quyền VIP PRO)
  Future<SyncResult> syncCloudGallery({required bool isPro}) async {
    if (!isPro) {
      return const SyncResult(
        status: SyncStatus.notPro,
        errorMessage: 'Tính năng chỉ dành cho thành viên VIP PRO.',
      );
    }

    final client = _client;
    final user = client?.auth.currentUser;
    if (client == null || user == null) {
      return const SyncResult(
        status: SyncStatus.unauthenticated,
        errorMessage: 'Vui lòng đăng nhập để sử dụng tính năng đồng bộ.',
      );
    }

    final nonNullClient = client;

    final bool isIdentified = user.email != null && user.email!.isNotEmpty && !(user.isAnonymous);
    if (!isIdentified) {
      return const SyncResult(
        status: SyncStatus.notPro,
        errorMessage: 'Tính năng đồng bộ đám mây yêu cầu tài khoản đã đăng nhập Email.',
      );
    }

    try {
      // 1. Kéo toàn bộ danh sách thiệp từ Cloud của user (bao gồm cả tombstone deleted_at)
      final response = await nonNullClient
          .from('royal_gallery_shares')
          .select()
          .eq('owner_user_id', user.id)
          .order('updated_at', ascending: false);

      final remoteRows = (response as List).cast<Map<String, dynamic>>();
      final remoteItems = <RoyalShareItem>[];
      final remoteDeletedIds = <String>{};

      for (final row in remoteRows) {
        final deletedAtStr = row['deleted_at'] as String?;
        if (deletedAtStr != null) {
          remoteDeletedIds.add(row['id'] as String);
          continue;
        }

        String? signedUrl = row['image_url'] as String?;
        final storagePath = row['storage_path'] as String?;

        // Nếu có storage_path mà signedUrl trống, tạo signed URL mới
        if ((signedUrl == null || signedUrl.isEmpty) && storagePath != null && storagePath.isNotEmpty) {
          try {
            signedUrl = await nonNullClient.storage
                .from(_kBucketName)
                .createSignedUrl(storagePath, 3600 * 24 * 7);
          } catch (signErr) {
            debugPrint('[RoyalGalleryService] Sign remote storage path failed: $signErr');
          }
        }

        remoteItems.add(RoyalShareItem(
          id: row['id'] as String,
          title: row['title'] as String,
          type: RoyalCardType.values.firstWhere(
            (e) => e.name == row['card_type'],
            orElse: () => RoyalCardType.ziwei,
          ),
          createdAt: DateTime.tryParse(row['created_at'] as String? ?? '') ?? DateTime.now(),
          imagePath: (row['image_path'] as String?) ?? '',
          storagePath: storagePath,
          imageUrl: signedUrl,
          updatedAt: DateTime.tryParse(row['updated_at'] as String? ?? ''),
          deletedAt: null,
          subtitle: row['subtitle'] as String?,
          aspectRatio: (row['aspect_ratio'] == 'story9_16')
              ? RoyalAspectRatio.story9_16
              : RoyalAspectRatio.standard,
          customSealName: row['custom_seal_name'] as String?,
        ));
      }

      final localItems = await getItems();
      final remoteIds = remoteItems.map((e) => e.id).toSet();

      // 2. Đẩy các bản ghi local chưa có trên remote lên Cloud (nếu không nằm trong danh sách đã xóa)
      for (final local in localItems) {
        if (remoteDeletedIds.contains(local.id)) {
          // Đã bị xóa trên remote từ thiết bị khác -> không đẩy lại
          continue;
        }

        if (!remoteIds.contains(local.id)) {
          String? storagePath = local.storagePath;
          String? signedUrl = local.imageUrl;

          final localFile = File(local.imagePath);
          if (localFile.existsSync() && (storagePath == null || storagePath.isEmpty)) {
            try {
              final ext = local.imagePath.split('.').last;
              final path = '${user.id}/${local.id}.$ext';
              final fileBytes = await localFile.readAsBytes();
              await nonNullClient.storage.from(_kBucketName).uploadBinary(
                    path,
                    fileBytes,
                    fileOptions: FileOptions(
                      upsert: true,
                      contentType: ext == 'webp' ? 'image/webp' : 'image/png',
                    ),
                  );
              storagePath = path;
              signedUrl = await nonNullClient.storage
                  .from(_kBucketName)
                  .createSignedUrl(path, 3600 * 24 * 7);
            } catch (uploadErr) {
              debugPrint('[RoyalGalleryService] Upload local item to cloud failed: $uploadErr');
            }
          }

          try {
            await nonNullClient.from('royal_gallery_shares').upsert({
              'id': local.id,
              'owner_user_id': user.id,
              'card_type': local.type.name,
              'title': local.title,
              'subtitle': local.subtitle,
              'aspect_ratio': local.aspectRatio.name,
              'custom_seal_name': local.customSealName,
              'image_path': local.imagePath,
              'storage_path': storagePath,
              'image_url': signedUrl,
              'created_at': local.createdAt.toIso8601String(),
              'updated_at': (local.updatedAt ?? DateTime.now()).toIso8601String(),
              'deleted_at': null,
            });
          } catch (upsertErr) {
            debugPrint('[RoyalGalleryService] Upsert local item to remote failed: $upsertErr');
          }
        }
      }

      // 3. Hợp nhất hai nguồn dữ liệu (loại bỏ các ID bị xóa trên remote)
      final mergedMap = <String, RoyalShareItem>{};
      for (final item in remoteItems) {
        mergedMap[item.id] = item;
      }
      for (final item in localItems) {
        if (!remoteDeletedIds.contains(item.id)) {
          // Ưu tiên bản ghi có ảnh local hoặc signedUrl mới
          final existing = mergedMap[item.id];
          if (existing != null) {
            mergedMap[item.id] = existing.copyWith(
              imagePath: item.imagePath.isNotEmpty ? item.imagePath : existing.imagePath,
              imageUrl: existing.imageUrl ?? item.imageUrl,
            );
          } else {
            mergedMap[item.id] = item;
          }
        }
      }

      final mergedList = mergedMap.values.toList()
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
      final trimmed = mergedList.take(50).toList();

      final prefs = await SharedPreferences.getInstance();
      final stringList = trimmed.map((i) => json.encode(i.toMap())).toList();
      await prefs.setStringList(_kStorageKey, stringList);

      return SyncResult(
        status: SyncStatus.success,
        count: trimmed.length,
      );
    } catch (e) {
      return SyncResult(
        status: SyncStatus.error,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> clearAll({bool isPro = false}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final current = await getItems();
      await prefs.remove(_kStorageKey);

      if (isPro) {
        final client = _client;
        final user = client?.auth.currentUser;
        if (client != null && user != null) {
          // Đánh dấu tombstone toàn bộ
          for (final item in current) {
            await client.from('royal_gallery_shares').update({
              'deleted_at': DateTime.now().toIso8601String(),
              'updated_at': DateTime.now().toIso8601String(),
            }).eq('id', item.id).eq('owner_user_id', user.id);
          }
        }
      }
    } catch (_) {
      // Bỏ qua lỗi
    }
  }
}
