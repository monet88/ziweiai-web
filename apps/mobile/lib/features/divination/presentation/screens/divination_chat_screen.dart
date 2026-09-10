import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ziweiai_mobile/core/presentation/widgets/voice_audio_player_bar.dart';
import 'package:ziweiai_mobile/core/services/voice_synthesis_service.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/features/divination/models/divination_message.dart';
import 'package:ziweiai_mobile/features/divination/providers/divination_chat_provider.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';
import 'package:ziweiai_mobile/ui/animated_background.dart';

class DivinationChatScreen extends ConsumerStatefulWidget {
  const DivinationChatScreen({super.key});

  @override
  ConsumerState<DivinationChatScreen> createState() => _DivinationChatScreenState();
}

class _DivinationChatScreenState extends ConsumerState<DivinationChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutQuad,
        );
      }
    });
  }

  void _handleSend([String? prefilledText, String? topic]) {
    final query = prefilledText ?? _textController.text;
    if (query.trim().isEmpty) return;

    final balance = ref.read(walletBalanceProvider).asData?.value ?? 0;
    if (balance < 1) {
      HapticFeedback.heavyImpact();
      _showInsufficientCoinsDialog();
      return;
    }

    HapticFeedback.mediumImpact();
    if (prefilledText == null) {
      _textController.clear();
    }
    ref.read(divinationChatProvider.notifier).sendMessage(query, topic: topic);
    _scrollToBottom();
  }

  void _showInsufficientCoinsDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cosmosElevated,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppTheme.glassBorderGold),
        ),
        title: const Row(
          children: [
            Text('🪙', style: TextStyle(fontSize: 24)),
            SizedBox(width: 8),
            Text(
              'Số Dư XU Không Đủ',
              style: TextStyle(
                color: AppTheme.goldBright,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: const Text(
          'Mỗi lượt vấn an Khâm Thiên Giám Ngự Phán Phòng cần 1 XU.\n'
          'Đại Hiệp hãy nạp thêm XU hoặc thực hiện nhiệm vụ / xem quảng cáo để nhận XU cát tường.',
          style: TextStyle(color: AppTheme.mysticalText, fontSize: 14, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Để sau', style: TextStyle(color: AppTheme.mysticalTextSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.mysticalGold,
              foregroundColor: AppTheme.cosmosDark,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              Navigator.of(ctx).pop();
              context.push('/wallet');
            },
            child: const Text('Vào Ví XU', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(divinationChatProvider);
    final walletBalance = ref.watch(walletBalanceProvider).asData?.value ?? 0;
    final voiceState = ref.watch(voiceSynthesisProvider);

    // Tự động cuộn xuống khi có tin nhắn mới hoặc đang stream
    ref.listen(divinationChatProvider, (previous, next) {
      if (previous?.messages.length != next.messages.length || next.isGenerating) {
        _scrollToBottom();
      }
      if (next.errorMessage != null && next.errorMessage != previous?.errorMessage) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.cosmosElevated,
            content: Text(
              next.errorMessage!,
              style: const TextStyle(color: AppTheme.cinnabarLight),
            ),
          ),
        );
        ref.read(divinationChatProvider.notifier).clearError();
      }
    });

    return Scaffold(
      backgroundColor: AppTheme.cosmosDark,
      appBar: AppBar(
        backgroundColor: AppTheme.cosmosDark.withValues(alpha: 0.9),
        elevation: 0,
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: AppTheme.goldBright, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.glassBorderGold),
                color: AppTheme.cosmosSurface,
              ),
              child: const Text('📜', style: TextStyle(fontSize: 16)),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Ngự Phán Phòng',
                    style: TextStyle(
                      color: AppTheme.goldBright,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                  Text(
                    'Khâm Thiên Giám Toàn Năng',
                    style: TextStyle(
                      color: AppTheme.mysticalTextSecondary,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // Badge Ví XU
          GestureDetector(
            onTap: () => context.push('/wallet'),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: AppTheme.cosmosElevated,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.glassBorderGold),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('🪙', style: TextStyle(fontSize: 14)),
                  const SizedBox(width: 4),
                  Text(
                    '$walletBalance XU',
                    style: const TextStyle(
                      color: AppTheme.goldBright,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Menu tùy chọn (Làm mới hội thoại)
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: AppTheme.goldBright),
            color: AppTheme.cosmosElevated,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: AppTheme.glassBorderGold),
            ),
            onSelected: (val) {
              if (val == 'clear') {
                HapticFeedback.mediumImpact();
                ref.read(divinationChatProvider.notifier).clearChat();
              }
            },
            itemBuilder: (ctx) => [
              const PopupMenuItem(
                value: 'clear',
                child: Row(
                  children: [
                    Icon(Icons.refresh_rounded, color: AppTheme.goldBright, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Làm mới hội thoại',
                      style: TextStyle(color: AppTheme.mysticalText, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: AnimatedBackground(
        child: Column(
          children: [
            // Thanh gợi ý Quick Prompts
            _buildQuickPromptsBar(chatState.isGenerating),

            // Danh sách tin nhắn
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                itemCount: chatState.messages.length,
                itemBuilder: (context, index) {
                  final message = chatState.messages[index];
                  return _buildMessageItem(message);
                },
              ),
            ),

            // Voice Audio Player Bar khi đang phát giọng nói
            if (!voiceState.isIdle) const VoiceAudioPlayerBar(),

            // Thanh nhập liệu Cung Đình
            _buildRoyalInputBar(chatState.isGenerating),
          ],
        ),
      ),
    );
  }

  /// Thanh dải gợi ý Quick Prompts
  Widget _buildQuickPromptsBar(bool isGenerating) {
    return Container(
      height: 44,
      margin: const EdgeInsets.only(top: 4, bottom: 4),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: kRoyalDivinationPrompts.length,
        itemBuilder: (context, index) {
          final prompt = kRoyalDivinationPrompts[index];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ActionChip(
              backgroundColor: AppTheme.cosmosElevated.withValues(alpha: 0.8),
              side: const BorderSide(color: AppTheme.glassBorderGold, width: 0.8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              avatar: Text(prompt.icon, style: const TextStyle(fontSize: 13)),
              label: Text(
                prompt.title,
                style: const TextStyle(
                  color: AppTheme.goldBright,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
              onPressed: isGenerating
                  ? null
                  : () => _handleSend(prompt.prompt, prompt.category),
            ),
          );
        },
      ),
    );
  }

  /// Khối tin nhắn
  Widget _buildMessageItem(DivinationMessage message) {
    if (message.isUser) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 16, left: 48),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.end,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Flexible(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.mysticalGold.withValues(alpha: 0.25),
                      AppTheme.cosmosElevated,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(4),
                    bottomLeft: Radius.circular(16),
                    bottomRight: Radius.circular(16),
                  ),
                  border: Border.all(color: AppTheme.glassBorderGold.withValues(alpha: 0.5)),
                ),
                child: Text(
                  message.content,
                  style: const TextStyle(
                    color: AppTheme.mysticalText,
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.glassBorderGold),
                color: AppTheme.cosmosSurface,
              ),
              alignment: Alignment.center,
              child: const Text('👤', style: TextStyle(fontSize: 15)),
            ),
          ],
        ),
      );
    }

    // Tin nhắn của Khâm Thiên Giám (Assistant)
    return Padding(
      padding: const EdgeInsets.only(bottom: 16, right: 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppTheme.glassBorderGold),
              gradient: CelestialGradients.imperialGold,
            ),
            alignment: Alignment.center,
            child: const Text('📜', style: TextStyle(fontSize: 16)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: AppTheme.cosmosSurface.withValues(alpha: 0.85),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(16),
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
                border: Border.all(color: AppTheme.glassBorderGold),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.mysticalGold.withValues(alpha: 0.05),
                    blurRadius: 10,
                    spreadRadius: 1,
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Nội dung tin nhắn
                  if (message.content.isEmpty && message.isStreaming)
                    const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppTheme.goldBright,
                          ),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Khâm Thiên Giám đang thẩm định càn khôn...',
                          style: TextStyle(
                            color: AppTheme.mysticalTextSecondary,
                            fontSize: 13,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    )
                  else
                    SelectableText(
                      message.content,
                      style: const TextStyle(
                        color: AppTheme.mysticalText,
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),

                  // Nút Nghe Giọng Hoàng Gia (Audio Playback)
                  if (message.content.isNotEmpty && !message.isStreaming) ...[
                    const SizedBox(height: 12),
                    const Divider(color: AppTheme.glassBorderGold, height: 1, thickness: 0.5),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Khâm Thiên Giám Ngự Bút',
                          style: TextStyle(
                            color: AppTheme.goldBright.withValues(alpha: 0.7),
                            fontSize: 11,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                        VoicePlayIconButton(
                          text: message.content,
                          title: 'Ngự Phán Toàn Năng',
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Thanh nhập liệu Cung Đình kèm huy hiệu 1 XU
  Widget _buildRoyalInputBar(bool isGenerating) {
    return Container(
      padding: EdgeInsets.only(
        left: 12,
        right: 12,
        top: 8,
        bottom: MediaQuery.of(context).padding.bottom + 8,
      ),
      decoration: BoxDecoration(
        color: AppTheme.cosmosDark.withValues(alpha: 0.95),
        border: const Border(
          top: BorderSide(color: AppTheme.glassBorderGold, width: 0.8),
        ),
      ),
      child: Row(
        children: [
          // Input Box
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.cosmosElevated,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppTheme.glassBorderGold.withValues(alpha: 0.6)),
              ),
              child: Row(
                children: [
                  const SizedBox(width: 12),
                  // Badge chi phí 1 XU
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.mysticalGold.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.glassBorderGold.withValues(alpha: 0.5)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('🪙', style: TextStyle(fontSize: 10)),
                        SizedBox(width: 2),
                        Text(
                          '1 XU',
                          style: TextStyle(
                            color: AppTheme.goldBright,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      focusNode: _focusNode,
                      style: const TextStyle(color: AppTheme.mysticalText, fontSize: 14),
                      decoration: const InputDecoration(
                        hintText: 'Vấn an càn khôn & tử vi...',
                        hintStyle: TextStyle(color: AppTheme.mysticalTextSecondary, fontSize: 13),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(vertical: 10),
                      ),
                      onSubmitted: isGenerating ? null : (_) => _handleSend(),
                    ),
                  ),
                  if (_textController.text.isNotEmpty)
                    IconButton(
                      icon: const Icon(Icons.clear, color: AppTheme.mysticalTextSecondary, size: 18),
                      onPressed: () {
                        _textController.clear();
                        setState(() {});
                      },
                    ),
                  const SizedBox(width: 4),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Nút gửi hoàng gia
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: isGenerating ? null : CelestialGradients.imperialGold,
              color: isGenerating ? AppTheme.cosmosElevated : null,
              boxShadow: isGenerating ? null : CelestialShadows.goldGlow,
            ),
            child: IconButton(
              icon: isGenerating
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppTheme.goldBright,
                      ),
                    )
                  : const Icon(Icons.send_rounded, color: AppTheme.cosmosDark, size: 20),
              onPressed: isGenerating ? null : () => _handleSend(),
            ),
          ),
        ],
      ),
    );
  }
}
