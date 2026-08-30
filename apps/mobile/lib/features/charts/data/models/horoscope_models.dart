import 'package:json_annotation/json_annotation.dart';

part 'horoscope_models.g.dart';

@JsonSerializable()
class HoroscopeItem {
  final int index;
  final String heavenlyStemKey;
  final String earthlyBranchKey;
  final List<String> palaceNameKeys;
  final List<String> mutagenStarKeys;

  const HoroscopeItem({
    required this.index,
    required this.heavenlyStemKey,
    required this.earthlyBranchKey,
    required this.palaceNameKeys,
    required this.mutagenStarKeys,
  });

  factory HoroscopeItem.fromJson(Map<String, dynamic> json) =>
      _$HoroscopeItemFromJson(json);

  Map<String, dynamic> toJson() => _$HoroscopeItemToJson(this);
}

@JsonSerializable()
class AnnualReportFrame {
  final HoroscopeItem yearly;
  final List<HoroscopeItem> monthly;

  const AnnualReportFrame({
    required this.yearly,
    required this.monthly,
  });

  factory AnnualReportFrame.fromJson(Map<String, dynamic> json) =>
      _$AnnualReportFrameFromJson(json);

  Map<String, dynamic> toJson() => _$AnnualReportFrameToJson(this);
}

@JsonSerializable()
class AnnualReportResponse {
  final String chartId;
  final int year;
  final AnnualReportFrame frame;
  final String markdown;

  const AnnualReportResponse({
    required this.chartId,
    required this.year,
    required this.frame,
    required this.markdown,
  });

  factory AnnualReportResponse.fromJson(Map<String, dynamic> json) =>
      _$AnnualReportResponseFromJson(json);

  Map<String, dynamic> toJson() => _$AnnualReportResponseToJson(this);
}
