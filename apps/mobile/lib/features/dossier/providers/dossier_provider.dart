import 'package:flutter_riverpod/flutter_riverpod.dart';
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

  const DossierState({
    this.isLoading = false,
    this.dossier,
    this.currentPageIndex = 0,
    this.viewMode = DossierViewMode.book,
    this.error,
  });

  DossierState copyWith({
    bool? isLoading,
    RoyalDossierData? dossier,
    int? currentPageIndex,
    DossierViewMode? viewMode,
    String? error,
  }) {
    return DossierState(
      isLoading: isLoading ?? this.isLoading,
      dossier: dossier ?? this.dossier,
      currentPageIndex: currentPageIndex ?? this.currentPageIndex,
      viewMode: viewMode ?? this.viewMode,
      error: error,
    );
  }
}

class DossierNotifier extends Notifier<DossierState> {
  @override
  DossierState build() {
    Future.microtask(() => loadDossier());
    return const DossierState(isLoading: true);
  }

  Future<void> loadDossier({String? chartId}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final repository = ref.read(dossierRepositoryProvider);
      final data = await repository.getRoyalDossier(chartId: chartId);
      state = state.copyWith(
        isLoading: false,
        dossier: data,
        currentPageIndex: 0,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
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
