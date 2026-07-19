import 'package:json_annotation/json_annotation.dart';
import 'birth_input.dart';

part 'create_chart_request.g.dart';

@JsonSerializable(explicitToJson: true)
class CreateChartRequest {
  final BirthInput birthInput;
  final String chartSystem; // e.g. 'zi-wei-dou-shu'
  final bool makeActiveBirthProfile;
  final int? viewYear;

  CreateChartRequest({
    required this.birthInput,
    required this.chartSystem,
    this.makeActiveBirthProfile = true,
    this.viewYear,
  });

  factory CreateChartRequest.fromJson(Map<String, dynamic> json) => _$CreateChartRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CreateChartRequestToJson(this);
}
