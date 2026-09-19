// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_chart_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CreateChartRequest _$CreateChartRequestFromJson(Map<String, dynamic> json) =>
    CreateChartRequest(
      birthInput: BirthInput.fromJson(
        json['birthInput'] as Map<String, dynamic>,
      ),
      chartSystem: json['chartSystem'] as String,
      makeActiveBirthProfile: json['makeActiveBirthProfile'] as bool? ?? true,
      viewYear: (json['viewYear'] as num?)?.toInt(),
    );

Map<String, dynamic> _$CreateChartRequestToJson(CreateChartRequest instance) =>
    <String, dynamic>{
      'birthInput': instance.birthInput.toJson(),
      'chartSystem': instance.chartSystem,
      'makeActiveBirthProfile': instance.makeActiveBirthProfile,
      'viewYear': ?instance.viewYear,
    };
