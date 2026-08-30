import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:purchases_ui_flutter/purchases_ui_flutter.dart';

/// Các định danh Entitlement được hỗ trợ trong hệ thống Tử Vi Toàn Tập
class SubscriptionEntitlements {
  /// Entitlement chính theo cấu hình RevenueCat
  static const String proPrimary = 'tử_vi_toàn_tập_pro';
  
  /// Entitlement alias không dấu phòng hờ normalize
  static const String proAscii = 'tu_vi_toan_tap_pro';
  
  /// Entitlement rút gọn
  static const String proShort = 'pro';

  static const List<String> allProEntitlements = [
    proPrimary,
    proAscii,
    proShort,
  ];
}

/// Các định danh Package / Product Identifier
class SubscriptionProducts {
  static const String monthly = 'monthly';
  static const String yearly = 'yearly';
  static const String lifetime = 'lifetime';
}

/// Trạng thái Subscription toàn cục của người dùng
class SubscriptionState {
  final bool isInitialized;
  final bool isPro;
  final bool isLoading;
  final String? errorMessage;
  final CustomerInfo? customerInfo;
  final Offerings? offerings;

  const SubscriptionState({
    this.isInitialized = false,
    this.isPro = false,
    this.isLoading = false,
    this.errorMessage,
    this.customerInfo,
    this.offerings,
  });

  SubscriptionState copyWith({
    bool? isInitialized,
    bool? isPro,
    bool? isLoading,
    String? errorMessage,
    CustomerInfo? customerInfo,
    Offerings? offerings,
  }) {
    return SubscriptionState(
      isInitialized: isInitialized ?? this.isInitialized,
      isPro: isPro ?? this.isPro,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      customerInfo: customerInfo ?? this.customerInfo,
      offerings: offerings ?? this.offerings,
    );
  }

  /// Danh sách các gói đăng ký VIP Pro từ Offering hiện tại
  List<Package> get availablePackages =>
      offerings?.current?.availablePackages ?? [];

  /// Gói tháng (Monthly)
  Package? get monthlyPackage => offerings?.current?.monthly;

  /// Gói năm (Annual/Yearly)
  Package? get annualPackage => offerings?.current?.annual;

  /// Gói trọn đời (Lifetime)
  Package? get lifetimePackage => offerings?.current?.lifetime;
}

class SubscriptionNotifier extends Notifier<SubscriptionState> {
  @override
  SubscriptionState build() {
    _initListener();
    _fetchInitialData();
    return const SubscriptionState(isLoading: true);
  }

  Future<void> _initListener() async {
    try {
      final isConfigured = await Purchases.isConfigured;
      if (isConfigured) {
        Purchases.addCustomerInfoUpdateListener((customerInfo) {
          _updateCustomerInfo(customerInfo);
        });
      }
    } catch (e) {
      debugPrint('[Subscription] Error attaching listener: $e');
    }
  }

  Future<void> _fetchInitialData() async {
    try {
      final isConfigured = await Purchases.isConfigured;
      if (!isConfigured) {
        state = state.copyWith(
          isInitialized: true,
          isLoading: false,
          isPro: false,
        );
        return;
      }

      final customerInfo = await Purchases.getCustomerInfo();
      Offerings? offerings;
      try {
        offerings = await Purchases.getOfferings();
      } catch (e) {
        debugPrint('[Subscription] Error fetching offerings: $e');
      }

      final isPro = _checkIsPro(customerInfo);

      state = state.copyWith(
        isInitialized: true,
        isLoading: false,
        isPro: isPro,
        customerInfo: customerInfo,
        offerings: offerings,
      );
    } catch (e) {
      debugPrint('[Subscription] Error fetching customer info: $e');
      state = state.copyWith(
        isInitialized: true,
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  bool _checkIsPro(CustomerInfo? customerInfo) {
    if (customerInfo == null) return false;
    for (final entitlement in SubscriptionEntitlements.allProEntitlements) {
      if (customerInfo.entitlements.all[entitlement]?.isActive == true) {
        return true;
      }
    }
    return false;
  }

  void _updateCustomerInfo(CustomerInfo customerInfo) {
    final isPro = _checkIsPro(customerInfo);
    state = state.copyWith(
      customerInfo: customerInfo,
      isPro: isPro,
    );
  }

  /// Tải lại thông tin CustomerInfo và Offerings
  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    await _fetchInitialData();
  }

  /// Mua một gói Subscription hoặc Lifetime Package
  Future<bool> purchasePackage(Package package) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final isConfigured = await Purchases.isConfigured;
      if (!isConfigured) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Hệ thống thanh toán đang chuẩn bị cho bản phát hành chính thức.',
        );
        return false;
      }

