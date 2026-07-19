// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'conversation_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CreateConversationRequest _$CreateConversationRequestFromJson(
  Map<String, dynamic> json,
) => CreateConversationRequest(
  chartSnapshotId: json['chartSnapshotId'] as String,
  title: json['title'] as String?,
);

Map<String, dynamic> _$CreateConversationRequestToJson(
  CreateConversationRequest instance,
) => <String, dynamic>{
  'chartSnapshotId': instance.chartSnapshotId,
  'title': instance.title,
};

ConversationRecord _$ConversationRecordFromJson(Map<String, dynamic> json) =>
    ConversationRecord(
      id: json['id'] as String,
      userId: json['userId'] as String,
      chartSnapshotId: json['chartSnapshotId'] as String,
      title: json['title'] as String?,
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$ConversationRecordToJson(ConversationRecord instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'chartSnapshotId': instance.chartSnapshotId,
      'title': instance.title,
      'createdAt': instance.createdAt,
    };

CreateConversationResponse _$CreateConversationResponseFromJson(
  Map<String, dynamic> json,
) => CreateConversationResponse(
  conversation: ConversationRecord.fromJson(
    json['conversation'] as Map<String, dynamic>,
  ),
);

Map<String, dynamic> _$CreateConversationResponseToJson(
  CreateConversationResponse instance,
) => <String, dynamic>{'conversation': instance.conversation};

CreateConversationMessageRequest _$CreateConversationMessageRequestFromJson(
  Map<String, dynamic> json,
) => CreateConversationMessageRequest(
  content: json['content'] as String?,
  quickPromptKey: json['quickPromptKey'] as String?,
  providerPreference: json['providerPreference'] as String? ?? 'auto',
);

Map<String, dynamic> _$CreateConversationMessageRequestToJson(
  CreateConversationMessageRequest instance,
) => <String, dynamic>{
  'content': instance.content,
  'quickPromptKey': instance.quickPromptKey,
  'providerPreference': instance.providerPreference,
};

ConversationMessageRecord _$ConversationMessageRecordFromJson(
  Map<String, dynamic> json,
) => ConversationMessageRecord(
  id: json['id'] as String,
  conversationId: json['conversationId'] as String,
  role: json['role'] as String,
  content: json['content'] as String,
  quickPromptKey: json['quickPromptKey'] as String?,
  createdAt: json['createdAt'] as String,
);

Map<String, dynamic> _$ConversationMessageRecordToJson(
  ConversationMessageRecord instance,
) => <String, dynamic>{
  'id': instance.id,
  'conversationId': instance.conversationId,
  'role': instance.role,
  'content': instance.content,
  'quickPromptKey': instance.quickPromptKey,
  'createdAt': instance.createdAt,
};

ConversationStreamEvent _$ConversationStreamEventFromJson(
  Map<String, dynamic> json,
) => ConversationStreamEvent(
  type: json['type'] as String,
  delta: json['delta'] as String?,
  message: json['message'] == null
      ? null
      : ConversationMessageRecord.fromJson(
          json['message'] as Map<String, dynamic>,
        ),
  error: json['error'] == null
      ? null
      : ApiError.fromJson(json['error'] as Map<String, dynamic>),
);

Map<String, dynamic> _$ConversationStreamEventToJson(
  ConversationStreamEvent instance,
) => <String, dynamic>{
  'type': instance.type,
  'delta': instance.delta,
  'message': instance.message,
  'error': instance.error,
};

ApiError _$ApiErrorFromJson(Map<String, dynamic> json) => ApiError(
  code: json['code'] as String,
  message: json['message'] as String,
  requestId: json['requestId'] as String?,
);

Map<String, dynamic> _$ApiErrorToJson(ApiError instance) => <String, dynamic>{
  'code': instance.code,
  'message': instance.message,
  'requestId': instance.requestId,
};
