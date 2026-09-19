import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

class SseTransformer extends StreamTransformerBase<Uint8List, String> {
  const SseTransformer();

  @override
  Stream<String> bind(Stream<Uint8List> stream) {
    return Stream.eventTransformed(
      stream,
      (sink) => _SseEventSink(sink),
    );
  }
}

class _SseEventSink implements EventSink<Uint8List> {
  final EventSink<String> _outputSink;
  final Utf8Decoder _decoder = const Utf8Decoder();
  String _buffer = '';

  _SseEventSink(this._outputSink);

  @override
  void add(Uint8List event) {
    _buffer += _decoder.convert(event);
    _buffer = _buffer.replaceAll('\r\n', '\n');

    int idx;
    while ((idx = _buffer.indexOf('\n\n')) != -1) {
      final frame = _buffer.substring(0, idx);
      _buffer = _buffer.substring(idx + 2);

      final dataLines = frame
          .split('\n')
          .where((l) => l.startsWith('data:'))
          .map((l) => l.replaceFirst(RegExp(r'^data:\s?'), ''))
          .toList();

      if (dataLines.isEmpty) continue;

      final payload = dataLines.join('\n');
      _outputSink.add(payload);
    }
  }

  @override
  void addError(Object error, [StackTrace? stackTrace]) {
    _outputSink.addError(error, stackTrace);
  }

  @override
  void close() {
    if (_buffer.isNotEmpty) {
      // Flush anything left if it starts with data:
      final dataLines = _buffer
          .split('\n')
          .where((l) => l.startsWith('data:'))
          .map((l) => l.replaceFirst(RegExp(r'^data:\s?'), ''))
          .toList();

      if (dataLines.isNotEmpty) {
        final payload = dataLines.join('\n');
        _outputSink.add(payload);
      }
    }
    _outputSink.close();
  }
}
