// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'horoscope_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

HoroscopeItem _$HoroscopeItemFromJson(Map<String, dynamic> json) =>
    HoroscopeItem(
      index: (json['index'] as num).toInt(),
      heavenlyStemKey: json['heavenlyStemKey'] as String,
      earthlyBranchKey: json['earthlyBranchKey'] as String,
      palaceNameKeys: (json['palaceNameKeys'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      mutagenStarKeys: (json['mutagenStarKeys'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
    );

Map<String, dynamic> _$HoroscopeItemToJson(HoroscopeItem instance) =>
    <String, dynamic>{
      'index': instance.index,
      'heavenlyStemKey': instance.heavenlyStemKey,
      'earthlyBranchKey': instance.earthlyBranchKey,
      'palaceNameKeys': instance.palaceNameKeys,
      'mutagenStarKeys': instance.mutagenStarKeys,
    };

AnnualReportFrame _$AnnualReportFrameFromJson(Map<String, dynamic> json) =>
    AnnualReportFrame(
      yearly: HoroscopeItem.fromJson(json['yearly'] as Map<String, dynamic>),
      monthly: (json['monthly'] as List<dynamic>)
          .map((e) => HoroscopeItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$AnnualReportFrameToJson(AnnualReportFrame instance) =>
    <String, dynamic>{'yearly': instance.yearly, 'monthly': instance.monthly};

AnnualReportResponse _$AnnualReportResponseFromJson(
  Map<String, dynamic> json,
) => AnnualReportResponse(
  chartId: json['chartId'] as String,
  year: (json['year'] as num).toInt(),
  frame: AnnualReportFrame.fromJson(json['frame'] as Map<String, dynamic>),
  markdown: json['markdown'] as String,
);

Map<String, dynamic> _$AnnualReportResponseToJson(
  AnnualReportResponse instance,
) => <String, dynamic>{
  'chartId': instance.chartId,
  'year': instance.year,
  'frame': instance.frame,
  'markdown': instance.markdown,
};
