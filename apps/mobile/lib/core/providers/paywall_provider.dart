import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PaywallState {
  final bool isVisible;
  final int cost;
  final String featureName;
  final VoidCallback? onSuccess;

  PaywallState({
    this.isVisible = false,
    this.cost = 0,
    this.featureName = '',
    this.onSuccess,
  });

  PaywallState copyWith({
    bool? isVisible,
    int? cost,
    String? featureName,
    VoidCallback? onSuccess,
  }) {
    return PaywallState(
      isVisible: isVisible ?? this.isVisible,
      cost: cost ?? this.cost,
      featureName: featureName ?? this.featureName,
      onSuccess: onSuccess ?? this.onSuccess,
    );
  }
}

class PaywallNotifier extends Notifier<PaywallState> {
  @override
  PaywallState build() {
    return PaywallState();
  }

  void show({required int cost, required String featureName, VoidCallback? onSuccess}) {
    state = state.copyWith(
      isVisible: true,
      cost: cost,
      featureName: featureName,
      onSuccess: onSuccess,
    );
  }

  void hide() {
    state = state.copyWith(isVisible: false, onSuccess: null);
  }
}

final paywallProvider = NotifierProvider<PaywallNotifier, PaywallState>(() {
  return PaywallNotifier();
});
