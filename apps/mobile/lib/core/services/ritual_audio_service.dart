import 'dart:developer';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String _kAudioMutedKey = 'vios_mobile_audio_muted';
const String _kAudioVolumeKey = 'vios_mobile_audio_volume';
const String _kOfflineRitualModeKey = 'vios_mobile_offline_ritual_mode';

class RitualAudioService {
  AudioPlayer? _coinPlayer;
  AudioPlayer? _bowlPlayer;
  AudioPlayer? _stickPlayer;
  AudioPlayer? _cardPlayer;
  bool _isMuted = false;
  double _volume = 0.85;
  bool _offlineRitualMode = false;
  bool _initialized = false;

  bool get isMuted => _isMuted;
  double get volume => _volume;
  bool get isOfflineRitualMode => _offlineRitualMode;

  AudioPlayer _getCoinPlayer() => _coinPlayer ??= AudioPlayer();
  AudioPlayer _getBowlPlayer() => _bowlPlayer ??= AudioPlayer();
  AudioPlayer _getStickPlayer() => _stickPlayer ??= AudioPlayer();
  AudioPlayer _getCardPlayer() => _cardPlayer ??= AudioPlayer();

  Future<void> initialize() {
    if (_initialized) return Future.value();
    return _initFuture ??= _doInternalInitialize();
  }

  Future<void> _doInternalInitialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _isMuted = prefs.getBool(_kAudioMutedKey) ?? false;
      _volume = prefs.getDouble(_kAudioVolumeKey) ?? 0.85;
      _offlineRitualMode = prefs.getBool(_kOfflineRitualModeKey) ?? false;
      
      // Configure audio players for low latency sound effects
      try {
        await _getCoinPlayer().setPlayerMode(PlayerMode.lowLatency);
        await _getBowlPlayer().setPlayerMode(PlayerMode.lowLatency);
        await _getStickPlayer().setPlayerMode(PlayerMode.lowLatency);
        await _getCardPlayer().setPlayerMode(PlayerMode.lowLatency);
      } catch (e) {
        log('Native AudioPlayer setup skipped in current environment: $e');
      }

      if (_offlineRitualMode) {
        await preloadRitualSounds();
      }
      
      _initialized = true;
      log('RitualAudioService initialized (isMuted: $_isMuted, volume: $_volume, offlineMode: $_offlineRitualMode)');
    } catch (e) {
      log('Failed to initialize RitualAudioService: $e');
    } finally {
      _initFuture = null;
    }
  }

  Future<void> setOfflineRitualMode(bool enabled) async {
    _offlineRitualMode = enabled;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_kOfflineRitualModeKey, enabled);
      if (enabled) {
        await preloadRitualSounds();
      }
    } catch (e) {
      log('Failed to persist offline ritual mode state: $e');
    }
  }

  Future<bool> toggleOfflineRitualMode() async {
    final next = !_offlineRitualMode;
    await setOfflineRitualMode(next);
    return next;
  }

  final Set<String> _preloadedSources = {};
  Future<void>? _initFuture;

  /// Nạp sẵn toàn bộ âm thanh nghi lễ cung đình vào bộ nhớ đệm (Preload RAM Cache)
  Future<void> preloadRitualSounds() async {
    try {
      await _getCoinPlayer().setSource(AssetSource('audio/coin_clink.wav'));
      _preloadedSources.add('coin');
      await _getBowlPlayer().setSource(AssetSource('audio/singing_bowl.wav'));
      _preloadedSources.add('bowl');
      await _getStickPlayer().setSource(AssetSource('audio/stick_shake.wav'));
      _preloadedSources.add('stick');
      await _getCardPlayer().setSource(AssetSource('audio/card_flip.wav'));
      _preloadedSources.add('card');
      log('[RitualAudioService] Preload toàn bộ âm thanh nghi lễ ngoại tuyến thành công');
    } catch (e) {
      log('[RitualAudioService] Preload audio fallback: $e');
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

  Future<void> _playSound(
    AudioPlayer player,
    String soundKey,
    String assetPath,
  ) async {
    await initialize();
    if (_isMuted) return;
    try {
      await player.setVolume(_volume);
      if (_offlineRitualMode && _preloadedSources.contains(soundKey)) {
        await player.seek(Duration.zero);
        await player.resume();
      } else {
        await player.stop();
        await player.play(AssetSource(assetPath), volume: _volume);
      }
    } catch (e) {
      log('Failed to play $soundKey sound: $e');
      try {
        await player.play(AssetSource(assetPath), volume: _volume);
      } catch (_) {}
    }
  }

  Future<void> playCoinClink() =>
      _playSound(_getCoinPlayer(), 'coin', 'audio/coin_clink.wav');

  Future<void> playSingingBowl() =>
      _playSound(_getBowlPlayer(), 'bowl', 'audio/singing_bowl.wav');

  Future<void> playStickShake() =>
      _playSound(_getStickPlayer(), 'stick', 'audio/stick_shake.wav');

  Future<void> playTarotFlip() =>
      _playSound(_getCardPlayer(), 'card', 'audio/card_flip.wav');

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
    _init();
    return _service.volume;
  }

  Future<void> _init() async {
    await _service.initialize();
    state = _service.volume;
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

class OfflineRitualModeNotifier extends Notifier<bool> {
  late final RitualAudioService _service;

  @override
  bool build() {
    _service = ref.watch(ritualAudioServiceProvider);
    _init();
    return _service.isOfflineRitualMode;
  }

  Future<void> _init() async {
    await _service.initialize();
    state = _service.isOfflineRitualMode;
  }

  Future<void> toggle() async {
    final next = !state;
    state = next;
    await _service.setOfflineRitualMode(next);
  }

  Future<void> setMode(bool enabled) async {
    state = enabled;
    await _service.setOfflineRitualMode(enabled);
  }
}

final offlineRitualModeProvider =
    NotifierProvider<OfflineRitualModeNotifier, bool>(OfflineRitualModeNotifier.new);
