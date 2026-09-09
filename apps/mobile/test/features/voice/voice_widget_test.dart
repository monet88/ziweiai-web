import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/core/presentation/widgets/voice_audio_player_bar.dart';
import 'package:ziweiai_mobile/core/services/voice_synthesis_service.dart';

void main() {
  group('VoiceAudioPlayerBar Widget Tests', () {
    testWidgets('VoiceAudioPlayerBar renders nothing when state is idle',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              bottomNavigationBar: VoiceAudioPlayerBar(),
            ),
          ),
        ),
      );

      expect(find.byType(VoiceAudioPlayerBar), findsOneWidget);
      // When state is idle, child is SizedBox.shrink()
      expect(find.text('Dừng đọc'), findsNothing);
      expect(find.byType(AnimatedWaveformVisualizer), findsNothing);
    });

    testWidgets(
        'VoiceAudioPlayerBar renders playing controls when voiceState is active',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            voiceSynthesisProvider.overrideWith(() => _MockVoiceNotifier(
                  const VoicePlayerState(
                    status: VoiceStatus.playing,
                    currentText: 'Lá số của bạn năm nay đại cát.',
                    title: 'Khâm Thiên Giám Ngự Phê',
                    speechRate: 1.0,
                  ),
                )),
          ],
          child: const MaterialApp(
            home: Scaffold(
              bottomNavigationBar: VoiceAudioPlayerBar(),
            ),
          ),
        ),
      );

      await tester.pump();

      expect(find.text('Khâm Thiên Giám Ngự Phê'), findsOneWidget);
      expect(find.text('Đang đọc truyền cảm...'), findsOneWidget);
      expect(find.text('1.0x'), findsOneWidget);
      expect(find.byType(AnimatedWaveformVisualizer), findsOneWidget);
      expect(find.byIcon(Icons.pause_circle_filled_rounded), findsOneWidget);
      expect(find.byIcon(Icons.close_rounded), findsOneWidget);
    });

    testWidgets('VoicePlayIconButton toggles play state properly',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Center(
                child: VoicePlayIconButton(
                  text: 'Đoạn văn thử nghiệm âm thanh hoàng gia.',
                  title: 'Thử Nghiệm',
                ),
              ),
            ),
          ),
        ),
      );

      expect(find.byType(VoicePlayIconButton), findsOneWidget);
      expect(find.text('Nghe AI'), findsOneWidget);
      expect(find.byIcon(Icons.volume_up_rounded), findsOneWidget);
    });
  });
}

class _MockVoiceNotifier extends VoiceSynthesisNotifier {
  final VoicePlayerState _mockState;

  _MockVoiceNotifier(this._mockState);

  @override
  VoicePlayerState build() => _mockState;

  @override
  Future<void> pause() async {
    state = state.copyWith(status: VoiceStatus.paused);
  }

  @override
  Future<void> resume() async {
    state = state.copyWith(status: VoiceStatus.playing);
  }

  @override
  Future<void> stop() async {
    state = const VoicePlayerState(status: VoiceStatus.idle);
  }
}
