import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../presentation/widgets/premium_paywall_sheet.dart';

class MonetizationGuard {
  /// Xử lý lỗi từ các tính năng tốn XU. Gọi trong `ref.listen` khi `next.hasError` là true.
  /// Trả về `true` nếu lỗi đã được xử lý bằng Paywall (402/403).
  static bool handlePaidActionError(
    BuildContext context, 
    Object error, {
    required int cost,
    required String featureName,
  }) {
    if (error is DioException && (error.response?.statusCode == 402 || error.response?.statusCode == 403)) {
      if (context.mounted) {
        showModalBottomSheet(
          context: context,
          backgroundColor: Colors.transparent,
          isScrollControlled: true,
          builder: (context) => PremiumPaywallSheet(
            cost: cost,
            featureName: featureName,
          ),
        );
      }
      return true; // Lỗi hết XU đã được xử lý
    }
    return false; // Không phải lỗi hết XU
  }
}
