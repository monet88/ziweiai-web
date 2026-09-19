import 'package:flutter/foundation.dart';

enum CompatibilityCategory {
  love('Tình Duyên & Hôn Nhân', 'Xét hòa hợp phu thê, duyên nợ trăm năm'),
  business('Hợp Tác Làm Ăn', 'Xét thời vận tương sinh, tài lộc hanh thông'),
  friendship('Bạn Bè & Tri Kỷ', 'Xét tính tình hòa hợp, đồng thanh tương ứng');

  final String title;
  final String description;

  const CompatibilityCategory(this.title, this.description);
}

@immutable
class CompatibilityPerson {
  final String name;
  final int year;
  final int month;
  final int day;
  final String gender; // 'male' or 'female'

  const CompatibilityPerson({
    required this.name,
    required this.year,
    this.month = 1,
    this.day = 1,
    required this.gender,
  });

  bool get isMale => gender.toLowerCase() == 'male';
}

@immutable
class CompatibilityAspect {
  final String title;
  final int score; // 0 - 25
  final int maxScore;
  final String rating; // Đại Cát, Cát, Bình Hòa, Hung, v.v.
  final String detail;
  final String explanation;

  const CompatibilityAspect({
    required this.title,
    required this.score,
    this.maxScore = 25,
    required this.rating,
    required this.detail,
    required this.explanation,
  });
}

@immutable
class CompatibilityResult {
  final CompatibilityPerson person1;
  final CompatibilityPerson person2;
  final CompatibilityCategory category;
  final int totalScore; // 0 - 100
  final String verdictTitle;
  final String verdictSummary;
  final CompatibilityAspect elementAspect; // Ngũ hành nạp âm
  final CompatibilityAspect batTrachAspect; // Cung phi bát trạch
  final CompatibilityAspect canAspect; // Thiên can
  final CompatibilityAspect chiAspect; // Địa chi
  final String imperialPoem; // Bài thơ vịnh duyên định
  final String advice;

  const CompatibilityResult({
    required this.person1,
    required this.person2,
    required this.category,
    required this.totalScore,
    required this.verdictTitle,
    required this.verdictSummary,
    required this.elementAspect,
    required this.batTrachAspect,
    required this.canAspect,
    required this.chiAspect,
    required this.imperialPoem,
    required this.advice,
  });
}
