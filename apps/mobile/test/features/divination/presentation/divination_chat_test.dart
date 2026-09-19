import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/features/divination/models/divination_message.dart';
import 'package:ziweiai_mobile/features/divination/presentation/screens/divination_chat_screen.dart';
import 'package:ziweiai_mobile/features/divination/providers/divination_chat_provider.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';

void main() {
  group('Divination Models & Prompts Unit Tests', () {
    test('DivinationMessage creates, serializes and copies correctly', () {
      final now = DateTime.now();
      final msg = DivinationMessage(
        id: 'msg_01',
        role: 'user',
        content: 'Thời vận của ta thế nào?',
        createdAt: now,
        topic: 'Thời Vận',
      );

      expect(msg.isUser, isTrue);
      expect(msg.isAssistant, isFalse);
      expect(msg.content, 'Thời vận của ta thế nào?');
      expect(msg.topic, 'Thời Vận');

      final json = msg.toJson();
      expect(json['id'], 'msg_01');
      expect(json['role'], 'user');
      expect(json['content'], 'Thời vận của ta thế nào?');

      final deserialized = DivinationMessage.fromJson(json);
      expect(deserialized.id, 'msg_01');
      expect(deserialized.content, msg.content);

      final updated = msg.copyWith(content: 'Đã cập nhật', isStreaming: true);
      expect(updated.content, 'Đã cập nhật');
      expect(updated.isStreaming, isTrue);
      expect(updated.role, 'user');
    });

    test('kRoyalDivinationPrompts has 5 core imperial categories', () {
      expect(kRoyalDivinationPrompts.length, greaterThanOrEqualTo(5));
      final categories = kRoyalDivinationPrompts.map((p) => p.category).toSet();
      expect(categories.contains('Thời Vận'), isTrue);
      expect(categories.contains('Công Danh'), isTrue);
      expect(categories.contains('Tài Lộc'), isTrue);
      expect(categories.contains('Tình Duyên'), isTrue);
      expect(categories.contains('Lý Số'), isTrue);
    });
  });

  group('DivinationChatNotifier Unit Tests', () {
    test('Initial state contains royal welcome greeting from Khâm Thiên Giám', () {
      final container = ProviderContainer(
        overrides: [
          walletBalanceProvider.overrideWith((ref) => Future.value(10)),
        ],
      );
      addTearDown(container.dispose);

      final state = container.read(divinationChatProvider);
      expect(state.messages.length, 1);
      expect(state.messages.first.isAssistant, isTrue);
      expect(state.messages.first.content, contains('Khâm Thiên Giám Ngự Phán Phòng'));
      expect(state.isGenerating, isFalse);
      expect(state.errorMessage, isNull);
    });

    test('sendMessage rejects when wallet balance is less than 1 XU', () async {
      final container = ProviderContainer(
        overrides: [
          walletBalanceProvider.overrideWith((ref) => Future.value(0)),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(divinationChatProvider.notifier);
      final success = await notifier.sendMessage('Xin xem tài lộc');

      expect(success, isFalse);
      final state = container.read(divinationChatProvider);
      expect(state.errorMessage, contains('Số dư không đủ'));
      expect(state.messages.length, 1); // Không thêm user message nếu từ chối
    });

    test('sendMessage proceeds and streams response when wallet balance >= 1 XU', () async {
      final container = ProviderContainer(
        overrides: [
          walletBalanceProvider.overrideWith((ref) => Future.value(5)),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(divinationChatProvider.notifier);
      final successFuture = notifier.sendMessage('Thời vận năm nay của ta?', topic: 'Thời Vận');

      // Trong khi đang sinh câu trả lời
      final success = await successFuture;
      expect(success, isTrue);

      final state = container.read(divinationChatProvider);
      expect(state.messages.length, 3); // 1 greeting + 1 user + 1 assistant
      expect(state.messages[1].isUser, isTrue);
      expect(state.messages[1].content, 'Thời vận năm nay của ta?');
      expect(state.messages[2].isAssistant, isTrue);
      expect(state.messages[2].content, contains('KHÂM THIÊN GIÁM NGỰ PHÁN'));
      expect(state.isGenerating, isFalse);
    });

    test('clearChat resets messages back to single initial greeting', () async {
      final container = ProviderContainer(
        overrides: [
          walletBalanceProvider.overrideWith((ref) => Future.value(5)),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(divinationChatProvider.notifier);
      await notifier.sendMessage('Xin tư vấn công danh', topic: 'Công Danh');
      expect(container.read(divinationChatProvider).messages.length, 3);

      notifier.clearChat();
      expect(container.read(divinationChatProvider).messages.length, 1);
      expect(
        container.read(divinationChatProvider).messages.first.content,
        contains('Khâm Thiên Giám Ngự Phán Phòng'),
      );
    });
  });

  group('DivinationChatScreen Widget Tests', () {
    testWidgets('renders Ngự Phán Phòng screen with appbar, balance, and quick prompts', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            walletBalanceProvider.overrideWith((ref) => Future.value(8)),
          ],
          child: const MaterialApp(
            home: DivinationChatScreen(),
          ),
        ),
      );

      // Do AnimatedBackground có loop animation nên dùng pump thời gian ngắn thay vì pumpAndSettle
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Ngự Phán Phòng'), findsOneWidget);
      expect(find.text('Khâm Thiên Giám Toàn Năng'), findsOneWidget);
      expect(find.text('8 XU'), findsOneWidget);
      expect(find.text('Thời vận tháng này'), findsOneWidget);
      expect(find.text('Công danh nên thủ hay công?'), findsOneWidget);
      expect(find.text('1 XU'), findsOneWidget);
      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('shows insufficient coins dialog when balance is 0 and user attempts to send', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            walletBalanceProvider.overrideWith((ref) => Future.value(0)),
          ],
          child: const MaterialApp(
            home: DivinationChatScreen(),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 300));

      // Nhập tin nhắn vào TextField
      await tester.enterText(find.byType(TextField), 'Xin xem quẻ xuất hành');
      await tester.pump(const Duration(milliseconds: 100));

      // Bấm nút gửi
      await tester.tap(find.byIcon(Icons.send_rounded));
      await tester.pump(const Duration(milliseconds: 300));

      // Kiểm tra xuất hiện Dialog Số Dư XU Không Đủ
      expect(find.text('Số Dư XU Không Đủ'), findsOneWidget);
      expect(find.text('Vào Ví XU'), findsOneWidget);
    });
  });
}
