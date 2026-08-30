import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:ziweiai_mobile/core/theme/app_theme.dart';
import 'package:ziweiai_mobile/features/assistant/presentation/assistant_provider.dart';
import 'package:ziweiai_mobile/core/presentation/widgets/voice_audio_player_bar.dart';


class AssistantPanel extends ConsumerStatefulWidget {
  final String chartSnapshotId;

  const AssistantPanel({super.key, required this.chartSnapshotId});

  @override
  ConsumerState<AssistantPanel> createState() => _AssistantPanelState();
}

class _AssistantPanelState extends ConsumerState<AssistantPanel> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(assistantProvider.notifier).init(widget.chartSnapshotId);
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage({String? content, String? quickPromptKey}) {
    HapticFeedback.lightImpact();
    final notifier = ref.read(assistantProvider.notifier);
    if (quickPromptKey != null) {
      notifier.sendMessage(quickPromptKey: quickPromptKey);
    } else if (content != null && content.trim().isNotEmpty) {
      notifier.sendMessage(content: content.trim());
      _textController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(assistantProvider);

    ref.listen(assistantProvider, (previous, next) {
      if (next.errorMessage != null && next.errorMessage != previous?.errorMessage) {
        if (next.errorMessage!.contains('402') ||
            next.errorMessage!.contains('PAYMENT_REQUIRED') ||
            next.errorMessage!.contains('INSUFFICIENT_FUNDS')) {
          Navigator.of(context).pop();
          context.push('/wallet');
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(next.errorMessage!),
              backgroundColor: AppTheme.cosmosElevated,
            ),
          );
        }
      }
      if (next.messages.length != previous?.messages.length || next.isGenerating) {
        Future.delayed(const Duration(milliseconds: 60), () {
          if (mounted) _scrollToBottom();
        });
      }
    });

    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.cosmosDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Header Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: AppTheme.cosmosSurface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              border: Border(
                bottom: BorderSide(
                  color: AppTheme.mysticalGold.withValues(alpha: 0.2),
                  width: 1,
                ),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: CelestialGradients.imperialGold,
                    boxShadow: CelestialShadows.goldGlow,
                  ),
                  child: const Icon(Icons.auto_awesome, size: 18, color: Color(0xFF141026)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Trợ Lý Tử Vi AI',
                        style: GoogleFonts.cinzel(
                          color: AppTheme.goldBright,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Luận giải chuyên sâu & đối thoại thời gian thực',
                        style: TextStyle(
                          color: AppTheme.mysticalTextSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: AppTheme.mysticalTextSecondary),
                  onPressed: () => Navigator.of(context).pop(),
                  tooltip: 'Đóng',
                ),
              ],
            ),
          ),

          // Messages List
          Expanded(
            child: state.messages.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppTheme.cosmosElevated.withValues(alpha: 0.5),
                              border: Border.all(
                                color: AppTheme.mysticalGold.withValues(alpha: 0.3),
                                width: 1.5,
                              ),
                            ),
                            child: const Icon(
                              Icons.chat_bubble_outline,
                              size: 40,
                              color: AppTheme.goldBright,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Bạn muốn hỏi gì về lá số này?',
                            style: GoogleFonts.cinzel(
                              color: AppTheme.goldBright,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Chọn gợi ý bên dưới hoặc tự nhập câu hỏi để Trợ Lý AI giải đáp chi tiết.',
                            style: TextStyle(
                              color: AppTheme.mysticalTextSecondary,
                              fontSize: 13,
                              height: 1.4,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: state.messages.length,
                    itemBuilder: (context, index) {
                      final msg = state.messages[index];
                      final isUser = msg.role == 'user';

                      return Align(
                        alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 14),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            gradient: isUser ? CelestialGradients.imperialGold : null,
                            color: isUser ? null : AppTheme.cosmosSurface,
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(18),
                              topRight: const Radius.circular(18),
                              bottomLeft: Radius.circular(isUser ? 18 : 4),
                              bottomRight: Radius.circular(isUser ? 4 : 18),
                            ),
                            border: Border.all(
                              color: isUser
                                  ? Colors.transparent
                                  : AppTheme.mysticalGold.withValues(alpha: 0.25),
                              width: 1,
                            ),
                            boxShadow: isUser
                                ? CelestialShadows.goldGlow
                                : [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.3),
                                      blurRadius: 8,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                          ),
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.of(context).size.width * 0.85,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (msg.quickPromptKey != null) ...[
                                Text(
                                  msg.content,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: isUser ? const Color(0xFF141026) : AppTheme.goldBright,
                                    fontSize: 15,
                                  ),
                                ),
                              ] else ...[
                                MarkdownBody(
                                  data: msg.content,
                                  selectable: true,
                                  styleSheet: MarkdownStyleSheet(
                                    p: TextStyle(
                                      fontSize: 14,
                                      height: 1.5,
                                      color: isUser
                                          ? const Color(0xFF141026)
                                          : AppTheme.mysticalText,
                                    ),
                                    h1: GoogleFonts.cinzel(
                                      color: isUser ? const Color(0xFF141026) : AppTheme.goldBright,
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    h2: GoogleFonts.cinzel(
                                      color: isUser ? const Color(0xFF141026) : AppTheme.goldBright,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    h3: TextStyle(
                                      color: isUser ? const Color(0xFF141026) : AppTheme.goldBright,
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    listBullet: TextStyle(
                                      color: isUser ? const Color(0xFF141026) : AppTheme.goldBright,
                                    ),
                                    strong: TextStyle(
                                      color: isUser ? const Color(0xFF141026) : AppTheme.goldBright,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                              if (!isUser && !msg.isStreaming && msg.content.trim().isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: VoicePlayIconButton(
                                    text: msg.content,
                                    title: 'Trợ Lý Tử Vi AI',
                                  ),
                                ),
                              ],
                              if (msg.isStreaming) ...[
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const SizedBox(
                                      width: 12,
                                      height: 12,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: AppTheme.goldBright,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Đang suy nghĩ...',
                                      style: TextStyle(
                                        color: AppTheme.mysticalGold.withValues(alpha: 0.8),
                                        fontSize: 11,
                                        fontStyle: FontStyle.italic,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Voice Audio Player Bar
          const VoiceAudioPlayerBar(),

          // Quick prompt chips
          if (state.messages.isEmpty)

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildQuickChip('🔮 Tổng quan lá số', 'overview', state.isGenerating),
                  _buildQuickChip('❤️ Tình duyên & Hôn nhân', 'love', state.isGenerating),
                  _buildQuickChip('💼 Sự nghiệp & Tài vận', 'career', state.isGenerating),
                ],
              ),
            ),

          // Input field
          Container(
            padding: EdgeInsets.fromLTRB(
              16,
              12,
              16,
              MediaQuery.of(context).viewInsets.bottom + 16,
            ),
            decoration: BoxDecoration(
              color: AppTheme.cosmosSurface,
              border: Border(
                top: BorderSide(
                  color: AppTheme.mysticalGold.withValues(alpha: 0.15),
                  width: 1,
                ),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    style: const TextStyle(color: AppTheme.mysticalText, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Nhập câu hỏi cho AI...',
                      hintStyle: const TextStyle(color: Colors.white30, fontSize: 14),
                      filled: true,
                      fillColor: AppTheme.cosmosElevated.withValues(alpha: 0.7),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide(
                          color: AppTheme.mysticalGold.withValues(alpha: 0.25),
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide(
                          color: AppTheme.mysticalGold.withValues(alpha: 0.2),
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: const BorderSide(
                          color: AppTheme.goldBright,
                          width: 1.5,
                        ),
                      ),
                    ),
                    onSubmitted: (value) {
                      if (!state.isGenerating) {
                        _sendMessage(content: value);
                      }
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: state.isGenerating ? null : CelestialGradients.imperialGold,
                    color: state.isGenerating ? AppTheme.cosmosElevated : null,
                    boxShadow: state.isGenerating ? null : CelestialShadows.goldGlow,
                  ),
                  child: IconButton(
                    icon: state.isGenerating
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppTheme.goldBright,
                            ),
                          )
                        : const Icon(Icons.send_rounded, color: Color(0xFF141026), size: 20),
                    onPressed: state.isGenerating
                        ? null
                        : () => _sendMessage(content: _textController.text),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickChip(String label, String key, bool isGenerating) {
    return ActionChip(
      backgroundColor: AppTheme.cosmosElevated.withValues(alpha: 0.7),
      side: BorderSide(color: AppTheme.mysticalGold.withValues(alpha: 0.35)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      label: Text(
        label,
        style: const TextStyle(
          color: AppTheme.goldBright,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
      onPressed: isGenerating ? null : () => _sendMessage(quickPromptKey: key),
    );
  }
}

void showAssistantPanel(BuildContext context, String chartSnapshotId) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (context) {
      return Padding(
        padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
        child: AssistantPanel(chartSnapshotId: chartSnapshotId),
      );
    },
  );
}
