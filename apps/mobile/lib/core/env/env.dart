import 'package:flutter_dotenv/flutter_dotenv.dart';

class Env {
  static Future<void> init() async {
    await dotenv.load(fileName: ".env");
  }

  static String _get(String key) {
    if (!dotenv.isInitialized) return '';
    return dotenv.env[key] ?? '';
  }

  static String get supabaseUrl => _get('SUPABASE_URL');
  static String get supabaseAnonKey => _get('SUPABASE_ANON_KEY');
  static String get apiUrl => _get('API_URL');
  static const String _defaultRevenueCatTestKey = 'test_QfXsSSzoZikwOkSepsWCLSUiUSF';

  static String get revenuecatApiKeyAppStore {
    final key = _get('REVENUECAT_API_KEY_APP_STORE').isNotEmpty
        ? _get('REVENUECAT_API_KEY_APP_STORE')
        : _get('REVENUECAT_APPLE_KEY');
    return key.isNotEmpty ? key : _defaultRevenueCatTestKey;
  }

  static String get revenuecatApiKeyPlayStore {
    final key = _get('REVENUECAT_API_KEY_PLAY_STORE').isNotEmpty
        ? _get('REVENUECAT_API_KEY_PLAY_STORE')
        : _get('REVENUECAT_GOOGLE_KEY');
    return key.isNotEmpty ? key : _defaultRevenueCatTestKey;
  }

  // AdMob Rewarded Video Unit IDs (defaults to Google Test Ad IDs)
  static const String _defaultAdMobRewardedAndroid = 'ca-app-pub-3940256099942544/5224354917';
  static const String _defaultAdMobRewardedIos = 'ca-app-pub-3940256099942544/1712485313';

  static String get admobRewardedIdAndroid {
    final key = _get('ADMOB_REWARDED_ID_ANDROID');
    return key.isNotEmpty ? key : _defaultAdMobRewardedAndroid;
  }

  static String get admobRewardedIdIos {
    final key = _get('ADMOB_REWARDED_ID_IOS');
    return key.isNotEmpty ? key : _defaultAdMobRewardedIos;
  }
}


