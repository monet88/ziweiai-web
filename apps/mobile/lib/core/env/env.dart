import 'package:flutter_dotenv/flutter_dotenv.dart';

class Env {
  static Future<void> init() async {
    await dotenv.load(fileName: ".env");
  }

  static String get supabaseUrl => dotenv.env['SUPABASE_URL'] ?? '';
  static String get supabaseAnonKey => dotenv.env['SUPABASE_ANON_KEY'] ?? '';
  static String get apiUrl => dotenv.env['API_URL'] ?? '';
  static const String _defaultRevenueCatTestKey = 'test_QfXsSSzoZikwOkSepsWCLSUiUSF';

  static String get revenuecatApiKeyAppStore {
    final key = dotenv.env['REVENUECAT_API_KEY_APP_STORE'] ?? dotenv.env['REVENUECAT_APPLE_KEY'] ?? '';
    return key.isNotEmpty ? key : _defaultRevenueCatTestKey;
  }

  static String get revenuecatApiKeyPlayStore {
    final key = dotenv.env['REVENUECAT_API_KEY_PLAY_STORE'] ?? dotenv.env['REVENUECAT_GOOGLE_KEY'] ?? '';
    return key.isNotEmpty ? key : _defaultRevenueCatTestKey;
  }
}
