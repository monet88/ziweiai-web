import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/paywall_provider.dart';
import 'premium_paywall_sheet.dart';

class GlobalPaywallWrapper extends ConsumerStatefulWidget {
  final Widget child;

  const GlobalPaywallWrapper({super.key, required this.child});

  @override
  ConsumerState<GlobalPaywallWrapper> createState() => _GlobalPaywallWrapperState();
}

class _GlobalPaywallWrapperState extends ConsumerState<GlobalPaywallWrapper> {
  bool _isShowing = false;

  @override
  Widget build(BuildContext context) {
    ref.listen<PaywallState>(paywallProvider, (previous, next) {
      if (next.isVisible && !_isShowing) {
        _isShowing = true;
        showModalBottomSheet(
          context: context,
          backgroundColor: Colors.transparent,
          isScrollControlled: true,
          builder: (context) => PremiumPaywallSheet(
            cost: next.cost,
            featureName: next.featureName,
          ),
        ).then((_) {
          _isShowing = false;
          ref.read(paywallProvider.notifier).hide();
        });
      }
    });

    return widget.child;
  }
}
