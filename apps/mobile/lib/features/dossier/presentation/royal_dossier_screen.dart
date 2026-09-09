import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../ui/animated_background.dart';
import '../data/models/dossier_models.dart';
import '../providers/dossier_provider.dart';
import '../services/royal_dossier_pdf_service.dart';

class RoyalDossierScreen extends ConsumerStatefulWidget {
  const RoyalDossierScreen({super.key});

  @override
  ConsumerState<RoyalDossierScreen> createState() => _RoyalDossierScreenState();
}

class _RoyalDossierScreenState extends ConsumerState<RoyalDossierScreen> {
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    final initialPage = ref.read(dossierProvider).currentPageIndex;
    _pageController = PageController(initialPage: initialPage);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dossierState = ref.watch(dossierProvider);
    final dossier = dossierState.dossier;

    return Scaffold(
      backgroundColor: AppTheme.cosmosDark,
      body: AnimatedBackground(
        child: SafeArea(
          child: Column(
            children: [
              // 1. Top Navigation Bar
              _buildTopBar(context, dossierState),

              // 2. Imperial Reading Progress Bar
              if (dossier != null)
                _buildProgressHeader(context, dossier, dossierState),

              // 3. Document Canvas (Book PageView or Continuous Scroll)
              Expanded(
                child: dossierState.isLoading
                    ? const Center(
                        child: CircularProgressIndicator(
                          color: AppTheme.goldBright,
                        ),
                      )
                    : dossier == null
                        ? _buildErrorView(dossierState.error)
                        : dossierState.viewMode == DossierViewMode.book
                            ? _buildBookModeView(dossier, dossierState)
                            : _buildScrollModeView(dossier),
              ),

              // 4. Thumb-zone bottom navigation (for Book Mode)
              if (dossier != null &&
                  dossierState.viewMode == DossierViewMode.book)
                _buildBottomNavigationBar(context, dossier, dossierState),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context, DossierState state) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      decoration: BoxDecoration(
        color: AppTheme.cosmosSurface.withValues(alpha: 0.9),
        border: Border(
          bottom: BorderSide(
            color: AppTheme.mysticalGold.withValues(alpha: 0.3),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          // Nút Đóng (Back) 48dp
          Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(24),
              onTap: () {
                HapticFeedback.lightImpact();
                if (context.canPop()) {
                  context.pop();
                } else {
                  context.go('/');
                }
              },
              child: Container(
                width: AppTheme.touchTargetMin,
                height: AppTheme.touchTargetMin,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                      color: AppTheme.mysticalGold.withValues(alpha: 0.4)),
                  color: AppTheme.cosmosElevated,
                ),
                child: const Icon(
                  Icons.close_rounded,
                  color: AppTheme.goldBright,
                  size: 20,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Tiêu đề App Bar
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'HỒ SƠ MỆNH LÝ HOÀNG GIA',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: AppTheme.goldBright,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.1,
                        fontSize: 13,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const Text(
                  '19 Trang A4 · Ngự Thư Khâm Thiên Giám',
                  style: TextStyle(
                    color: AppTheme.mysticalTextSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),

          // Nút đổi chế độ đọc (Sách / Cuộn)
          IconButton(
            tooltip: state.viewMode == DossierViewMode.book
                ? 'Chuyển sang chế độ cuộn dọc'
                : 'Chuyển sang chế độ lật sách',
            onPressed: () {
              HapticFeedback.selectionClick();
              ref.read(dossierProvider.notifier).toggleViewMode();
            },
            icon: Icon(
              state.viewMode == DossierViewMode.book
                  ? Icons.view_day_rounded
                  : Icons.auto_stories_rounded,
              color: AppTheme.goldBright,
              size: 22,
            ),
          ),

          // Nút Tải PDF
          IconButton(
            tooltip: 'Tải PDF Hoàng Gia',
            onPressed: () => _showDownloadDialog(context),
            icon: const Icon(
              Icons.download_rounded,
              color: AppTheme.goldBright,
              size: 22,
            ),
          ),
        ],
      ),
    );
  }

  // 2. Thanh Tiến Độ Đọc Hoàng Kim
  Widget _buildProgressHeader(
    BuildContext context,
    RoyalDossierData dossier,
    DossierState state,
  ) {
    final cur = state.currentPageIndex + 1;
    final total = dossier.totalPages;
    final percent = ((cur / total) * 100).toInt();
    final currentPage = dossier.pages[state.currentPageIndex];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      decoration: BoxDecoration(
        color: AppTheme.cosmosElevated.withValues(alpha: 0.7),
        border: Border(
          bottom: BorderSide(
            color: AppTheme.mysticalGold.withValues(alpha: 0.2),
          ),
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Trang ${cur.toString().padLeft(2, '0')} / $total ($percent%) · ${currentPage.title}',
                style: const TextStyle(
                  color: AppTheme.goldBright,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
              InkWell(
                onTap: () => _showTableOfContents(context, dossier, state),
                child: const Row(
                  children: [
                    Text(
                      'Mục lục',
                      style: TextStyle(
                        color: AppTheme.mysticalGold,
                        fontSize: 11,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                    Icon(Icons.keyboard_arrow_down_rounded,
                        color: AppTheme.mysticalGold, size: 16),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          // Thanh tiến trình vàng kim
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: cur / total,
              backgroundColor: AppTheme.cosmosDark,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(AppTheme.goldBright),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorView(String? error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline_rounded,
              color: AppTheme.cinnabarCrimson, size: 48),
          const SizedBox(height: 12),
          Text(
            error ?? 'Không thể tải hồ sơ hoàng gia.',
            style: const TextStyle(color: AppTheme.mysticalTextSecondary),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => ref.read(dossierProvider.notifier).loadDossier(),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.goldBright,
              foregroundColor: AppTheme.cosmosDark,
            ),
            child: const Text('Tải lại'),
          ),
        ],
      ),
    );
  }

  // 3A. Book Mode View (PageView lật trang ngang)
  Widget _buildBookModeView(RoyalDossierData dossier, DossierState state) {
    return PageView.builder(
      controller: _pageController,
      itemCount: dossier.totalPages,
      onPageChanged: (index) {
        ref.read(dossierProvider.notifier).setPageIndex(index);
      },
      itemBuilder: (context, index) {
        final page = dossier.pages[index];
        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          child: _buildDossierPageCard(context, dossier, page),
        );
      },
    );
  }

  // 3B. Scroll Mode View (Cuộn dọc toàn bộ 19 trang)
  Widget _buildScrollModeView(RoyalDossierData dossier) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      itemCount: dossier.totalPages,
      itemBuilder: (context, index) {
        final page = dossier.pages[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 24.0),
          child: _buildDossierPageCard(context, dossier, page),
        );
      },
    );
  }

  // Widget mô phỏng trang sách cổ hoàng gia
  Widget _buildDossierPageCard(
    BuildContext context,
    RoyalDossierData dossier,
    DossierPageData page,
  ) {
    return Container(
      constraints: const BoxConstraints(minHeight: 560),
      decoration: BoxDecoration(
        color: AppTheme.cosmosSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.goldBright, width: 1.5),
        boxShadow: CelestialShadows.goldGlow,
      ),
      child: Stack(
        children: [
          // Thủy ấn bảo mật cá nhân hóa chạy nghiêng nền
          Positioned.fill(
            child: Center(
              child: Transform.rotate(
                angle: -0.35,
                child: Opacity(
                  opacity: 0.05,
                  child: Text(
                    dossier.securityWatermark,
                    style: const TextStyle(
                      color: AppTheme.goldBright,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2.0,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          ),

          // Hoa văn 4 góc mạ vàng hoàng cung
          _buildCornerOrnament(top: 6, left: 6),
          _buildCornerOrnament(top: 6, right: 6),
          _buildCornerOrnament(bottom: 6, left: 6),
          _buildCornerOrnament(bottom: 6, right: 6),

          // Nội dung chính của trang
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header Trang Sách
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppTheme.cinnabarCrimson.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                            color: AppTheme.cinnabarLight.withValues(alpha: 0.5)),
                      ),
                      child: Text(
                        page.category,
                        style: const TextStyle(
                          color: AppTheme.goldBright,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ),
                    Text(
                      'TRANG ${page.pageNumber.toString().padLeft(2, '0')}',
                      style: const TextStyle(
                        color: AppTheme.goldDeep,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Tiêu đề trang
                Text(
                  page.title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.goldBright,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        letterSpacing: 1.2,
                      ),
                  textAlign: TextAlign.center,
                ),
                if (page.subTitle != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    page.subTitle!,
                    style: const TextStyle(
                      color: AppTheme.mysticalTextSecondary,
                      fontSize: 11,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 14),

                Divider(
                  color: AppTheme.mysticalGold.withValues(alpha: 0.3),
                  height: 1,
                ),
                const SizedBox(height: 16),

                // Nếu là Trang Bìa (Cover)
                if (page.isCover)
                  _buildCoverSpecialContent(dossier, page)
                else ...[
                  // Đoạn văn mở đầu với Drop Cap dát vàng vương giả
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        margin: const EdgeInsets.only(right: 12, bottom: 4),
                        decoration: BoxDecoration(
                          gradient: CelestialGradients.imperialGold,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: CelestialShadows.goldGlow,
                        ),
                        child: Center(
                          child: Text(
                            page.dropCapLetter,
                            style: const TextStyle(
                              color: AppTheme.cosmosDark,
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          page.content,
                          style: const TextStyle(
                            color: AppTheme.mysticalText,
                            fontSize: 13,
                            height: 1.6,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],

                // Khối thuộc tính then chốt (Key Attributes)
                if (page.keyAttributes != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.cosmosElevated.withValues(alpha: 0.8),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: AppTheme.mysticalGold.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Column(
                      children: page.keyAttributes!.entries.map((entry) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${entry.key}: ',
                                style: const TextStyle(
                                  color: AppTheme.mysticalGold,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  entry.value,
                                  style: const TextStyle(
                                    color: AppTheme.mysticalText,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],

                // Trang 19: Con dấu triện son 3D ngự bút
                if (page.hasSeal) ...[
                  const SizedBox(height: 24),
                  Center(
                    child: Container(
                      width: 110,
                      height: 110,
                      decoration: BoxDecoration(
                        color: AppTheme.cinnabarCrimson,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.goldBright, width: 3),
                        boxShadow: CelestialShadows.cinnabarGlow,
                      ),
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.verified_rounded,
                              color: AppTheme.goldBright, size: 28),
                          SizedBox(height: 4),
                          Text(
                            'KHÂM THIÊN',
                            style: TextStyle(
                              color: AppTheme.goldBright,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.0,
                            ),
                          ),
                          Text(
                            'NGỰ BÚT',
                            style: TextStyle(
                              color: AppTheme.goldBright,
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Center(
                    child: Text(
                      'Bảo chứng tâm linh tối cao · ViOS',
                      style: TextStyle(
                        color: AppTheme.mysticalGold,
                        fontSize: 10,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                ],

                const SizedBox(height: 24),
                // Footer số trang sách cổ
                Center(
                  child: Text(
                    '— Trang ${page.pageNumber.toString().padLeft(2, '0')} / ${dossier.totalPages} —',
                    style: const TextStyle(
                      color: AppTheme.mysticalTextSecondary,
                      fontSize: 10,
                      letterSpacing: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Nội dung đặc biệt của Trang Bìa
  Widget _buildCoverSpecialContent(
    RoyalDossierData dossier,
    DossierPageData page,
  ) {
    return Column(
      children: [
        const SizedBox(height: 20),
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: CelestialGradients.imperialGold,
            boxShadow: CelestialShadows.goldGlow,
          ),
          child: const Center(
            child: Icon(Icons.auto_awesome, color: AppTheme.cosmosDark, size: 36),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          dossier.clientName.toUpperCase(),
          style: const TextStyle(
            color: AppTheme.goldBright,
            fontSize: 22,
            fontWeight: FontWeight.bold,
            letterSpacing: 2.0,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          dossier.elementAndDestiny,
          style: const TextStyle(
            color: AppTheme.mysticalGold,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '${dossier.birthInfo}\n${dossier.lunarBirthInfo}',
          style: const TextStyle(
            color: AppTheme.mysticalTextSecondary,
            fontSize: 11,
            height: 1.4,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 18),
        Text(
          page.content,
          style: const TextStyle(
            color: AppTheme.mysticalText,
            fontSize: 12,
            height: 1.5,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildCornerOrnament({
    double? top,
    double? bottom,
    double? left,
    double? right,
  }) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: Container(
        width: 14,
        height: 14,
        decoration: BoxDecoration(
          border: Border(
            top: top != null
                ? const BorderSide(color: AppTheme.goldBright, width: 2)
                : BorderSide.none,
            bottom: bottom != null
                ? const BorderSide(color: AppTheme.goldBright, width: 2)
                : BorderSide.none,
            left: left != null
                ? const BorderSide(color: AppTheme.goldBright, width: 2)
                : BorderSide.none,
            right: right != null
                ? const BorderSide(color: AppTheme.goldBright, width: 2)
                : BorderSide.none,
          ),
        ),
      ),
    );
  }

  // 4. Thanh điều hướng lật trang Thumb-zone 48dp ở đáy màn hình
  Widget _buildBottomNavigationBar(
    BuildContext context,
    RoyalDossierData dossier,
    DossierState state,
  ) {
    final cur = state.currentPageIndex;
    final total = dossier.totalPages;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      decoration: BoxDecoration(
        color: AppTheme.cosmosSurface.withValues(alpha: 0.95),
        border: Border(
          top: BorderSide(
            color: AppTheme.mysticalGold.withValues(alpha: 0.3),
            width: 1,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Nút Trang Trước 48dp
          ElevatedButton.icon(
            onPressed: cur > 0
                ? () {
                    HapticFeedback.lightImpact();
                    _pageController.previousPage(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                    );
                  }
                : null,
            icon: const Icon(Icons.arrow_back_ios_rounded, size: 14),
            label: const Text('TRƯỚC'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.cosmosElevated,
              foregroundColor: AppTheme.goldBright,
              disabledForegroundColor:
                  AppTheme.mysticalTextSecondary.withValues(alpha: 0.3),
              minimumSize: const Size(90, AppTheme.touchTargetMin),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(
                  color: cur > 0
                      ? AppTheme.mysticalGold.withValues(alpha: 0.5)
                      : Colors.transparent,
                ),
              ),
            ),
          ),

          // Nút Mục Lục 48dp
          InkWell(
            onTap: () => _showTableOfContents(context, dossier, state),
            child: Container(
              height: AppTheme.touchTargetMin,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: AppTheme.cosmosElevated,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: AppTheme.mysticalGold.withValues(alpha: 0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.menu_book_rounded,
                      color: AppTheme.goldBright, size: 18),
                  SizedBox(width: 6),
                  Text(
                    '19 TRANG',
                    style: TextStyle(
                      color: AppTheme.goldBright,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Nút Trang Sau 48dp
          ElevatedButton.icon(
            onPressed: cur < total - 1
                ? () {
                    HapticFeedback.lightImpact();
                    _pageController.nextPage(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                    );
                  }
                : null,
            icon: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
            label: const Text('TIẾP'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.cosmosElevated,
              foregroundColor: AppTheme.goldBright,
              disabledForegroundColor:
                  AppTheme.mysticalTextSecondary.withValues(alpha: 0.3),
              minimumSize: const Size(90, AppTheme.touchTargetMin),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(
                  color: cur < total - 1
                      ? AppTheme.mysticalGold.withValues(alpha: 0.5)
                      : Colors.transparent,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Modal Bottom Sheet Mục Lục 19 Trang
  void _showTableOfContents(
    BuildContext context,
    RoyalDossierData dossier,
    DossierState state,
  ) {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.cosmosSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        side: BorderSide(color: AppTheme.goldBright),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: AppTheme.mysticalGold.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: Text(
                  'MỤC LỤC HỒ SƠ 19 TRANG A4',
                  style: TextStyle(
                    color: AppTheme.goldBright,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.1,
                  ),
                ),
              ),
              const Divider(color: AppTheme.goldDeep, height: 1),
              Expanded(
                child: ListView.builder(
                  itemCount: dossier.totalPages,
                  itemBuilder: (context, index) {
                    final p = dossier.pages[index];
                    final isCurrent = index == state.currentPageIndex;
                    return ListTile(
                      dense: true,
                      tileColor: isCurrent
                          ? AppTheme.goldBright.withValues(alpha: 0.15)
                          : null,
                      leading: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isCurrent
                              ? AppTheme.goldBright
                              : AppTheme.cosmosElevated,
                          border: Border.all(
                              color: AppTheme.mysticalGold.withValues(alpha: 0.5)),
                        ),
                        child: Center(
                          child: Text(
                            p.pageNumber.toString().padLeft(2, '0'),
                            style: TextStyle(
                              color: isCurrent
                                  ? AppTheme.cosmosDark
                                  : AppTheme.goldBright,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      title: Text(
                        p.title,
                        style: TextStyle(
                          color: isCurrent
                              ? AppTheme.goldBright
                              : AppTheme.mysticalText,
                          fontWeight:
                              isCurrent ? FontWeight.bold : FontWeight.w500,
                          fontSize: 13,
                        ),
                      ),
                      subtitle: Text(
                        p.category,
                        style: const TextStyle(
                          color: AppTheme.mysticalTextSecondary,
                          fontSize: 10,
                        ),
                      ),
                      trailing: isCurrent
                          ? const Icon(Icons.check_circle_rounded,
                              color: AppTheme.goldBright, size: 18)
                          : null,
                      onTap: () {
                        Navigator.of(ctx).pop();
                        ref.read(dossierProvider.notifier).setPageIndex(index);
                        if (state.viewMode == DossierViewMode.book) {
                          _pageController.jumpToPage(index);
                        }
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showDownloadDialog(BuildContext context) {
    HapticFeedback.mediumImpact();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cosmosSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
              color: AppTheme.mysticalGold.withValues(alpha: 0.4)),
        ),
        title: const Row(
          children: [
            Icon(Icons.download_rounded, color: AppTheme.goldBright),
            SizedBox(width: 8),
            Text(
              'Tải Hồ Sơ PDF A4',
              style: TextStyle(color: AppTheme.goldBright, fontSize: 16),
            ),
          ],
        ),
        content: const Text(
          'Xuất trọn bộ 19 trang Hồ Sơ Mệnh Lý Hoàng Gia (chuẩn A4 Vector) có con dấu Khâm Thiên Giám và Thủy Ấn bảo mật?',
          style: TextStyle(color: AppTheme.mysticalText, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('ĐÓNG',
                style: TextStyle(color: AppTheme.mysticalTextSecondary)),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  backgroundColor: AppTheme.cosmosElevated,
                  content: Text(
                    '👑 Đang kết xuất tệp PDF 19 trang chất lượng cao...',
                    style: TextStyle(color: AppTheme.goldBright),
                  ),
                ),
              );
              final currentDossier = ref.read(dossierProvider).dossier;
              if (currentDossier != null) {
                RoyalDossierPdfService.exportAndShare(context, currentDossier);
              }
            },
            icon: const Icon(Icons.picture_as_pdf_rounded, size: 16),
            label: const Text('TẢI PDF'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.goldBright,
              foregroundColor: AppTheme.cosmosDark,
            ),
          ),
        ],
      ),
    );
  }
}
