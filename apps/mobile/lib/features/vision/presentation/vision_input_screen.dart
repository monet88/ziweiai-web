import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';
import '../data/models/vision_kind.dart';
import 'vision_provider.dart';

class VisionInputScreen extends ConsumerStatefulWidget {
  final VisionKind kind;

  const VisionInputScreen({super.key, required this.kind});

  @override
  ConsumerState<VisionInputScreen> createState() => _VisionInputScreenState();
}

class _VisionInputScreenState extends ConsumerState<VisionInputScreen> {
  File? _selectedImage;
  final _questionController = TextEditingController();

  Future<void> _pickImage(ImageSource source) async {
    final file = await ref.read(visionProvider.notifier).pickAndProcessImage(source);
    if (file != null) {
      setState(() {
        _selectedImage = file;
      });
    }
  }

  void _analyze() {
    if (_selectedImage == null) return;
    
    ref.read(visionProvider.notifier).analyzeImage(
      kind: widget.kind,
      imagePath: _selectedImage!.path,
      question: _questionController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(visionProvider);

    ref.listen<AsyncValue<Map<String, dynamic>?>>(visionProvider, (previous, next) {
      if (next.hasValue && next.value != null && !next.isLoading) {
        if (mounted) {
          context.pushReplacement('/vision/result', extra: next.value);
        }
      } else if (next.hasError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: ${next.error}')),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.kind.label),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_selectedImage != null) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(8.0),
                child: Image.file(
                  _selectedImage!,
                  height: 300,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Chụp lại'),
                      onPressed: state.isLoading ? null : () => _pickImage(ImageSource.camera),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.photo_library),
                      label: const Text('Chọn lại'),
                      onPressed: state.isLoading ? null : () => _pickImage(ImageSource.gallery),
                    ),
                  ),
                ],
              ),
            ] else ...[
              Container(
                height: 300,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(8.0),
                  border: Border.all(color: Colors.grey[400]!),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.image, size: 64, color: Colors.grey[500]),
                    const SizedBox(height: 16),
                    const Text('Vui lòng chọn ảnh'),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ElevatedButton.icon(
                          icon: const Icon(Icons.camera_alt),
                          label: const Text('Camera'),
                          onPressed: () => _pickImage(ImageSource.camera),
                        ),
                        const SizedBox(width: 16),
                        ElevatedButton.icon(
                          icon: const Icon(Icons.photo_library),
                          label: const Text('Thư viện'),
                          onPressed: () => _pickImage(ImageSource.gallery),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),
            TextField(
              controller: _questionController,
              decoration: const InputDecoration(
                labelText: 'Câu hỏi (Tuỳ chọn)',
                hintText: 'Ví dụ: Sự nghiệp năm nay của tôi thế nào?',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: (_selectedImage == null || state.isLoading) ? null : _analyze,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: state.isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Phân tích ngay (10 XU)', style: TextStyle(fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }
}
