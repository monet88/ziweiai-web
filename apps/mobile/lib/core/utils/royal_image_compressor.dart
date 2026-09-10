import 'dart:developer';
import 'dart:typed_data';
import 'package:flutter_image_compress/flutter_image_compress.dart';

/// Kết quả nén ảnh chứa bytes thực tế và metadata định dạng chuẩn xác
class CompressedImageResult {
  final Uint8List bytes;
  final String actualFormat; // 'webp' | 'png'
  final String mimeType; // 'image/webp' | 'image/png'
  final String fileExtension; // 'webp' | 'png'

  const CompressedImageResult({
    required this.bytes,
    required this.actualFormat,
    required this.mimeType,
    required this.fileExtension,
  });

  bool get isWebp => actualFormat == 'webp';
  bool get isPng => actualFormat == 'png';
}

/// Bộ tiện ích nén ảnh thiệp Hoàng Triều sang chuẩn WebP thế hệ mới (Sprint 60)
/// Đảm bảo tính trung thực định dạng: Nếu fallback về PNG thì trả về extension & mimeType là PNG
class RoyalImageCompressor {
  /// Kiểm tra magic bytes xem mảng bytes có thực sự là WebP không ('RIFF'....'WEBP')
  static bool isWebpBytes(Uint8List bytes) {
    if (bytes.length < 12) return false;
    return bytes[0] == 0x52 && // R
        bytes[1] == 0x49 && // I
        bytes[2] == 0x46 && // F
        bytes[3] == 0x46 && // F
        bytes[8] == 0x57 && // W
        bytes[9] == 0x45 && // E
        bytes[10] == 0x42 && // B
        bytes[11] == 0x50; // P
  }

  /// Nén mảng bytes ảnh (thường là PNG từ screenshot) sang WebP
  /// Trả về CompressedImageResult để client biết chính xác định dạng thực tế
  static Future<CompressedImageResult> compress(
    Uint8List rawBytes, {
    int quality = 85,
    int minWidth = 1080,
    int minHeight = 1920,
  }) async {
    if (rawBytes.isEmpty) {
      return CompressedImageResult(
        bytes: Uint8List(0),
        actualFormat: 'png',
        mimeType: 'image/png',
        fileExtension: 'png',
      );
    }

    try {
      final compressed = await FlutterImageCompress.compressWithList(
        rawBytes,
        quality: quality,
        minWidth: minWidth,
        minHeight: minHeight,
        format: CompressFormat.webp,
      );

      // Nếu nén thành công, bytes hợp lệ WebP và kích thước nhỏ hơn bản gốc
      if (compressed.isNotEmpty &&
          compressed.length < rawBytes.length &&
          isWebpBytes(compressed)) {
        log(
          '[RoyalImageCompressor] Nén WebP thành công: ${(rawBytes.length / 1024).toStringAsFixed(1)} KB -> ${(compressed.length / 1024).toStringAsFixed(1)} KB (giảm ${((1 - compressed.length / rawBytes.length) * 100).toStringAsFixed(1)}%)',
        );
        return CompressedImageResult(
          bytes: compressed,
          actualFormat: 'webp',
          mimeType: 'image/webp',
          fileExtension: 'webp',
        );
      }

      // Nếu nén không nhỏ hơn bản gốc hoặc không phải WebP hợp lệ
      return CompressedImageResult(
        bytes: rawBytes,
        actualFormat: 'png',
        mimeType: 'image/png',
        fileExtension: 'png',
      );
    } catch (e) {
      // Graceful fallback: Nếu môi trường chạy unit test hoặc không có native codec, trả về PNG
      log('[RoyalImageCompressor] Native WebP compression fallback: $e');
      return CompressedImageResult(
        bytes: rawBytes,
        actualFormat: 'png',
        mimeType: 'image/png',
        fileExtension: 'png',
      );
    }
  }

  /// Giữ hàm compressToWebp để tương thích ngược nếu cần, nhưng khuyến khích dùng compress()
  static Future<Uint8List> compressToWebp(
    Uint8List rawBytes, {
    int quality = 85,
    int minWidth = 1080,
    int minHeight = 1920,
  }) async {
    final result = await compress(
      rawBytes,
      quality: quality,
      minWidth: minWidth,
      minHeight: minHeight,
    );
    return result.bytes;
  }
}
