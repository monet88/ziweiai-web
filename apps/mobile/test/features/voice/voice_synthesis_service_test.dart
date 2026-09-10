import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/core/services/voice_synthesis_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('cleanMarkdownForSpeech Helper Tests', () {
    test('cleans headers, bold, italics and markdown syntax cleanly', () {
      const rawMarkdown = '''
# 🔮 TỔNG QUAN LÁ SỐ
Bạn có **Mệnh Vũ Khúc** miếu địa tọa thủ tại Thìn.
* Điểm mạnh: Ý chí kiên cường, tư duy sắc bén.
* Điểm cần lưu ý: Đôi khi *cứng nhắc*, cần mềm mỏng hơn trong giao tiếp.

### 💼 CÔNG DANH & SỰ NGHIỆP
> Thành công đến từ sự bền bỉ không ngừng nghỉ.
Tham khảo thêm tại [chi tiết luận giải](https://tuvitoantap.vercel.app).
''';

      final cleaned = cleanMarkdownForSpeech(rawMarkdown);

      // Verify no markdown headers or symbols
      expect(cleaned.contains('#'), isFalse);
      expect(cleaned.contains('**'), isFalse);
      expect(cleaned.contains('*'), isFalse);
      expect(cleaned.contains('>'), isFalse);
      expect(cleaned.contains('🔮'), isFalse);
      expect(cleaned.contains('💼'), isFalse);
      expect(cleaned.contains('https://'), isFalse);

      // Verify readable text is preserved
      expect(cleaned.contains('TỔNG QUAN LÁ SỐ'), true);
      expect(cleaned.contains('Bạn có Mệnh Vũ Khúc miếu địa tọa thủ tại Thìn'), true);
      expect(cleaned.contains('Điểm mạnh: Ý chí kiên cường, tư duy sắc bén'), true);
      expect(cleaned.contains('Thành công đến từ sự bền bỉ không ngừng nghỉ'), true);
      expect(cleaned.contains('chi tiết luận giải'), true);
    });

    test('handles empty and whitespace strings gracefully', () {
      expect(cleanMarkdownForSpeech(''), '');
      expect(cleanMarkdownForSpeech('   \n  \t  '), '');
    });

    test('removes code blocks and html tags', () {
      const codeMarkdown = '''
Lời khuyên:
```json
{ "action": "focus_career" }
```
Hãy giữ tâm thanh tịnh `bình an` trong mọi quyết định.
''';
      final cleaned = cleanMarkdownForSpeech(codeMarkdown);
      expect(cleaned.contains('json'), isFalse);
      expect(cleaned.contains('{ "action"'), isFalse);
      expect(cleaned.contains('`'), isFalse);
      expect(cleaned.contains('Hãy giữ tâm thanh tịnh bình an trong mọi quyết định'), true);
    });
  });

  group('VoicePlayerState Unit Tests', () {
    test('initial state defaults are correct', () {
      const state = VoicePlayerState();
      expect(state.status, VoiceStatus.idle);
      expect(state.isPlaying, isFalse);
      expect(state.isPaused, isFalse);
      expect(state.isIdle, isTrue);
      expect(state.speechRate, 1.0);
      expect(state.currentText, '');
      expect(state.title, '');
      expect(state.isZenMode, isFalse);
    });

    test('copyWith updates state correctly', () {
      const state = VoicePlayerState();
      final updated = state.copyWith(
        status: VoiceStatus.playing,
        currentText: 'Hello',
        title: 'Title',
        speechRate: 1.2,
        isZenMode: true,
      );

      expect(updated.status, VoiceStatus.playing);
      expect(updated.isPlaying, isTrue);
      expect(updated.currentText, 'Hello');
      expect(updated.title, 'Title');
      expect(updated.speechRate, 1.2);
      expect(updated.isZenMode, isTrue);
    });

    test('toggleZenMode flips zen state properly', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(voiceSynthesisProvider.notifier);
      expect(container.read(voiceSynthesisProvider).isZenMode, isFalse);

      notifier.toggleZenMode();
      expect(container.read(voiceSynthesisProvider).isZenMode, isTrue);

      notifier.toggleZenMode();
      expect(container.read(voiceSynthesisProvider).isZenMode, isFalse);
    });
  });
}
