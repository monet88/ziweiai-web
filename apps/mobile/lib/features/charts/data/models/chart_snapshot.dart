import 'package:json_annotation/json_annotation.dart';

part 'chart_snapshot.g.dart';

@JsonSerializable()
class ChartDetailResponse {
  final ChartRecord chartRecord;
  final Map<String, dynamic> snapshot;
  final List<dynamic> explanationResults;

  ChartDetailResponse({
    required this.chartRecord,
    required this.snapshot,
    required this.explanationResults,
  });

  factory ChartDetailResponse.fromJson(Map<String, dynamic> json) => _$ChartDetailResponseFromJson(json);
  Map<String, dynamic> toJson() => _$ChartDetailResponseToJson(this);
}

@JsonSerializable()
class ChartRecord {
  final String id;
  final String ownerUserId;
  final String chartSystem;
  final ChartSnapshot snapshot;

  ChartRecord({
    required this.id,
    required this.ownerUserId,
    required this.chartSystem,
    required this.snapshot,
  });

  factory ChartRecord.fromJson(Map<String, dynamic> json) => _$ChartRecordFromJson(json);
  Map<String, dynamic> toJson() => _$ChartRecordToJson(this);
}

@JsonSerializable()
class ChartSnapshot {
  final String snapshotId;
  final String chartSystem;
  final List<Palace>? palaces;
  final Map<String, dynamic>? summary;
  final Map<String, dynamic>? birth;

  ChartSnapshot({
    required this.snapshotId,
    required this.chartSystem,
    this.palaces,
    this.summary,
    this.birth,
  });

  factory ChartSnapshot.fromJson(Map<String, dynamic> json) => _$ChartSnapshotFromJson(json);
  Map<String, dynamic> toJson() => _$ChartSnapshotToJson(this);
}

@JsonSerializable()
class Palace {
  final String nameKey;
  final int index;
  final String heavenlyStemKey;
  final String earthlyBranchKey;
  final bool isBodyPalace;
  final bool isOriginalPalace;
  final List<Star> majorStars;
  final List<Star> minorStars;
  final List<Star> adjectiveStars;
  final String? changsheng12Key;
  final List<int>? decadalRange;
  final List<int> ages;
  final String? displayName;

  Palace({
    required this.nameKey,
    required this.index,
    required this.heavenlyStemKey,
    required this.earthlyBranchKey,
    required this.isBodyPalace,
    required this.isOriginalPalace,
    required this.majorStars,
    required this.minorStars,
    required this.adjectiveStars,
    this.changsheng12Key,
    this.decadalRange,
    required this.ages,
    this.displayName,
  });

  factory Palace.fromJson(Map<String, dynamic> json) => _$PalaceFromJson(json);
  Map<String, dynamic> toJson() => _$PalaceToJson(this);
}

@JsonSerializable()
class Star {
  final String nameKey;
  final String group;
  final String? brightnessKey;
  final String? mutagen;
  final String? displayName;

  Star({
    required this.nameKey,
    required this.group,
    this.brightnessKey,
    this.mutagen,
    this.displayName,
  });

  factory Star.fromJson(Map<String, dynamic> json) => _$StarFromJson(json);
  Map<String, dynamic> toJson() => _$StarToJson(this);
}
