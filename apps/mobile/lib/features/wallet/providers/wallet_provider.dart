import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_provider.dart';

final walletBalanceProvider = FutureProvider.autoDispose<int>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  return apiClient.getWalletBalance();
});
