import 'dart:convert';

/// Loại thiệp Hoàng Triều
enum RoyalCardType {
  ziwei,
  sacredStick,
  tarot,
  iching,
}

extension RoyalCardTypeX on RoyalCardType {
  String get displayName {
    switch (this) {
      case RoyalCardType.ziwei:
        return 'Chiếu Chỉ Tử Vi';
      case RoyalCardType.sacredStick:
        return 'Thẻ Quẻ Thánh';
      case RoyalCardType.tarot:
        return 'Tarot Cung Đình';
      case RoyalCardType.iching:
        return 'Lục Hào Chiêm Bốc';
    }
  }

  String get iconAsset {
    switch (this) {
      case RoyalCardType.ziwei:
        return '📜';
      case RoyalCardType.sacredStick:
        return '🎋';
      case RoyalCardType.tarot:
        return '🔮';
      case RoyalCardType.iching:
        return '🪙';
    }
  }
}

/// Tỉ lệ xuất thiệp Hoàng Triều
enum RoyalAspectRatio {
  standard, // 3:4 chuẩn văn bản / card
  story9_16, // 9:16 tối ưu cho Facebook/Instagram/TikTok Story
}

extension RoyalAspectRatioX on RoyalAspectRatio {
  String get label {
    switch (this) {
      case RoyalAspectRatio.standard:
        return 'Chuẩn Văn Bản (3:4)';
      case RoyalAspectRatio.story9_16:
        return 'Story Hoàng Triều (9:16)';
    }
  }
}

/// Danh mục Ấn Triện Hoàng Gia
enum RoyalSealType {
  khamThien, // KHÂM THIÊN / NGỰ BÚT
  menhChu,   // MỆNH CHỦ / CHI BẢO
  linhXam,   // LINH XĂM / TRẤN BẢO
  huyenCo,   // HUYỀN CƠ / TRẤN BẢO
  custom,    // Tên tùy biến người dùng
}

extension RoyalSealTypeX on RoyalSealType {
  (String, String) get lines {
    switch (this) {
      case RoyalSealType.khamThien:
        return ('KHÂM THIÊN', 'NGỰ BÚT');
      case RoyalSealType.menhChu:
        return ('MỆNH CHỦ', 'CHI BẢO');
      case RoyalSealType.linhXam:
        return ('LINH XĂM', 'TRẤN BẢO');
      case RoyalSealType.huyenCo:
        return ('HUYỀN CƠ', 'TRẤN BẢO');
      case RoyalSealType.custom:
        return ('NGỰ BÚT', 'BẢO CHỨNG');
    }
  }

  String get label {
    switch (this) {
      case RoyalSealType.khamThien:
        return 'Khâm Thiên Ngự Bút';
      case RoyalSealType.menhChu:
        return 'Mệnh Chủ Chi Bảo';
      case RoyalSealType.linhXam:
        return 'Linh Xăm Trấn Bảo';
      case RoyalSealType.huyenCo:
        return 'Huyền Cơ Trấn Bảo';
      case RoyalSealType.custom:
        return 'Ấn Danh Xưng Tùy Biến';
    }
  }
}

/// Bản ghi lưu trữ trong Thư Viện Hoàng Triều (Imperial Share Gallery)
class RoyalShareItem {
  final String id;
  final String title;
  final RoyalCardType type;
  final DateTime createdAt;
  final String imagePath;
  final String? storagePath;
  final String? imageUrl;
  final DateTime? updatedAt;
  final DateTime? deletedAt;
  final String? subtitle;
  final RoyalAspectRatio aspectRatio;
  final String? customSealName;

  const RoyalShareItem({
    required this.id,
    required this.title,
    required this.type,
    required this.createdAt,
    required this.imagePath,
    this.storagePath,
    this.imageUrl,
    this.updatedAt,
    this.deletedAt,
    this.subtitle,
    this.aspectRatio = RoyalAspectRatio.standard,
    this.customSealName,
  });

  bool get isDeleted => deletedAt != null;

  RoyalShareItem copyWith({
    String? id,
    String? title,
    RoyalCardType? type,
    DateTime? createdAt,
    String? imagePath,
    String? storagePath,
    String? imageUrl,
    DateTime? updatedAt,
    DateTime? deletedAt,
    String? subtitle,
    RoyalAspectRatio? aspectRatio,
    String? customSealName,
  }) {
    return RoyalShareItem(
      id: id ?? this.id,
      title: title ?? this.title,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      imagePath: imagePath ?? this.imagePath,
      storagePath: storagePath ?? this.storagePath,
      imageUrl: imageUrl ?? this.imageUrl,
      updatedAt: updatedAt ?? this.updatedAt,
      deletedAt: deletedAt ?? this.deletedAt,
      subtitle: subtitle ?? this.subtitle,
      aspectRatio: aspectRatio ?? this.aspectRatio,
      customSealName: customSealName ?? this.customSealName,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'type': type.name,
      'createdAt': createdAt.toIso8601String(),
      'imagePath': imagePath,
      'storagePath': storagePath,
      'imageUrl': imageUrl,
      'updatedAt': updatedAt?.toIso8601String(),
      'deletedAt': deletedAt?.toIso8601String(),
      'subtitle': subtitle,
      'aspectRatio': aspectRatio.name,
      'customSealName': customSealName,
    };
  }

  factory RoyalShareItem.fromMap(Map<String, dynamic> map) {
    return RoyalShareItem(
      id: map['id'] as String,
      title: map['title'] as String,
      type: RoyalCardType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => RoyalCardType.ziwei,
      ),
      createdAt: DateTime.tryParse(map['createdAt'] as String? ?? '') ?? DateTime.now(),
      imagePath: (map['imagePath'] as String?) ?? '',
      storagePath: map['storagePath'] as String?,
      imageUrl: map['imageUrl'] as String?,
      updatedAt: map['updatedAt'] != null ? DateTime.tryParse(map['updatedAt'] as String) : null,
      deletedAt: map['deletedAt'] != null ? DateTime.tryParse(map['deletedAt'] as String) : null,
      subtitle: map['subtitle'] as String?,
      aspectRatio: RoyalAspectRatio.values.firstWhere(
        (e) => e.name == map['aspectRatio'],
        orElse: () => RoyalAspectRatio.standard,
      ),
      customSealName: map['customSealName'] as String?,
    );
  }

  String toJson() => json.encode(toMap());

  factory RoyalShareItem.fromJson(String source) =>
      RoyalShareItem.fromMap(json.decode(source) as Map<String, dynamic>);
}
