import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:ziweiai_mobile/core/api/sse_transformer.dart';

void main() {
  group('SseTransformer', () {
    test('transforms complete SSE chunks correctly', () async {
      final input = Stream.fromIterable([
        utf8.encode('data: {"type": "chunk", "delta": "Hello"}\n\n'),
        utf8.encode('data: {"type": "done"}\n\n'),
      ]);

      final results = await input.transform(const SseTransformer()).toList();

      expect(results.length, 2);
      expect(results[0], '{"type": "chunk", "delta": "Hello"}');
      expect(results[1], '{"type": "done"}');
    });

    test('handles split chunks across events', () async {
      final input = Stream.fromIterable([
        utf8.encode('data: {"type": "ch'),
        utf8.encode('unk", "delta": "Split"}\n\n'),
      ]);

      final results = await input.transform(const SseTransformer()).toList();

      expect(results.length, 1);
      expect(results[0], '{"type": "chunk", "delta": "Split"}');
    });

    test('handles multiple frames in a single event', () async {
      final input = Stream.fromIterable([
        utf8.encode('data: {"type": "chunk"}\n\ndata: {"type": "done"}\n\n'),
      ]);

      final results = await input.transform(const SseTransformer()).toList();

      expect(results.length, 2);
      expect(results[0], '{"type": "chunk"}');
      expect(results[1], '{"type": "done"}');
    });

    test('ignores non-data lines', () async {
      final input = Stream.fromIterable([
        utf8.encode(': keepalive\ndata: {"type": "chunk"}\n\n'),
      ]);

      final results = await input.transform(const SseTransformer()).toList();

      expect(results.length, 1);
      expect(results[0], '{"type": "chunk"}');
    });

    test('flushes trailing data without newline on close', () async {
      final input = Stream.fromIterable([
        utf8.encode('data: {"type": "done"}'),
      ]);

      final results = await input.transform(const SseTransformer()).toList();

      expect(results.length, 1);
      expect(results[0], '{"type": "done"}');
    });
  });
}
