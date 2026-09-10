import 'dart:developer';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../env/env.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // If you're going to use other Firebase services in the background, such as Firestore,
  // make sure you call `initializeApp` before using other Firebase services.
  log("Handling a background message: ${message.messageId}");
}

class PushNotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  Future<void> registerTokenWithBackend(String token) async {
    try {
      final session = Supabase.instance.client.auth.currentSession;
      if (session == null) {
        log('User not logged in, skipping FCM token sync');
        return;
      }

      final dio = Dio(BaseOptions(
        baseUrl: Env.apiUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${session.accessToken}',
        },
      ));

      final response = await dio.post('/users/me/fcm-token', data: {
        'token': token,
        'platform': Platform.isIOS ? 'ios' : 'android',
      });
      log('FCM Token synced to backend successfully: ${response.statusCode}');
    } catch (e) {
      log('Failed to sync FCM token to backend: $e');
    }
  }

  Future<void> initialize() async {
    try {
      // Request permissions for iOS and Android 13+
      NotificationSettings settings = await _fcm.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      log('User granted permission: ${settings.authorizationStatus}');

      // Get the token
      final String? token = await _fcm.getToken();
      log('FCM Token: $token');
      if (token != null) {
        await registerTokenWithBackend(token);
      }

      // Listen for token refreshes
      _fcm.onTokenRefresh.listen((newToken) {
        registerTokenWithBackend(newToken);
      });

      // Set up background message handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Listen to foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        log('Got a message whilst in the foreground!');
        log('Message data: ${message.data}');

        if (message.notification != null) {
          log('Message also contained a notification: ${message.notification}');
        }
      });
      
      // Handle when app is opened from a background state
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        log('A new onMessageOpenedApp event was published!');
      });

    } catch (e) {
      log('Failed to initialize push notifications: $e');
    }
  }
}
