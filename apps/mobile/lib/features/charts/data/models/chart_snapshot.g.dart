// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chart_snapshot.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ChartDetailResponse _$ChartDetailResponseFromJson(Map<String, dynamic> json) =>
    ChartDetailResponse(
      chartRecord: ChartRecord.fromJson(
        json['chartRecord'] as Map<String, dynamic>,
      ),
      snapshot: json['snapshot'] as Map<String, dynamic>,
      explanationResults: json['explanationResults'] as List<dynamic>?,
    );

Map<String, dynamic> _$ChartDetailResponseToJson(
  ChartDetailResponse instance,
) => <String, dynamic>{
  'chartRecord': instance.chartRecord,
  'snapshot': instance.snapshot,
  'explanationResults': instance.explanationResults,
};

ChartRecord _$ChartRecordFromJson(Map<String, dynamic> json) => ChartRecord(
  id: json['id'] as String,
  ownerUserId: json['ownerUserId'] as String,
  chartSystem: json['chartSystem'] as String,
  snapshot: ChartSnapshot.fromJson(json['snapshot'] as Map<String, dynamic>),
);

Map<String, dynamic> _$ChartRecordToJson(ChartRecord instance) =>
    <String, dynamic>{
      'id': instance.id,
      'ownerUserId': instance.ownerUserId,
      'chartSystem': instance.chartSystem,
      'snapshot': instance.snapshot,
    };

ChartSnapshot _$ChartSnapshotFromJson(Map<String, dynamic> json) =>
    ChartSnapshot(
      snapshotId: json['snapshotId'] as String,
      chartSystem: json['chartSystem'] as String,
      palaces: (json['palaces'] as List<dynamic>?)
          ?.map((e) => Palace.fromJson(e as Map<String, dynamic>))
          .toList(),
      summary: json['summary'] as Map<String, dynamic>?,
      birth: json['birth'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$ChartSnapshotToJson(ChartSnapshot instance) =>
    <String, dynamic>{
      'snapshotId': instance.snapshotId,
      'chartSystem': instance.chartSystem,
      'palaces': instance.palaces,
      'summary': instance.summary,
      'birth': instance.birth,
    };

Palace _$PalaceFromJson(Map<String, dynamic> json) => Palace(
  nameKey: json['nameKey'] as String,
  index: (json['index'] as num).toInt(),
  heavenlyStemKey: json['heavenlyStemKey'] as String,
  earthlyBranchKey: json['earthlyBranchKey'] as String,
  isBodyPalace: json['isBodyPalace'] as bool,
  isOriginalPalace: json['isOriginalPalace'] as bool,
  majorStars: (json['majorStars'] as List<dynamic>)
      .map((e) => Star.fromJson(e as Map<String, dynamic>))
      .toList(),
  minorStars: (json['minorStars'] as List<dynamic>)
      .map((e) => Star.fromJson(e as Map<String, dynamic>))
      .toList(),
  adjectiveStars: (json['adjectiveStars'] as List<dynamic>)
      .map((e) => Star.fromJson(e as Map<String, dynamic>))
      .toList(),
  changsheng12Key: json['changsheng12Key'] as String?,
  decadalRange: (json['decadalRange'] as List<dynamic>?)
      ?.map((e) => (e as num).toInt())
      .toList(),
  ages: (json['ages'] as List<dynamic>).map((e) => (e as num).toInt()).toList(),
  displayName: json['displayName'] as String?,
);

Map<String, dynamic> _$PalaceToJson(Palace instance) => <String, dynamic>{
  'nameKey': instance.nameKey,
  'index': instance.index,
  'heavenlyStemKey': instance.heavenlyStemKey,
  'earthlyBranchKey': instance.earthlyBranchKey,
  'isBodyPalace': instance.isBodyPalace,
  'isOriginalPalace': instance.isOriginalPalace,
  'majorStars': instance.majorStars,
  'minorStars': instance.minorStars,
  'adjectiveStars': instance.adjectiveStars,
  'changsheng12Key': instance.changsheng12Key,
  'decadalRange': instance.decadalRange,
  'ages': instance.ages,
  'displayName': instance.displayName,
};

Star _$StarFromJson(Map<String, dynamic> json) => Star(
  nameKey: json['nameKey'] as String,
  group: json['group'] as String,
  brightnessKey: json['brightnessKey'] as String?,
  mutagen: json['mutagen'] as String?,
  displayName: json['displayName'] as String?,
);

Map<String, dynamic> _$StarToJson(Star instance) => <String, dynamic>{
  'nameKey': instance.nameKey,
  'group': instance.group,
  'brightnessKey': instance.brightnessKey,
  'mutagen': instance.mutagen,
  'displayName': instance.displayName,
};
