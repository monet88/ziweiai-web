import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ziweiai_mobile/core/services/ritual_audio_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
      const MethodChannel('xyz.luan/audioplayers.global'),
      (call) async => 1,
    );
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
      const MethodChannel('xyz.luan/audioplayers'),
      (call) async => 1,
    );
  });

  group('RitualAudioService Unit Tests', () {
    test('default state is not muted', () {
      final service = RitualAudioService();
      expect(service.isMuted, false);
    });

    test('setMuted updates isMuted state and persists to SharedPreferences', () async {
      final service = RitualAudioService();
      await service.initialize();
      expect(service.isMuted, false);

      await service.setMuted(true);
      expect(service.isMuted, true);

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool('vios_mobile_audio_muted'), true);
    });

    test('toggleMuted flips isMuted state correctly', () async {
      final service = RitualAudioService();
      await service.initialize();

      final firstToggle = await service.toggleMuted();
      expect(firstToggle, true);
      expect(service.isMuted, true);

      final secondToggle = await service.toggleMuted();
      expect(secondToggle, false);
      expect(service.isMuted, false);
    });
  });
}
