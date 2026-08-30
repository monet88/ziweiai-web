import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/core/env/env.dart';
import 'package:ziweiai_mobile/core/services/admob_service.dart';

void main() {
  group('AdMobService & Env Config Tests', () {

    test('Env fallback to Google Test Ad IDs when env is empty', () {
      expect(Env.admobRewardedIdAndroid, contains('ca-app-pub-3940256099942544'));
      expect(Env.admobRewardedIdIos, contains('ca-app-pub-3940256099942544'));
    });

    test('AdMobService initialization and default states', () {
      final service = AdMobService();
      expect(service.isAdReady, false);
      expect(service.isAdLoading, false);
      expect(service.rewardedAdUnitId, isNotEmpty);
      service.dispose();
    });
  });
}

