import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_provider.dart';
import '../../wallet/providers/wallet_provider.dart';
import '../data/models/dossier_models.dart';
import '../data/repositories/dossier_repository.dart';

final dossierRepositoryProvider = Provider<DossierRepository>((ref) {
  return DossierRepository();
});

class DossierState {
  final bool isLoading;
  final RoyalDossierData? dossier;
  final int currentPageIndex;
  final DossierViewMode viewMode;
  final String? error;
  final bool isUnlocked;
  final int unlockFee;

  const DossierState({
    this.isLoading = false,
    this.dossier,
    this.currentPageIndex = 0,
    this.viewMode = DossierViewMode.book,
    this.error,
    this.isUnlocked = true,
    this.unlockFee = 50,
  });

  DossierState copyWith({
    bool? isLoading,
    RoyalDossierData? dossier,
    int? currentPageIndex,
    DossierViewMode? viewMode,
    String? error,
    bool? isUnlocked,
    int? unlockFee,
  }) {
    return DossierState(
      isLoading: isLoading ?? this.isLoading,
      dossier: dossier ?? this.dossier,
      currentPageIndex: currentPageIndex ?? this.currentPageIndex,
      viewMode: viewMode ?? this.viewMode,
      error: error,
      isUnlocked: isUnlocked ?? this.isUnlocked,
      unlockFee: unlockFee ?? this.unlockFee,
    );
  }
}

class DossierNotifier extends Notifier<DossierState> {
  bool _disposed = false;

  @override
  DossierState build() {
    _disposed = false;
    ref.onDispose(() {
      _disposed = true;
    });
    Future.microtask(() => loadDossier());
    return const DossierState(isLoading: true);
  }

  Future<void> loadDossier({String? chartId}) async {
    if (_disposed) return;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final repository = ref.read(dossierRepositoryProvider);
      final data = await repository.getRoyalDossier(chartId: chartId);
      if (_disposed) return;
      
      // Nếu có chartId, kiểm tra trạng thái unlock thật từ API
      if (chartId != null) {
        try {
          final apiClient = ref.read(apiClientProvider);
          final status = await apiClient.getDossierStatus(chartId);
          if (_disposed) return;
          state = state.copyWith(
            isLoading: false,
            dossier: data,
            currentPageIndex: 0,
            isUnlocked: status['isUnlocked'] as bool? ?? true,
            unlockFee: status['feeXu'] as int? ?? 50,
          );
          return;
        } catch (_) {
          // Graceful fallback khi offline
        }
      }

      if (_disposed) return;
      state = state.copyWith(
        isLoading: false,
        dossier: data,
        currentPageIndex: 0,
      );
    } catch (e) {
      if (_disposed) return;
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Mở khóa hồ sơ 50 XU từ API và cập nhật số dư ví
  Future<bool> unlockDossier(String chartId) async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final result = await apiClient.unlockDossier(chartId);
      
      // Cập nhật số dư ví
      ref.invalidate(walletBalanceProvider);

      if (result['success'] == true || result['alreadyUnlocked'] == true) {
        state = state.copyWith(isUnlocked: true);
        return true;
      }
      return false;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  void setPageIndex(int index) {
    final total = state.dossier?.totalPages ?? 19;
    final clamped = index.clamp(0, total - 1);
    state = state.copyWith(currentPageIndex: clamped);
  }

  void nextPage() {
    setPageIndex(state.currentPageIndex + 1);
  }

  void previousPage() {
    setPageIndex(state.currentPageIndex - 1);
  }

  void toggleViewMode() {
    final newMode = state.viewMode == DossierViewMode.book
        ? DossierViewMode.scroll
        : DossierViewMode.book;
    state = state.copyWith(viewMode: newMode);
  }
}

final dossierProvider =
    NotifierProvider<DossierNotifier, DossierState>(DossierNotifier.new);
