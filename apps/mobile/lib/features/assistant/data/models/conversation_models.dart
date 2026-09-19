import 'package:json_annotation/json_annotation.dart';

part 'conversation_models.g.dart';

@JsonSerializable()
class CreateConversationRequest {
  final String chartSnapshotId;
  final String? title;

  CreateConversationRequest({
    required this.chartSnapshotId,
    this.title,
  });

  factory CreateConversationRequest.fromJson(Map<String, dynamic> json) => _$CreateConversationRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CreateConversationRequestToJson(this);
}

@JsonSerializable()
class ConversationRecord {
  final String id;
  final String userId;
  final String chartSnapshotId;
  final String? title;
  final String createdAt;

  ConversationRecord({
    required this.id,
    required this.userId,
    required this.chartSnapshotId,
    this.title,
    required this.createdAt,
  });

  factory ConversationRecord.fromJson(Map<String, dynamic> json) => _$ConversationRecordFromJson(json);
  Map<String, dynamic> toJson() => _$ConversationRecordToJson(this);
}

@JsonSerializable()
class CreateConversationResponse {
  final ConversationRecord conversation;

  CreateConversationResponse({required this.conversation});

  factory CreateConversationResponse.fromJson(Map<String, dynamic> json) => _$CreateConversationResponseFromJson(json);
  Map<String, dynamic> toJson() => _$CreateConversationResponseToJson(this);
}

@JsonSerializable()
class CreateConversationMessageRequest {
  final String? content;
  final String? quickPromptKey;
  final String providerPreference;

  CreateConversationMessageRequest({
    this.content,
    this.quickPromptKey,
    this.providerPreference = 'auto',
  });

  factory CreateConversationMessageRequest.fromJson(Map<String, dynamic> json) => _$CreateConversationMessageRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CreateConversationMessageRequestToJson(this);
}

@JsonSerializable()
class ConversationMessageRecord {
  final String id;
  final String conversationId;
  final String role;
  final String content;
  final String? quickPromptKey;
  final String createdAt;

  ConversationMessageRecord({
    required this.id,
    required this.conversationId,
    required this.role,
    required this.content,
    this.quickPromptKey,
    required this.createdAt,
  });

  factory ConversationMessageRecord.fromJson(Map<String, dynamic> json) => _$ConversationMessageRecordFromJson(json);
  Map<String, dynamic> toJson() => _$ConversationMessageRecordToJson(this);
}

@JsonSerializable()
class ConversationStreamEvent {
  final String type;
  final String? delta;
  final ConversationMessageRecord? message;
  final ApiError? error;

  ConversationStreamEvent({
    required this.type,
    this.delta,
    this.message,
    this.error,
  });

  factory ConversationStreamEvent.fromJson(Map<String, dynamic> json) => _$ConversationStreamEventFromJson(json);
  Map<String, dynamic> toJson() => _$ConversationStreamEventToJson(this);
}

@JsonSerializable()
class ApiError {
  final String code;
  final String message;
  final String? requestId;

  ApiError({
    required this.code,
    required this.message,
    this.requestId,
  });

  factory ApiError.fromJson(Map<String, dynamic> json) => _$ApiErrorFromJson(json);
  Map<String, dynamic> toJson() => _$ApiErrorToJson(this);
}
