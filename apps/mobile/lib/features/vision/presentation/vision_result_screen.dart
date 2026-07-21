import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

class VisionResultScreen extends StatelessWidget {
  final Map<String, dynamic> result;
  
  const VisionResultScreen({
    super.key,
    required this.result,
  });

  @override
  Widget build(BuildContext context) {
    final narrative = result['narrative'] as String? ?? 'Không có dữ liệu luận giải.';
    
    final kindString = result['kind'] as String?;
    String title = 'Kết quả phân tích';
    if (kindString == 'face') title = 'Kết quả Xem Tướng Mặt';
    if (kindString == 'palm') title = 'Kết quả Xem Chỉ Tay';
    if (kindString == 'tarot') title = 'Kết quả Đọc Bài Tarot';

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12.0),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(13), // ~0.05 opacity
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: MarkdownBody(
                data: narrative,
                selectable: true,
                styleSheet: MarkdownStyleSheet(
                  p: const TextStyle(fontSize: 16, height: 1.5),
                  h1: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, height: 1.5),
                  h2: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, height: 1.5),
                  h3: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, height: 1.5),
                  listBullet: const TextStyle(fontSize: 16, height: 1.5),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
