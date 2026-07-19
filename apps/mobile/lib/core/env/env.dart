import 'package:flutter_dotenv/flutter_dotenv.dart';

class Env {
  static Future<void> init() async {
    await dotenv.load(fileName: ".env");
  }

  static String get supabaseUrl => dotenv.env['SUPABASE_URL'] ?? '';
  static String get supabaseAnonKey => dotenv.env['SUPABASE_ANON_KEY'] ?? '';
  static String get apiUrl => dotenv.env['API_URL'] ?? '';
  static String get revenuecatApiKeyAppStore => dotenv.env['REVENUECAT_API_KEY_APP_STORE'] ?? '';
  static String get revenuecatApiKeyPlayStore => dotenv.env['REVENUECAT_API_KEY_PLAY_STORE'] ?? '';
}
