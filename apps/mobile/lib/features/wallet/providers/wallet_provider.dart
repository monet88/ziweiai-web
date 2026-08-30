import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_provider.dart';
import '../data/models/transaction_model.dart';

final walletBalanceProvider = FutureProvider.autoDispose<int>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  return apiClient.getWalletBalance();
});

final walletTransactionsProvider = FutureProvider.autoDispose<List<TransactionModel>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.getWalletTransactions();
  final data = response['data'] as List<dynamic>;
  return data.map((json) => TransactionModel.fromJson(json as Map<String, dynamic>)).toList();
});