      final purchaseResult = await Purchases.purchase(
        PurchaseParams.package(package),
      );
      _updateCustomerInfo(purchaseResult.customerInfo);
      state = state.copyWith(isLoading: false);
      return _checkIsPro(purchaseResult.customerInfo);
    } on PurchasesErrorCode catch (e) {
      final message = _mapPurchasesError(e);
      state = state.copyWith(isLoading: false, errorMessage: message);
      return false;
    } catch (e) {
      final isUserCancelled =
          e.toString().contains('canceled') || e.toString().contains('cancelled');
      state = state.copyWith(
        isLoading: false,
        errorMessage: isUserCancelled ? null : 'Thanh toán thất bại: $e',
      );
      return false;
    }
  }

  /// Khôi phục các gói đã mua (Restore Purchases)
  Future<bool> restorePurchases() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final isConfigured = await Purchases.isConfigured;
      if (!isConfigured) {
        state = state.copyWith(isLoading: false);
        return false;
      }

      final customerInfo = await Purchases.restorePurchases();
      _updateCustomerInfo(customerInfo);
      final isPro = _checkIsPro(customerInfo);
      state = state.copyWith(isLoading: false);
      return isPro;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Khôi phục thanh toán thất bại: $e',
      );
      return false;
    }
  }

  /// Hiển thị Native RevenueCat Paywall UI
  Future<PaywallResult> presentPaywall({Offering? offering}) async {
    try {
      final isConfigured = await Purchases.isConfigured;
      if (!isConfigured) {
        debugPrint('[Subscription] Purchases is not configured.');
        return PaywallResult.notPresented;
      }

      final paywallResult = await RevenueCatUI.presentPaywall(
        offering: offering,
      );
      await refresh();
      return paywallResult;
    } catch (e) {
      debugPrint('[Subscription] Error presenting paywall: $e');
      return PaywallResult.error;
    }
  }

  /// Hiển thị Paywall chỉ khi người dùng chưa có Entitlement `tử_vi_toàn_tập_pro`
  Future<PaywallResult> presentPaywallIfNeeded({
    String requiredEntitlementIdentifier = SubscriptionEntitlements.proPrimary,
  }) async {
    try {
      final isConfigured = await Purchases.isConfigured;
      if (!isConfigured) {
        debugPrint('[Subscription] Purchases is not configured.');
        return PaywallResult.notPresented;
      }

      final paywallResult = await RevenueCatUI.presentPaywallIfNeeded(
        requiredEntitlementIdentifier,
      );
      await refresh();
      return paywallResult;
    } catch (e) {
      debugPrint('[Subscription] Error presenting paywall if needed: $e');
      return PaywallResult.error;
    }
  }

  /// Mở RevenueCat Customer Center để người dùng tự quản lý subscription, hoàn tiền, đổi gói
  Future<void> presentCustomerCenter() async {
    try {
      final isConfigured = await Purchases.isConfigured;
      if (!isConfigured) {
        debugPrint('[Subscription] Purchases is not configured.');
        return;
      }

      await RevenueCatUI.presentCustomerCenter();
      await refresh();
    } catch (e) {
      debugPrint('[Subscription] Error presenting customer center: $e');
    }
  }

  String _mapPurchasesError(PurchasesErrorCode code) {
    switch (code) {
      case PurchasesErrorCode.purchaseCancelledError:
        return 'Giao dịch đã được huỷ bởi người dùng.';
      case PurchasesErrorCode.paymentPendingError:
        return 'Giao dịch đang chờ ngân hàng xử lý.';
      case PurchasesErrorCode.productAlreadyPurchasedError:
        return 'Bạn đã sở hữu gói này trước đó.';
      case PurchasesErrorCode.networkError:
        return 'Lỗi kết nối mạng. Vui lòng thử lại.';
      default:
        return 'Giao dịch không thành công ($code).';
    }
  }
}

/// Provider chính quản lý toàn bộ Subscription State
final subscriptionProvider =
    NotifierProvider<SubscriptionNotifier, SubscriptionState>(() {
  return SubscriptionNotifier();
});

/// Selector kiểm tra người dùng có phải là VIP Pro không
final isProUserProvider = Provider<bool>((ref) {
  return ref.watch(subscriptionProvider).isPro;
});
