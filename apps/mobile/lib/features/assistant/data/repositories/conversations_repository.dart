import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ziweiai_mobile/core/api/api_client.dart';
import 'package:ziweiai_mobile/core/api/api_provider.dart';
import 'package:ziweiai_mobile/core/api/sse_transformer.dart';
import 'package:ziweiai_mobile/features/assistant/data/models/conversation_models.dart';

final conversationsRepositoryProvider = Provider<ConversationsRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ConversationsRepository(apiClient);
});

class ConversationsRepository {
  final ApiClient _apiClient;

  ConversationsRepository(this._apiClient);

  Future<ConversationRecord> createConversation(String chartSnapshotId) async {
    final response = await _apiClient.dio.post(
      '/conversations',
      data: {'chartSnapshotId': chartSnapshotId},
    );
    final createResponse = CreateConversationResponse.fromJson(response.data);
    return createResponse.conversation;
  }

  Stream<ConversationStreamEvent> streamMessage(
    String conversationId,
    CreateConversationMessageRequest request,
  ) async* {
    final response = await _apiClient.dio.post<ResponseBody>(
      '/conversations/$conversationId/messages/stream',
      data: request.toJson(),
      options: Options(responseType: ResponseType.stream),
    );

    if (response.data == null) {
      throw Exception('Không có dữ liệu trả về từ máy chủ.');
    }

    final stream = response.data!.stream
        .transform(const SseTransformer())
        .map((payload) => ConversationStreamEvent.fromJson(jsonDecode(payload)));

    yield* stream;
  }
}
