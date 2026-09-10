import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_provider.dart';
import '../data/models/transaction_model.dart';

/// Provider lấy số dư ví XU thời gian thực với graceful fallback khi offline / lỗi mạng
final walletBalanceProvider = FutureProvider.autoDispose<int>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    return await apiClient.getWalletBalance();
  } catch (e) {
    // Trả về 0 nếu chưa đăng nhập hoặc mạng ngoại tuyến thay vì crash UI
    return 0;
  }
});

/// Provider lấy lịch sử giao dịch ví XU
final walletTransactionsProvider = FutureProvider.autoDispose<List<TransactionModel>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.getWalletTransactions();
    final data = response['data'] as List<dynamic>? ?? [];
    return data.map((json) => TransactionModel.fromJson(json as Map<String, dynamic>)).toList();
  } catch (e) {
    return [];
  }
});

/// Helper class quản lý thao tác với ví XU
class WalletController {
  final Ref _ref;
  WalletController(this._ref);

  /// Làm tươi số dư ví
  void refresh() {
    _ref.invalidate(walletBalanceProvider);
    _ref.invalidate(walletTransactionsProvider);
  }

  /// Nhận XU từ quảng cáo thưởng
  Future<bool> claimReward() async {
    try {
      final apiClient = _ref.read(apiClientProvider);
      await apiClient.claimAdReward();
      refresh();
      return true;
    } catch (_) {
      return false;
    }
  }
}

final walletControllerProvider = Provider.autoDispose<WalletController>((ref) {
  return WalletController(ref);
});
