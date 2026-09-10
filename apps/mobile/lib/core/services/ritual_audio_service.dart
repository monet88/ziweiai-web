import 'dart:developer';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String _kAudioMutedKey = 'vios_mobile_audio_muted';

class RitualAudioService {
  AudioPlayer? _coinPlayer;
  AudioPlayer? _bowlPlayer;
  bool _isMuted = false;
  bool _initialized = false;

  bool get isMuted => _isMuted;

  AudioPlayer _getCoinPlayer() {
    return _coinPlayer ??= AudioPlayer();
  }

  AudioPlayer _getBowlPlayer() {
    return _bowlPlayer ??= AudioPlayer();
  }

  Future<void> initialize() async {
    if (_initialized) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      _isMuted = prefs.getBool(_kAudioMutedKey) ?? false;
      
      // Configure audio players for low latency sound effects
      try {
        await _getCoinPlayer().setPlayerMode(PlayerMode.lowLatency);
        await _getBowlPlayer().setPlayerMode(PlayerMode.lowLatency);
      } catch (e) {
        log('Native AudioPlayer setup skipped in current environment: $e');
      }
      
      _initialized = true;
      log('RitualAudioService initialized (isMuted: $_isMuted)');
    } catch (e) {
      log('Failed to initialize RitualAudioService: $e');
    }
  }

  Future<void> setMuted(bool muted) async {
    _isMuted = muted;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_kAudioMutedKey, muted);
    } catch (e) {
      log('Failed to persist audio muted state: $e');
    }
  }

  Future<bool> toggleMuted() async {
    final next = !_isMuted;
    await setMuted(next);
    return next;
  }

  Future<void> playCoinClink() async {
    if (_isMuted) return;
    try {
      final player = _getCoinPlayer();
      await player.stop();
      await player.play(AssetSource('audio/coin_clink.wav'), volume: 0.85);
    } catch (e) {
      log('Failed to play coin clink sound: $e');
    }
  }

  Future<void> playSingingBowl() async {
    if (_isMuted) return;
    try {
      final player = _getBowlPlayer();
      await player.stop();
      await player.play(AssetSource('audio/singing_bowl.wav'), volume: 0.9);
    } catch (e) {
      log('Failed to play singing bowl sound: $e');
    }
  }

  void dispose() {
    _coinPlayer?.dispose();
    _bowlPlayer?.dispose();
  }
}

class RitualAudioNotifier extends Notifier<bool> {
  late final RitualAudioService _service;

  @override
  bool build() {
    _service = ref.watch(ritualAudioServiceProvider);
    _init();
    return _service.isMuted;
  }

  Future<void> _init() async {
    await _service.initialize();
    state = _service.isMuted;
  }

  Future<void> toggleMute() async {
    final next = !state;
    state = next;
    await _service.setMuted(next);
  }

  void playCoinClink() {
    _service.playCoinClink();
  }

  void playSingingBowl() {
    _service.playSingingBowl();
  }
}

final ritualAudioServiceProvider = Provider<RitualAudioService>((ref) {
  final service = RitualAudioService();
  ref.onDispose(() => service.dispose());
  return service;
});

final ritualAudioNotifierProvider =
    NotifierProvider<RitualAudioNotifier, bool>(RitualAudioNotifier.new);
