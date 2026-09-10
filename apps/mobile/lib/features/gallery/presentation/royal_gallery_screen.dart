import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../core/theme/app_theme.dart';
import '../../subscription/providers/subscription_provider.dart';
import '../data/royal_gallery_service.dart';
import '../models/royal_share_item.dart';

/// Màn hình Thư Viện Hoàng Triều (Imperial Share Gallery)
/// Nơi lưu trữ, xem lại và chia sẻ nhanh các Chiếu Chỉ Tử Vi, Thẻ Quẻ Thánh, Tarot & Lục Hào đã tạo
class RoyalGalleryScreen extends ConsumerStatefulWidget {
  const RoyalGalleryScreen({super.key});

  static const String routePath = '/royal-gallery';

  @override
  ConsumerState<RoyalGalleryScreen> createState() => _RoyalGalleryScreenState();
}

class _RoyalGalleryScreenState extends ConsumerState<RoyalGalleryScreen> {
  RoyalCardType? _selectedFilter;

  @override
  Widget build(BuildContext context) {
    final galleryAsync = ref.watch(royalGalleryItemsProvider);
    final isPro = ref.watch(isProUserProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0F071D),
      appBar: AppBar(
        backgroundColor: const Color(0xFF140D26),
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFFFFD700), size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'THƯ VIỆN HOÀNG TRIỀU',
          style: GoogleFonts.cinzel(
            color: const Color(0xFFFFD700),
            fontSize: 16,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.5,
          ),
        ),
        actions: [
          IconButton(
            tooltip: isPro ? 'Đồng bộ Đám Mây (VIP PRO)' : 'Đồng bộ Đám Mây (Yêu cầu VIP PRO)',
            icon: Icon(
              isPro ? Icons.cloud_sync : Icons.cloud_queue,
              color: isPro ? AppTheme.goldBright : AppTheme.mysticalTextSecondary,
            ),
            onPressed: () async {
              if (!isPro) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Tính năng đồng bộ đa thiết bị dành riêng cho tài khoản VIP PRO.'),
                  ),
                );
                return;
              }
              HapticFeedback.mediumImpact();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Đang đồng bộ Thư Viện Hoàng Triều với Đám Mây...')),
              );
              final result = await ref.read(royalGalleryItemsProvider.notifier).syncCloud();
              if (context.mounted) {
                if (result.isSuccess) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Đồng bộ thành công! Hiện có ${result.count} thiệp trong thư viện.'),
                      backgroundColor: AppTheme.etherealJade,
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(result.errorMessage ?? 'Đồng bộ thất bại, vui lòng thử lại.'),
                      backgroundColor: Colors.redAccent,
                    ),
                  );
                }
              }
            },
          ),
          IconButton(
            tooltip: 'Làm mới',
            icon: const Icon(Icons.refresh, color: AppTheme.mysticalTextSecondary),
            onPressed: () => ref.read(royalGalleryItemsProvider.notifier).refresh(),
          ),
          IconButton(
            tooltip: 'Xóa toàn bộ',
            icon: const Icon(Icons.delete_sweep_outlined, color: Colors.redAccent),
            onPressed: () => _confirmClearAll(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Bar
          _buildFilterBar(),

          // Cloud Sync VIP PRO Banner / Status Pill
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: isPro
                    ? AppTheme.cosmosElevated.withValues(alpha: 0.6)
                    : const Color(0xFF1B1430),
                border: Border.all(
                  color: isPro
                      ? AppTheme.goldBright.withValues(alpha: 0.3)
                      : Colors.white12,
                  width: 0.8,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isPro ? Icons.cloud_done : Icons.cloud_off_outlined,
                    size: 16,
                    color: isPro ? AppTheme.goldBright : AppTheme.mysticalTextSecondary,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      isPro
                          ? 'Đồng Bộ Đám Mây VIP PRO: Sẵn sàng trên Web & Mobile'
                          : 'Nâng cấp VIP PRO để đồng bộ thiệp tự động sang Web & thiết bị mới',
                      style: TextStyle(
                        color: isPro ? AppTheme.goldBright : AppTheme.mysticalTextSecondary,
                        fontSize: 11,
                        fontWeight: isPro ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                  ),
                  if (!isPro)
                    GestureDetector(
                      onTap: () => context.push('/wallet'),
                      child: const Text(
                        'NÂNG CẤP',
                        style: TextStyle(
                          color: AppTheme.goldBright,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Gallery Body
          Expanded(
            child: galleryAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: Color(0xFFFFD700)),
              ),
              error: (err, _) => Center(
                child: Text(
                  'Lỗi tải thư viện: $err',
                  style: const TextStyle(color: Colors.redAccent),
                ),
              ),
              data: (items) {
                final filtered = _selectedFilter == null
                    ? items
                    : items.where((i) => i.type == _selectedFilter).toList();

                if (filtered.isEmpty) {
                  return _buildEmptyState();
                }

                return GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.65,
                    crossAxisSpacing: 14,
                    mainAxisSpacing: 14,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final item = filtered[index];
                    return _buildGalleryCard(item);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      height: 48,
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _buildFilterChip('Tất Cả 👑', null),
          const SizedBox(width: 8),
          _buildFilterChip('Tử Vi 📜', RoyalCardType.ziwei),
          const SizedBox(width: 8),
          _buildFilterChip('Quẻ Thánh 🎋', RoyalCardType.sacredStick),
          const SizedBox(width: 8),
          _buildFilterChip('Tarot 🔮', RoyalCardType.tarot),
          const SizedBox(width: 8),
          _buildFilterChip('Lục Hào 🪙', RoyalCardType.iching),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, RoyalCardType? type) {
    final isSelected = _selectedFilter == type;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          color: isSelected ? const Color(0xFF140D26) : const Color(0xFFFFD700),
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        ),
      ),
      selected: isSelected,
      selectedColor: const Color(0xFFFFD700),
      backgroundColor: const Color(0xFF1A1130),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: isSelected
              ? const Color(0xFFFFD700)
              : const Color(0xFFFFD700).withValues(alpha: 0.3),
        ),
      ),
      onSelected: (_) {
        setState(() {
          _selectedFilter = type;
        });
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.collections_bookmark_outlined,
              size: 64,
              color: Color(0xFFFFD700),
            ),
            const SizedBox(height: 16),
            Text(
              'Thư Viện Còn Trống',
              style: GoogleFonts.cinzel(
                color: const Color(0xFFFFD700),
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Các Chiếu Chỉ Tử Vi, Thẻ Quẻ Thánh hoặc Bài Tarot khi xuất ảnh sẽ được tự động lưu vào đây để Đại Hiệp xem lại và chia sẻ bất cứ lúc nào.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppTheme.mysticalTextSecondary,
                fontSize: 13,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGalleryCard(RoyalShareItem item) {
    final file = File(item.imagePath);
    final fileExists = file.existsSync();

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1A1032),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFFFD700).withValues(alpha: 0.4),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.4),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(13),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Preview Image or Fallback
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (fileExists)
                    Image.file(
                      file,
                      fit: BoxFit.cover,
                    )
                  else if (item.imageUrl != null && item.imageUrl!.isNotEmpty)
                    Image.network(
                      item.imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (ctx, err, stack) => Container(
                        color: const Color(0xFF241544),
                        child: Center(
                          child: Text(
                            item.type.iconAsset,
                            style: const TextStyle(fontSize: 48),
                          ),
                        ),
                      ),
                      loadingBuilder: (context, child, progress) {
                        if (progress == null) return child;
                        return Container(
                          color: const Color(0xFF241544),
                          child: const Center(
                            child: SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Color(0xFFFFD700),
                              ),
                            ),
                          ),
                        );
                      },
                    )
                  else
                    Container(
                      color: const Color(0xFF241544),
                      child: Center(
                        child: Text(
                          item.type.iconAsset,
                          style: const TextStyle(fontSize: 48),
                        ),
                      ),
                    ),

                  // Aspect ratio badge
                  Positioned(
                    top: 6,
                    left: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.75),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: const Color(0xFFFFD700).withValues(alpha: 0.6),
                          width: 0.8,
                        ),
                      ),
                      child: Text(
                        item.aspectRatio == RoyalAspectRatio.story9_16 ? '9:16 Story' : '3:4 Card',
                        style: const TextStyle(
                          color: Color(0xFFFFD700),
                          fontSize: 9.5,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),

                  // Delete button
                  Positioned(
                    top: 6,
                    right: 6,
                    child: GestureDetector(
                      onTap: () => _deleteItem(item.id),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.65),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.close, size: 14, color: Colors.white70),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Item Details
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.cinzel(
                      color: const Color(0xFFFFD700),
                      fontSize: 11.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${item.createdAt.day}/${item.createdAt.month}/${item.createdAt.year}',
                    style: const TextStyle(
                      color: AppTheme.mysticalTextSecondary,
                      fontSize: 10,
                    ),
                  ),
                  const SizedBox(height: 6),
                  SizedBox(
                    width: double.infinity,
                    height: 28,
                    child: ElevatedButton.icon(
                      onPressed: () => _shareItem(item),
                      icon: const Icon(Icons.share, size: 12, color: Color(0xFF140D26)),
                      label: const Text(
                        'Chia Sẻ',
                        style: TextStyle(
                          color: Color(0xFF140D26),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFFD700),
                        padding: EdgeInsets.zero,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _shareItem(RoyalShareItem item) async {
    final file = File(item.imagePath);
    if (file.existsSync()) {
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          text: '${item.title} từ Khâm Thiên Giám — Tử Vi Toàn Tập',
        ),
      );
    } else if (item.imageUrl != null && item.imageUrl!.isNotEmpty) {
      await SharePlus.instance.share(
        ShareParams(
          text: '${item.title} từ Khâm Thiên Giám — Tử Vi Toàn Tập\n${item.imageUrl}',
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tệp ảnh không tồn tại trên thiết bị')),
      );
    }
  }

  Future<void> _deleteItem(String id) async {
    await ref.read(royalGalleryItemsProvider.notifier).removeItem(id);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã xóa khỏi Thư Viện Hoàng Triều')),
      );
    }
  }

  Future<void> _confirmClearAll(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1F1238),
        title: Text(
          'Dọn Sạch Thư Viện?',
          style: GoogleFonts.cinzel(color: const Color(0xFFFFD700), fontWeight: FontWeight.bold),
        ),
        content: const Text(
          'Hành động này sẽ xóa danh sách toàn bộ các thiệp đã lưu trong Thư Viện Hoàng Triều.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Hủy', style: TextStyle(color: AppTheme.mysticalTextSecondary)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text('Xóa Hết', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(royalGalleryItemsProvider.notifier).clearAll();
    }
  }
}
