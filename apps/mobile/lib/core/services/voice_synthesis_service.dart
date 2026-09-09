import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tts/flutter_tts.dart';

enum VoiceStatus { idle, playing, paused }

class VoicePlayerState {
  final VoiceStatus status;
  final String currentText;
  final String title;
  final double speechRate;

  const VoicePlayerState({
    this.status = VoiceStatus.idle,
    this.currentText = '',
    this.title = '',
    this.speechRate = 1.0,
  });

  bool get isPlaying => status == VoiceStatus.playing;
  bool get isPaused => status == VoiceStatus.paused;
  bool get isIdle => status == VoiceStatus.idle;

  VoicePlayerState copyWith({
    VoiceStatus? status,
    String? currentText,
    String? title,
    double? speechRate,
  }) {
    return VoicePlayerState(
      status: status ?? this.status,
      currentText: currentText ?? this.currentText,
      title: title ?? this.title,
      speechRate: speechRate ?? this.speechRate,
    );
  }
}

/// Helper to sanitize and clean markdown formatting for smooth and natural speech synthesis
String cleanMarkdownForSpeech(String markdown) {
  if (markdown.trim().isEmpty) return '';

  String cleaned = markdown;

  // Remove fenced code blocks
  cleaned = cleaned.replaceAll(RegExp(r'```[\s\S]*?```'), '');
  // Strip inline code backticks while preserving text content
  cleaned = cleaned.replaceAllMapped(RegExp(r'`([^`]*)`'), (match) => match.group(1) ?? '');


  // Remove images and links [text](url) -> text
  cleaned = cleaned.replaceAll(RegExp(r'!\[.*?\]\(.*?\)', caseSensitive: false), '');
  cleaned = cleaned.replaceAllMapped(
    RegExp(r'\[(.*?)\]\(.*?\)'),
    (match) => match.group(1) ?? '',
  );

  // Remove markdown headers (#, ##, ###, ####)
  cleaned = cleaned.replaceAll(RegExp(r'^#{1,6}\s+', multiLine: true), '');

  // Remove bold, italic, strikethrough (***, **, *, ~~)
  cleaned = cleaned.replaceAll(RegExp(r'(\*\*|\*|___|__|_|~~)'), '');

  // Remove blockquotes (>)
  cleaned = cleaned.replaceAll(RegExp(r'^\s*>\s+', multiLine: true), '');

  // Remove list markers (- , * , + , 1. , 2. )
  cleaned = cleaned.replaceAll(RegExp(r'^\s*[-*+]\s+', multiLine: true), '');
  cleaned = cleaned.replaceAll(RegExp(r'^\s*\d+\.\s+', multiLine: true), '');

  // Remove horizontal rules (---, ***, ___)
  cleaned = cleaned.replaceAll(RegExp(r'^\s*[-*_]{3,}\s*$', multiLine: true), '');

  // Replace common symbols and emojis that interrupt flow
  cleaned = cleaned.replaceAll(RegExp(r'[🔮✨❤️💼💰🌱🌟⚖️🛡️⚔️👑⚡🌙☀️]'), '');
  cleaned = cleaned.replaceAll(RegExp(r'[•|—–]'), ' ');

  // Normalize excessive spaces and linebreaks
  cleaned = cleaned.replaceAll(RegExp(r'\n{2,}'), '. ');
  cleaned = cleaned.replaceAll(RegExp(r'\n'), ' ');
  cleaned = cleaned.replaceAll(RegExp(r'\s{2,}'), ' ');

  // Ensure nice sentence endings
  cleaned = cleaned.replaceAll(RegExp(r'\.\s*\.'), '.');

  return cleaned.trim();
}

class VoiceSynthesisNotifier extends Notifier<VoicePlayerState> {
  late final FlutterTts _flutterTts;
  bool _isInitialized = false;

  @override
  VoicePlayerState build() {
    _flutterTts = FlutterTts();
    ref.onDispose(() {
      try {
        _flutterTts.stop().catchError((_) {});
      } catch (_) {}
    });
    return const VoicePlayerState();
  }

