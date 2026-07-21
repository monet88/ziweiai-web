import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:go_router/go_router.dart';
import 'package:ziweiai_mobile/features/assistant/presentation/assistant_provider.dart';

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

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(assistantProvider);
    final notifier = ref.read(assistantProvider.notifier);

    // Listen to error to show snackbar
    ref.listen(assistantProvider, (previous, next) {
      if (next.errorMessage != null && next.errorMessage != previous?.errorMessage) {
        if (next.errorMessage!.contains('402') || next.errorMessage!.contains('PAYMENT_REQUIRED') || next.errorMessage!.contains('INSUFFICIENT_FUNDS')) {
          Navigator.of(context).pop(); // Đóng AssistantPanel
          context.push('/wallet'); // Chuyển hướng sang WalletScreen
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi: ${next.errorMessage}')),
          );
        }
      }
      if (next.messages.length != previous?.messages.length || next.isGenerating) {
        // give it a bit more time for the UI to lay out the new text/markdown
        Future.delayed(const Duration(milliseconds: 50), () {
          if (mounted) _scrollToBottom();
        });
      }
    });

    return Container(
      color: Colors.white,
      child: Column(
        children: [
          AppBar(
            title: const Text('Trợ lý AI'),
            automaticallyImplyLeading: false,
            actions: [
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(context).pop(),
              )
            ],
          ),
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: state.messages.length,
              itemBuilder: (context, index) {
                final msg = state.messages[index];
                final isUser = msg.role == 'user';
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isUser ? Colors.deepPurple.shade100 : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (msg.quickPromptKey != null) ...[
                          Text(msg.content, style: const TextStyle(fontWeight: FontWeight.bold)),
                        ] else ...[
                          MarkdownBody(
                            data: msg.content,
                            selectable: true,
                            styleSheet: MarkdownStyleSheet(
                              p: const TextStyle(fontSize: 16),
                            ),
                          ),
                        ],
                        if (msg.isStreaming) ...[
                          const SizedBox(height: 4),
                          const SizedBox(
                            width: 12,
                            height: 12,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ]
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          if (state.messages.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Wrap(
                spacing: 8,
                children: [
                  ActionChip(
                    label: const Text('Tổng quan'),
                    onPressed: state.isGenerating ? null : () => notifier.sendMessage(quickPromptKey: 'overview'),
                  ),
                  ActionChip(
                    label: const Text('Tình duyên'),
                    onPressed: state.isGenerating ? null : () => notifier.sendMessage(quickPromptKey: 'love'),
                  ),
                  ActionChip(
                    label: const Text('Sự nghiệp'),
                    onPressed: state.isGenerating ? null : () => notifier.sendMessage(quickPromptKey: 'career'),
                  ),
                ],
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(16).copyWith(bottom: MediaQuery.of(context).viewInsets.bottom + 16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    decoration: const InputDecoration(
                      hintText: 'Hỏi AI...',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (value) {
                      if (value.trim().isNotEmpty && !state.isGenerating) {
                        notifier.sendMessage(content: value.trim());
                        _textController.clear();
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send),
                  color: Colors.deepPurple,
                  onPressed: state.isGenerating
                      ? null
                      : () {
                          final value = _textController.text.trim();
                          if (value.isNotEmpty) {
                            notifier.sendMessage(content: value);
                            _textController.clear();
                          }
                        },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

void showAssistantPanel(BuildContext context, String chartSnapshotId) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) {
      return Padding(
        padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
        child: AssistantPanel(chartSnapshotId: chartSnapshotId),
      );
    },
  );
}
