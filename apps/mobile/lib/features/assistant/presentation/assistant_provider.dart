import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ziweiai_mobile/features/assistant/data/models/conversation_models.dart';
import 'package:ziweiai_mobile/features/assistant/data/repositories/conversations_repository.dart';

class AssistantMessageView {
  final String? id;
  final String role;
  final String content;
  final String? quickPromptKey;
  final bool isStreaming;

  AssistantMessageView({
    this.id,
    required this.role,
    required this.content,
    this.quickPromptKey,
    this.isStreaming = false,
  });

  AssistantMessageView copyWith({
    String? id,
    String? role,
    String? content,
    String? quickPromptKey,
    bool? isStreaming,
  }) {
    return AssistantMessageView(
      id: id ?? this.id,
      role: role ?? this.role,
      content: content ?? this.content,
      quickPromptKey: quickPromptKey ?? this.quickPromptKey,
      isStreaming: isStreaming ?? this.isStreaming,
    );
  }
}

class AssistantState {
  final List<AssistantMessageView> messages;
  final String? conversationId;
  final bool isGenerating;
  final String? errorMessage;
  final String? chartSnapshotId;

  AssistantState({
    this.messages = const [],
    this.conversationId,
    this.isGenerating = false,
    this.errorMessage,
    this.chartSnapshotId,
  });

  AssistantState copyWith({
    List<AssistantMessageView>? messages,
    String? conversationId,
    bool? isGenerating,
    String? errorMessage,
    bool clearError = false,
    String? chartSnapshotId,
  }) {
    return AssistantState(
      messages: messages ?? this.messages,
      conversationId: conversationId ?? this.conversationId,
      isGenerating: isGenerating ?? this.isGenerating,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      chartSnapshotId: chartSnapshotId ?? this.chartSnapshotId,
    );
  }
}

class AssistantNotifier extends Notifier<AssistantState> {
  late ConversationsRepository _repository;

  @override
  AssistantState build() {
    _repository = ref.watch(conversationsRepositoryProvider);
    return AssistantState();
  }

  void init(String chartSnapshotId) {
    if (state.chartSnapshotId != chartSnapshotId) {
      state = AssistantState(chartSnapshotId: chartSnapshotId);
    }
  }

  Future<String> _ensureConversationId() async {
    if (state.conversationId != null) return state.conversationId!;
    
    final record = await _repository.createConversation(state.chartSnapshotId!);
    state = state.copyWith(conversationId: record.id);
    return record.id;
  }

  Future<void> sendMessage({String? content, String? quickPromptKey}) async {
    if (state.isGenerating || state.chartSnapshotId == null) return;
    state = state.copyWith(isGenerating: true, clearError: true);

    final displayContent = content ?? (quickPromptKey != null ? _getQuickPromptLabel(quickPromptKey) : '');

    final userView = AssistantMessageView(
      id: null,
      role: 'user',
      content: displayContent,
      quickPromptKey: quickPromptKey,
    );

    final assistantPlaceholder = AssistantMessageView(
      id: null,
      role: 'assistant',
      content: '',
      isStreaming: true,
    );

    state = state.copyWith(
      messages: [...state.messages, userView, assistantPlaceholder],
    );

    try {
      final conversationId = await _ensureConversationId();
      final request = CreateConversationMessageRequest(
        content: content,
        quickPromptKey: quickPromptKey,
        providerPreference: 'auto',
      );

      final assistantIdx = state.messages.length - 1;
      String streamedText = '';

      final stream = _repository.streamMessage(conversationId, request);
      
      await for (final evt in stream) {
        if (evt.type == 'chunk') {
          streamedText += (evt.delta ?? '');
          final updatedMessages = List<AssistantMessageView>.from(state.messages);
          updatedMessages[assistantIdx] = AssistantMessageView(
            id: null,
            role: 'assistant',
            content: streamedText,
            isStreaming: true,
          );
          state = state.copyWith(messages: updatedMessages);
        } else if (evt.type == 'done' && evt.message != null) {
          final updatedMessages = List<AssistantMessageView>.from(state.messages);
          updatedMessages[assistantIdx] = AssistantMessageView(
            id: evt.message!.id,
            role: 'assistant',
            content: evt.message!.content,
            isStreaming: false,
          );
          state = state.copyWith(messages: updatedMessages);
        } else if (evt.type == 'error' && evt.error != null) {
          throw Exception(evt.error!.message);
        }
      }
    } catch (e) {
      // Rollback on error if still streaming
      final currentMessages = List<AssistantMessageView>.from(state.messages);
      if (currentMessages.isNotEmpty) {
        final last = currentMessages.last;
        if (last.role == 'assistant' && last.isStreaming) {
          currentMessages.removeLast(); // remove assistant
          currentMessages.removeLast(); // remove user
        }
      }
      state = state.copyWith(
        messages: currentMessages,
        errorMessage: e.toString(),
      );
    } finally {
      state = state.copyWith(isGenerating: false);
    }
  }

  String _getQuickPromptLabel(String key) {
    switch (key) {
      case 'overview': return 'Tổng quan';
      case 'love': return 'Tình duyên';
      case 'career': return 'Sự nghiệp';
      case 'health': return 'Sức khoẻ';
      case 'timing': return 'Vận hạn';
      default: return '';
    }
  }
}

final assistantProvider = NotifierProvider<AssistantNotifier, AssistantState>(AssistantNotifier.new);
