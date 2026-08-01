import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../providers/tarot_provider.dart';


class TarotScreen extends ConsumerStatefulWidget {
  const TarotScreen({super.key});

  @override
  ConsumerState<TarotScreen> createState() => _TarotScreenState();
}

class _TarotScreenState extends ConsumerState<TarotScreen> {
  final _questionController = TextEditingController();
  bool _cardFlipped = false;

  void _drawCard() {
    if (_questionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập câu hỏi của bạn.')),
      );
      return;
    }
    
    // Hide keyboard
    FocusScope.of(context).unfocus();
    
    ref.read(tarotProvider.notifier).drawCard(_questionController.text);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tarotProvider);

    ref.listen(tarotProvider, (previous, next) {
      if (next.hasError) {
        final error = next.error;
        if (error is DioException && (error.response?.statusCode == 402 || error.response?.statusCode == 403)) {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Hết XU'),
              content: const Text('Tính năng Đọc Tarot yêu cầu 2 XU. Vui lòng nạp thêm XU để tiếp tục.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Đóng'),
                ),
              ],
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error.toString())),
          );
        }
      }
      
      if (next.hasValue && next.value != null) {
        setState(() {
          _cardFlipped = true;
        });
      } else if (next.isLoading) {
        setState(() {
          _cardFlipped = false; // Reset flip state when loading starts
        });
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Đọc bài Tarot'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              _questionController.clear();
              setState(() {
                _cardFlipped = false;
              });
              ref.read(tarotProvider.notifier).reset();
            },
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1A1A2E), Color(0xFF16213E)],
          ),
        ),
        child: SafeArea(
          child: state.hasValue && state.value != null && _cardFlipped
              ? _buildResult(state.value!)
              : _buildInputForm(state.isLoading),
        ),
      ),
    );
  }

  Widget _buildInputForm(bool isLoading) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Nhập câu hỏi của bạn',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          const Text(
            'Tập trung vào vấn đề bạn đang băn khoăn (Tình cảm, Công việc, Tài chính...) và đặt câu hỏi rõ ràng.',
            style: TextStyle(color: Colors.white70, fontSize: 16),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          TextField(
            controller: _questionController,
            maxLines: 3,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Ví dụ: Chuyện tình cảm của tôi trong tháng này sẽ ra sao?',
              hintStyle: const TextStyle(color: Colors.white38),
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.1),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 48),
          
          // Card back simulation
          GestureDetector(
            onTap: isLoading ? null : _drawCard,
            child: Container(
              height: 300,
              margin: const EdgeInsets.symmetric(horizontal: 48),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFFD700), width: 2),
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF2C3E50), Color(0xFF3498DB)],
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFFFD700).withValues(alpha: 0.3),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Center(
                child: isLoading
                    ? const CircularProgressIndicator(color: Color(0xFFFFD700))
                    : const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.auto_awesome, color: Color(0xFFFFD700), size: 48),
                          SizedBox(height: 16),
                          Text(
                            'Chạm để Rút Bài',
                            style: TextStyle(
                              color: Color(0xFFFFD700),
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            '(Tốn 2 XU)',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResult(dynamic result) {
    // result is TarotDraw
    final card = result.cards.first;
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Simulated flipped card
          Container(
            height: 300,
            margin: const EdgeInsets.symmetric(horizontal: 48),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFFFD700), width: 2),
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFFFD700).withValues(alpha: 0.5),
                  blurRadius: 30,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  card.name,
                  style: const TextStyle(
                    color: Colors.black87,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (card.reversed) ...[
                  const SizedBox(height: 8),
                  const Text(
                    '(Ngược - Reversed)',
                    style: TextStyle(
                      color: Colors.redAccent,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                const Icon(
                  Icons.auto_awesome,
                  color: Color(0xFFFFD700),
                  size: 64,
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white24),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.menu_book, color: Color(0xFFFFD700)),
                    SizedBox(width: 8),
                    Text(
                      'Thông Điệp Từ Tarot',
                      style: TextStyle(
                        color: Color(0xFFFFD700),
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                MarkdownBody(
                  data: result.narrative,
                  styleSheet: MarkdownStyleSheet(
                    p: const TextStyle(color: Colors.white, fontSize: 16, height: 1.5),
                    h1: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                    h2: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                    h3: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                    listBullet: const TextStyle(color: Colors.white),
                    strong: const TextStyle(color: Color(0xFFFFD700), fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
