import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_provider.dart';
import '../../wallet/providers/wallet_provider.dart';
import '../models/divination_message.dart';

class DivinationChatState {
  final List<DivinationMessage> messages;
  final bool isGenerating;
  final String? errorMessage;
  final int costPerQuery;

  const DivinationChatState({
    this.messages = const [],
    this.isGenerating = false,
    this.errorMessage,
    this.costPerQuery = 1,
  });

  DivinationChatState copyWith({
    List<DivinationMessage>? messages,
    bool? isGenerating,
    String? errorMessage,
    bool clearError = false,
    int? costPerQuery,
  }) {
    return DivinationChatState(
      messages: messages ?? this.messages,
      isGenerating: isGenerating ?? this.isGenerating,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      costPerQuery: costPerQuery ?? this.costPerQuery,
    );
  }
}

class DivinationChatNotifier extends Notifier<DivinationChatState> {
  StreamSubscription? _streamSubscription;

  static const String _kRoyalGreeting =
      '✦ **Khâm Thiên Giám Ngự Phán Phòng** kính chúc Đại Hiệp vạn sự an khang.\n\n'
      'Nơi đây lưu giữ toàn thư tinh tú, bát tự huyền vi và càn khôn biến hóa. '
      'Đại Hiệp muốn soi tỏ thời vận, cầu mưu sự nghiệp, kích hoạt tài lộc hay hóa giải xung khắc nhân duyên, xin hãy ngự phán ý chỉ.';

  @override
  DivinationChatState build() {
    ref.onDispose(() {
      _streamSubscription?.cancel();
    });

    final initialGreeting = DivinationMessage(
      id: 'greeting_${DateTime.now().millisecondsSinceEpoch}',
      role: 'assistant',
      content: _kRoyalGreeting,
      createdAt: DateTime.now(),
    );

    return DivinationChatState(messages: [initialGreeting]);
  }

