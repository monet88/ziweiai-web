import 'package:flutter/foundation.dart';

@immutable
class DivinationMessage {
  final String id;
  final String role; // 'user' | 'assistant'
  final String content;
  final DateTime createdAt;
  final bool isStreaming;
  final String? topic;

  const DivinationMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.createdAt,
    this.isStreaming = false,
    this.topic,
  });

  bool get isUser => role == 'user';
  bool get isAssistant => role == 'assistant';

  DivinationMessage copyWith({
    String? id,
    String? role,
    String? content,
    DateTime? createdAt,
    bool? isStreaming,
    String? topic,
  }) {
    return DivinationMessage(
      id: id ?? this.id,
      role: role ?? this.role,
      content: content ?? this.content,
      createdAt: createdAt ?? this.createdAt,
      isStreaming: isStreaming ?? this.isStreaming,
      topic: topic ?? this.topic,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'role': role,
        'content': content,
        'createdAt': createdAt.toIso8601String(),
        'topic': topic,
      };

  factory DivinationMessage.fromJson(Map<String, dynamic> json) =>
      DivinationMessage(
        id: json['id'] as String,
        role: json['role'] as String,
        content: json['content'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        topic: json['topic'] as String?,
      );
}

class DivinationQuickPrompt {
  final String icon;
  final String title;
  final String prompt;
  final String category;

  const DivinationQuickPrompt({
    required this.icon,
    required this.title,
    required this.prompt,
    required this.category,
  });
}

const List<DivinationQuickPrompt> kRoyalDivinationPrompts = [
  DivinationQuickPrompt(
    icon: '🔮',
    title: 'Thời vận tháng này',
    prompt: 'Xin Khâm Thiên Giám soi tỏ thời vận, cơ hội và hung cát trong tháng này của ta.',
    category: 'Thời Vận',
  ),
  DivinationQuickPrompt(
    icon: '⚔️',
    title: 'Công danh nên thủ hay công?',
    prompt: 'Trong giai đoạn này, sự nghiệp công danh của ta nên mở rộng đầu tư hay phòng thủ tích lũy?',
    category: 'Công Danh',
  ),
  DivinationQuickPrompt(
    icon: '💰',
    title: 'Kích hoạt Tài Bạch',
    prompt: 'Làm sao để kích hoạt cung Tài Bạch, thu hút tài lộc và hóa giải sao Hao Tài?',
    category: 'Tài Lộc',
  ),
  DivinationQuickPrompt(
    icon: '❤️',
    title: 'Duyên phận & hòa hợp',
    prompt: 'Phương pháp gia tăng hòa khí, giải trừ xung khắc vợ chồng hoặc tình duyên trong năm nay?',
    category: 'Tình Duyên',
  ),
  DivinationQuickPrompt(
    icon: '📜',
    title: 'Tử Vi trọn đời cốt lõi',
    prompt: 'Mệnh Thân của một người chịu chi phối thế nào bởi bộ sao Chính Tinh và Tứ Hóa?',
    category: 'Lý Số',
  ),
];
