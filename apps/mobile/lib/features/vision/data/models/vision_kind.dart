enum VisionKind {
  face,
  palm,
  tarot,
}

extension VisionKindExtension on VisionKind {
  String get name {
    switch (this) {
      case VisionKind.face:
        return 'face';
      case VisionKind.palm:
        return 'palm';
      case VisionKind.tarot:
        return 'tarot';
    }
  }

  String get label {
    switch (this) {
      case VisionKind.face:
        return 'Xem Tướng Mặt';
      case VisionKind.palm:
        return 'Xem Chỉ Tay';
      case VisionKind.tarot:
        return 'Đọc Bài Tarot';
    }
  }
}