  /// Gửi câu hỏi vấn an Khâm Thiên Giám (Mỗi lượt vấn an 1 XU)
  Future<bool> sendMessage(String text, {String? topic}) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || state.isGenerating) return false;

    // Kiểm tra số dư ví XU (chờ nếu đang load dữ liệu ví)
    final asyncBalance = ref.read(walletBalanceProvider);
    final currentBalance = asyncBalance.isLoading
        ? (await ref.read(walletBalanceProvider.future).catchError((_) => 0))
        : (asyncBalance.asData?.value ?? 0);

    if (currentBalance < state.costPerQuery) {
      state = state.copyWith(
        errorMessage: 'Số dư không đủ ($currentBalance XU). Cần 1 XU cho mỗi lượt vấn an.',
      );
      return false;
    }

    state = state.copyWith(isGenerating: true, clearError: true);

    // Tạo tin nhắn của User
    final userMsg = DivinationMessage(
      id: 'user_${DateTime.now().millisecondsSinceEpoch}',
      role: 'user',
      content: trimmed,
      createdAt: DateTime.now(),
      topic: topic,
    );

    // Placeholder cho câu trả lời của Khâm Thiên Giám
    final assistantMsgId = 'assistant_${DateTime.now().millisecondsSinceEpoch + 1}';
    final placeholderAssistantMsg = DivinationMessage(
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      createdAt: DateTime.now(),
      isStreaming: true,
      topic: topic,
    );

    state = state.copyWith(
      messages: [...state.messages, userMsg, placeholderAssistantMsg],
    );

    // Lấy phản hồi: Gọi backend nếu online, fallback sang rule-based nếu offline
    String fullResponse;
    try {
      final apiClient = ref.read(apiClientProvider);
      final res = await apiClient.sendDivinationChat(question: trimmed, topic: topic);
      fullResponse = (res['answer'] as String?) ?? _generateRoyalAnswer(trimmed, topic: topic);
      ref.read(walletControllerProvider).refresh();
    } catch (_) {
      fullResponse = _generateRoyalAnswer(trimmed, topic: topic);
    }

    // Stream phản hồi hoàng gia uyên bác
    await _streamRoyalDivinationResponse(assistantMsgId, fullResponse);
    return true;
  }

  /// Stream mô phỏng phản hồi uyên bác từ Khâm Thiên Giám
  Future<void> _streamRoyalDivinationResponse(
    String messageId,
    String fullResponse,
  ) async {
    // Cắt theo từng cụm hoặc ký tự để tạo hiệu ứng viết ngự bút
    final buffer = StringBuffer();
    final words = fullResponse.split(' ');

    for (int i = 0; i < words.length; i++) {
      if (!state.isGenerating) break; // Người dùng hủy

      buffer.write(words[i]);
      if (i < words.length - 1) buffer.write(' ');

      // Cập nhật nội dung đang stream
      final updatedMessages = state.messages.map((msg) {
        if (msg.id == messageId) {
          return msg.copyWith(
            content: buffer.toString(),
            isStreaming: true,
          );
        }
        return msg;
      }).toList();

      state = state.copyWith(messages: updatedMessages);

      // Nhịp gõ bút mô phỏng tự nhiên
      await Future.delayed(const Duration(milliseconds: 30));
    }

    // Kết thúc stream
    final finalMessages = state.messages.map((msg) {
      if (msg.id == messageId) {
        return msg.copyWith(
          content: fullResponse,
          isStreaming: false,
        );
      }
      return msg;
    }).toList();

    state = state.copyWith(
      messages: finalMessages,
      isGenerating: false,
    );
  }

  /// Khởi tạo câu trả lời chuẩn xác, đậm chất huyền học cung đình
  String _generateRoyalAnswer(String query, {String? topic}) {
    final lower = query.toLowerCase();

    if (lower.contains('thời vận') || lower.contains('tháng') || topic == 'Thời Vận') {
      return '🔮 **KHÂM THIÊN GIÁM NGỰ PHÁN — THỜI VẬN CHI TIẾT**\n\n'
          '✦ **1. Khí Vận Càn Khôn:**\n'
          'Thời điểm này Thiên can Địa chi tương hòa, cung Vận của Đại Hiệp đang đón nhận ánh quang của bộ sao Thái Dương & Hóa Lộc. '
          'Năng lượng vũ trụ đang chuyển dịch từ tĩnh sang động, báo hiệu những chuyển biến tích cực trong phương hướng hành động.\n\n'
          '✦ **2. Hung Cát Phương Vị:**\n'
          '• **Cát tinh chiếu mệnh:** Tả Phù, Hữu Bật trợ lực quý nhân, dễ gặp người cùng chí hướng nâng đỡ.\n'
          '• **Điểm cần đề phòng:** Hóa Kỵ ngấm ngầm tại tam phương tứ chính, chớ nên nhẹ dạ ký kết văn bản lớn vào những ngày sóc vọng (mùng 1, rằm).\n\n'
          '✦ **3. Ngự Bút Chỉ Điểm:**\n'
          'Nên chủ động xuất kích trong tuần thứ 2 của tháng, hướng Đông Nam mang lại hỷ khí. Giữ tâm trí bình thản thì tai ương tự hóa cát tường.';
    }

    if (lower.contains('công danh') || lower.contains('thủ') || lower.contains('công') || topic == 'Công Danh') {
      return '⚔️ **KHÂM THIÊN GIÁM NGỰ PHÁN — CÔNG DANH & MƯU SỰ**\n\n'
          '✦ **1. Thế Cờ Sự Nghiệp:**\n'
          'Quan Lộc cung hiện hữu tượng "Tiên Trở Hậu Thành". Vũ Khúc kết hợp Thiên Phủ chủ về quyền biến và quản lý chặt chẽ. '
          'Lúc này không nên vội vã bành trướng quy mô mà cần **củng cố nội lực, kiện toàn cơ cấu**.\n\n'
          '✦ **2. Chiến Lược Dụng Nhân:**\n'
          'Cẩn trọng người bên tả có ý dòm ngó. Mọi quyết định trọng đại phải dựa trên số liệu thực tế, tránh cảm tính.\n\n'
          '✦ **3. Lời Khuyên Quyết Đoán:**\n'
          'Nửa đầu giai đoạn nên **THỦ** để dưỡng khí, từ trung tuần trở đi gặp cơ duyên mới chuyển sang **CÔNG**. "Gió chưa nổi, chớ vội dong buồm".';
    }

    if (lower.contains('tài') || lower.contains('tiền') || lower.contains('lộc') || topic == 'Tài Lộc') {
      return '💰 **KHÂM THIÊN GIÁM NGỰ PHÁN — KÍCH HOẠT TÀI BẠCH**\n\n'
          '✦ **1. Bản Đồ Tài Lực:**\n'
          'Cung Tài Bạch tọa ngự thế Tài Tinh triều củng, tuy nhiên có ám hao của Tiểu Hao. Tiền tài tụ tán bất thường, kiếm được ắt có mối hao hụt tương ứng.\n\n'
          '✦ **2. Phương Pháp Tụ Khí Sinh Tài:**\n'
          '• Tránh đầu tư rủi ro cao hoặc cho vay mượn thiếu cam kết rõ ràng.\n'
          '• Gia tăng năng lượng tích lũy vàng ròng hoặc tài sản phòng hộ dài hạn.\n\n'
          '✦ **3. Pháp Khí Hóa Giải:**\n'
          'Đặt bàn làm việc hướng Sinh Khí, bài trí vật phẩm hành Kim hoặc Thủy tương sinh để thu hút trường khí thịnh vượng.';
    }

    if (lower.contains('duyên') || lower.contains('tình') || lower.contains('vợ') || lower.contains('chồng') || topic == 'Tình Duyên') {
      return '❤️ **KHÂM THIÊN GIÁM NGỰ PHÁN — HÒA HỢP NHÂN DUYÊN**\n\n'
          '✦ **1. Tương Hợp Cung Phu Thê:**\n'
          'Phu Thê cung chịu ảnh hưởng của Thiên Đồng và Hóa Khoa. Tình cảm vốn có gốc rễ sâu sắc, nhưng dễ phát sinh mâu thuẫn từ những bất đồng ngôn từ vụn vặt.\n\n'
          '✦ **2. Căn Nguyên Xung Khắc:**\n'
          'Đôi bên đều có cá tính độc lập và lòng tự tôn cao. Sao Cự Môn chiếu rọi khiến lời nói thiếu kiên nhẫn dễ biến thành gai nhọn.\n\n'
          '✦ **3. Diệu Kế Hòa Hợp:**\n'
          'Lấy sự lắng nghe làm cầu nối. Hãy cùng nhau đi dạo bên non nước tĩnh lặng để cân bằng Thủy khí, hóa giải Hỏa khí xung đột.';
    }

    return '📜 **KHÂM THIÊN GIÁM NGỰ PHÁN — TỬ VI CHIÊM BÁI**\n\n'
        '✦ **1. Huyền Cơ Chiếu Rọi:**\n'
        'Qua câu hỏi của Đại Hiệp, tinh bàn hiển lộ mối tương quan mật thiết giữa nội tâm và ngoại cảnh. Mọi hiện tượng gặp phải đều bắt nguồn từ nhân quả vận động của Mệnh và Vận.\n\n'
        '✦ **2. Điểm Tựa Bản Mệnh:**\n'
        'Bản mệnh kiên cường, nội lực dồi dào. Khó khăn trước mắt chỉ là phép thử để mài giũa viên ngọc quý trong tâm trí người.\n\n'
        '✦ **3. Ngự Ý Gửi Trao:**\n'
        '"Tận nhân lực, tri thiên mệnh". Hãy vững tin vào đường hướng chính đạo, chư vị cát tinh luôn âm thầm tương trợ người có lòng kiên định.';
  }

  /// Reset lại hội thoại về lời chào hoàng gia ban đầu
  void clearChat() {
    _streamSubscription?.cancel();
    final greeting = DivinationMessage(
      id: 'greeting_${DateTime.now().millisecondsSinceEpoch}',
      role: 'assistant',
      content: _kRoyalGreeting,
      createdAt: DateTime.now(),
    );
    state = DivinationChatState(messages: [greeting]);
  }

  /// Dừng tiến trình sinh chữ
  void stopGeneration() {
    _streamSubscription?.cancel();
    state = state.copyWith(isGenerating: false);
  }

  /// Xóa thông báo lỗi
  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

final divinationChatProvider =
    NotifierProvider<DivinationChatNotifier, DivinationChatState>(
  DivinationChatNotifier.new,
);
