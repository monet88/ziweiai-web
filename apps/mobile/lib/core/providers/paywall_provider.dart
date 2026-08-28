import 'package:flutter_riverpod/flutter_riverpod.dart';

class PaywallState {
  final bool isVisible;
  final int cost;
  final String featureName;

  PaywallState({
    this.isVisible = false,
    this.cost = 0,
    this.featureName = '',
  });

  PaywallState copyWith({
    bool? isVisible,
    int? cost,
    String? featureName,
  }) {
    return PaywallState(
      isVisible: isVisible ?? this.isVisible,
      cost: cost ?? this.cost,
      featureName: featureName ?? this.featureName,
    );
  }
}

class PaywallNotifier extends Notifier<PaywallState> {
  @override
  PaywallState build() {
    return PaywallState();
  }

  void show({required int cost, required String featureName}) {
    state = state.copyWith(isVisible: true, cost: cost, featureName: featureName);
  }

  void hide() {
    state = state.copyWith(isVisible: false);
  }
}

final paywallProvider = NotifierProvider<PaywallNotifier, PaywallState>(() {
  return PaywallNotifier();
});
