import 'dart:developer';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String _kAudioMutedKey = 'vios_mobile_audio_muted';
const String _kAudioVolumeKey = 'vios_mobile_audio_volume';

class RitualAudioService {
  AudioPlayer? _coinPlayer;
  AudioPlayer? _bowlPlayer;
  AudioPlayer? _stickPlayer;
  AudioPlayer? _cardPlayer;
  bool _isMuted = false;
  double _volume = 0.85;
  bool _initialized = false;

  bool get isMuted => _isMuted;
  double get volume => _volume;

  AudioPlayer _getCoinPlayer() => _coinPlayer ??= AudioPlayer();
  AudioPlayer _getBowlPlayer() => _bowlPlayer ??= AudioPlayer();
  AudioPlayer _getStickPlayer() => _stickPlayer ??= AudioPlayer();
  AudioPlayer _getCardPlayer() => _cardPlayer ??= AudioPlayer();

  Future<void> initialize() async {
    if (_initialized) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      _isMuted = prefs.getBool(_kAudioMutedKey) ?? false;
      _volume = prefs.getDouble(_kAudioVolumeKey) ?? 0.85;
      
      // Configure audio players for low latency sound effects
      try {
        await _getCoinPlayer().setPlayerMode(PlayerMode.lowLatency);
        await _getBowlPlayer().setPlayerMode(PlayerMode.lowLatency);
        await _getStickPlayer().setPlayerMode(PlayerMode.lowLatency);
        await _getCardPlayer().setPlayerMode(PlayerMode.lowLatency);
      } catch (e) {
        log('Native AudioPlayer setup skipped in current environment: $e');
      }
      
      _initialized = true;
      log('RitualAudioService initialized (isMuted: $_isMuted, volume: $_volume)');
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

  Future<void> setVolume(double vol) async {
    _volume = vol.clamp(0.0, 1.0);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setDouble(_kAudioVolumeKey, _volume);
    } catch (e) {
      log('Failed to persist audio volume state: $e');
    }
  }

  Future<void> playCoinClink() async {
    if (_isMuted) return;
    try {
      final player = _getCoinPlayer();
      await player.stop();
      await player.play(AssetSource('audio/coin_clink.wav'), volume: _volume);
    } catch (e) {
      log('Failed to play coin clink sound: $e');
    }
  }

  Future<void> playSingingBowl() async {
    if (_isMuted) return;
    try {
      final player = _getBowlPlayer();
      await player.stop();
      await player.play(AssetSource('audio/singing_bowl.wav'), volume: _volume);
    } catch (e) {
      log('Failed to play singing bowl sound: $e');
    }
  }

  Future<void> playStickShake() async {
    if (_isMuted) return;
    try {
      final player = _getStickPlayer();
      await player.stop();
      await player.play(AssetSource('audio/stick_shake.wav'), volume: _volume);
    } catch (e) {
      log('Failed to play stick shake sound: $e');
    }
  }

  Future<void> playTarotFlip() async {
    if (_isMuted) return;
    try {
      final player = _getCardPlayer();
      await player.stop();
      await player.play(AssetSource('audio/card_flip.wav'), volume: _volume);
    } catch (e) {
      log('Failed to play tarot card flip sound: $e');
    }
  }

  void dispose() {
    _coinPlayer?.dispose();
    _bowlPlayer?.dispose();
    _stickPlayer?.dispose();
    _cardPlayer?.dispose();
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

  Future<void> setMuted(bool muted) async {
    state = muted;
    await _service.setMuted(muted);
  }

  void playCoinClink() => _service.playCoinClink();
  void playSingingBowl() => _service.playSingingBowl();
  void playStickShake() => _service.playStickShake();
  void playTarotFlip() => _service.playTarotFlip();
}

class RitualAudioVolumeNotifier extends Notifier<double> {
  late final RitualAudioService _service;

  @override
  double build() {
    _service = ref.watch(ritualAudioServiceProvider);
    return _service.volume;
  }

  Future<void> setVolume(double vol) async {
    state = vol.clamp(0.0, 1.0);
    await _service.setVolume(state);
  }
}

final ritualAudioServiceProvider = Provider<RitualAudioService>((ref) {
  final service = RitualAudioService();
  ref.onDispose(() => service.dispose());
  return service;
});

final ritualAudioNotifierProvider =
    NotifierProvider<RitualAudioNotifier, bool>(RitualAudioNotifier.new);

final ritualAudioVolumeProvider =
    NotifierProvider<RitualAudioVolumeNotifier, double>(RitualAudioVolumeNotifier.new);