  Future<void> _initTts() async {
    if (_isInitialized) return;
    try {
      await _flutterTts.setLanguage('vi-VN');
      await _flutterTts.setSpeechRate(0.5); // 0.5 in flutter_tts corresponds to 1.0x normal speed
      await _flutterTts.setVolume(1.0);
      await _flutterTts.setPitch(1.0);

      _flutterTts.setStartHandler(() {
        state = state.copyWith(status: VoiceStatus.playing);
      });

      _flutterTts.setCompletionHandler(() {
        state = state.copyWith(status: VoiceStatus.idle, currentText: '', title: '');
      });

      _flutterTts.setPauseHandler(() {
        state = state.copyWith(status: VoiceStatus.paused);
      });

      _flutterTts.setContinueHandler(() {
        state = state.copyWith(status: VoiceStatus.playing);
      });

      _flutterTts.setErrorHandler((msg) {
        debugPrint('[VoiceSynthesis] TTS Error: $msg');
        state = state.copyWith(status: VoiceStatus.idle);
      });

      _isInitialized = true;
    } catch (e) {
      debugPrint('[VoiceSynthesis] Initialization failed: $e');
    }
  }

  /// Play or toggle speech for given text
  Future<void> togglePlay({
    required String text,
    String title = 'Luận Giải AI',
  }) async {
    if (state.currentText == text) {
      if (state.isPlaying) {
        await pause();
      } else if (state.isPaused) {
        await resume();
      } else {
        await play(text: text, title: title);
      }
    } else {
      await play(text: text, title: title);
    }
  }

  /// Start playing voice
  Future<void> play({
    required String text,
    String title = 'Luận Giải AI',
  }) async {
    await _initTts();
    await _flutterTts.stop();

    final cleanedText = cleanMarkdownForSpeech(text);
    if (cleanedText.isEmpty) return;

    state = state.copyWith(
      status: VoiceStatus.playing,
      currentText: text,
      title: title,
    );

    try {
      final result = await _flutterTts.speak(cleanedText);
      if (result == 0) {
        debugPrint('[VoiceSynthesis] Speak failed to initiate.');
        state = state.copyWith(status: VoiceStatus.idle);
      }
    } catch (e) {
      debugPrint('[VoiceSynthesis] Error in speak: $e');
      state = state.copyWith(status: VoiceStatus.idle);
    }
  }

  /// Pause current speech
  Future<void> pause() async {
    try {
      await _flutterTts.pause();
      state = state.copyWith(status: VoiceStatus.paused);
    } catch (e) {
      debugPrint('[VoiceSynthesis] Error pausing: $e');
    }
  }

  /// Resume speech
  Future<void> resume() async {
    try {
      state = state.copyWith(status: VoiceStatus.playing);
      // In flutter_tts, speak resumes or starts
      final cleanedText = cleanMarkdownForSpeech(state.currentText);
      await _flutterTts.speak(cleanedText);
    } catch (e) {
      debugPrint('[VoiceSynthesis] Error resuming: $e');
    }
  }

  /// Stop speech completely
  Future<void> stop() async {
    try {
      await _flutterTts.stop();
      state = state.copyWith(
        status: VoiceStatus.idle,
        currentText: '',
        title: '',
      );
    } catch (e) {
      debugPrint('[VoiceSynthesis] Error stopping: $e');
    }
  }

  /// Set speech rate (0.8x, 1.0x, 1.2x)
  Future<void> setSpeechRate(double rateMultiplier) async {
    try {
      // Map multiplier: 1.0x -> 0.5, 0.8x -> 0.4, 1.2x -> 0.6
      final ttsRate = (0.5 * rateMultiplier).clamp(0.1, 1.0);
      await _flutterTts.setSpeechRate(ttsRate);
      state = state.copyWith(speechRate: rateMultiplier);

      // If currently playing, restart smoothly with new rate
      if (state.isPlaying) {
        final text = state.currentText;
        await _flutterTts.stop();
        final cleaned = cleanMarkdownForSpeech(text);
        await _flutterTts.speak(cleaned);
      }
    } catch (e) {
      debugPrint('[VoiceSynthesis] Error setting rate: $e');
    }
  }

  /// Cycle speech speed (1.0x -> 1.2x -> 0.8x -> 1.0x)
  Future<void> cycleSpeechRate() async {
    if (state.speechRate == 1.0) {
      await setSpeechRate(1.2);
    } else if (state.speechRate == 1.2) {
      await setSpeechRate(0.8);
    } else {
      await setSpeechRate(1.0);
    }
  }
}

final voiceSynthesisProvider =
    NotifierProvider<VoiceSynthesisNotifier, VoicePlayerState>(VoiceSynthesisNotifier.new);
