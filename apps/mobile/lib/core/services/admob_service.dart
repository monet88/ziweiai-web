import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../env/env.dart';

final admobServiceProvider = Provider<AdMobService>((ref) {
  final service = AdMobService();
  service.loadRewardedAd();
  return service;
});

class AdMobService {
  RewardedAd? _rewardedAd;
  bool _isAdLoading = false;
  int _retryAttempt = 0;

  bool get isAdReady => _rewardedAd != null;
  bool get isAdLoading => _isAdLoading;

  String get rewardedAdUnitId {
    if (Platform.isAndroid) {
      return Env.admobRewardedIdAndroid;
    } else if (Platform.isIOS) {
      return Env.admobRewardedIdIos;
    }
    return Env.admobRewardedIdAndroid;
  }

  /// Preload Rewarded Video Ad
  Future<void> loadRewardedAd({
    VoidCallback? onLoaded,
    Function(String error)? onFailed,
  }) async {
    if (_isAdLoading || _rewardedAd != null) return;
    _isAdLoading = true;

    try {
      await RewardedAd.load(
        adUnitId: rewardedAdUnitId,
        request: const AdRequest(),
        rewardedAdLoadCallback: RewardedAdLoadCallback(
          onAdLoaded: (RewardedAd ad) {
            debugPrint('[AdMob] RewardedAd loaded successfully.');
            _rewardedAd = ad;
            _isAdLoading = false;
            _retryAttempt = 0;
            onLoaded?.call();
          },
          onAdFailedToLoad: (LoadAdError error) {
            debugPrint('[AdMob] RewardedAd failed to load: $error');
            _rewardedAd = null;
            _isAdLoading = false;
            _retryAttempt++;
            onFailed?.call(error.message);

            // Retry with exponential backoff if failed (max 3 retries)
            if (_retryAttempt < 3) {
              final delay = Duration(seconds: 1 << _retryAttempt);
              Future.delayed(delay, () => loadRewardedAd());
            }
          },
        ),
      );
    } catch (e) {
      debugPrint('[AdMob] Error in loadRewardedAd: $e');
      _isAdLoading = false;
      onFailed?.call(e.toString());
    }
  }

  /// Show Rewarded Video Ad
  Future<bool> showRewardedAd({
    required Function(RewardItem reward) onUserEarnedReward,
    VoidCallback? onAdDismissed,
    Function(String error)? onAdFailedToShow,
  }) async {
    if (_rewardedAd == null) {
      debugPrint('[AdMob] RewardedAd is not ready, attempting to load...');
      await loadRewardedAd(
        onLoaded: () {
          showRewardedAd(
            onUserEarnedReward: onUserEarnedReward,
            onAdDismissed: onAdDismissed,
            onAdFailedToShow: onAdFailedToShow,
          );
        },
        onFailed: (err) => onAdFailedToShow?.call(err),
      );
      return false;
    }

    bool earnedReward = false;

    _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdShowedFullScreenContent: (RewardedAd ad) {
        debugPrint('[AdMob] Ad showed fullscreen content.');
      },
      onAdDismissedFullScreenContent: (RewardedAd ad) {
        debugPrint('[AdMob] Ad dismissed fullscreen content.');
        ad.dispose();
        _rewardedAd = null;
        onAdDismissed?.call();
        // Automatically preload the next ad for seamless UX
        loadRewardedAd();
      },
      onAdFailedToShowFullScreenContent: (RewardedAd ad, AdError error) {
        debugPrint('[AdMob] Ad failed to show fullscreen content: $error');
        ad.dispose();
        _rewardedAd = null;
        onAdFailedToShow?.call(error.message);
        loadRewardedAd();
      },
    );

    await _rewardedAd!.show(
      onUserEarnedReward: (AdWithoutView ad, RewardItem reward) {
        debugPrint('[AdMob] User earned reward: ${reward.amount} ${reward.type}');
        earnedReward = true;
        onUserEarnedReward(reward);
      },
    );

    return earnedReward;
  }

  void dispose() {
    _rewardedAd?.dispose();
    _rewardedAd = null;
  }
}
