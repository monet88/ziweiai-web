import 'dart:convert';
import 'package:ziweiai_mobile/features/charts/data/models/create_chart_request.dart';
import 'package:ziweiai_mobile/features/charts/data/models/birth_input.dart';

void main() {
  final req = CreateChartRequest(
    birthInput: BirthInput(
      calendar: 'gregorian',
      date: BirthDate(year: 1990, month: 1, day: 1),
      time: BirthTime(isUnknown: false, hour: 12, minute: 0),
      sexOrGenderForChart: 'male',
      place: BirthPlace(label: 'Hà Nội'),
      locale: 'vi-VN',
      source: 'user-entered',
    ),
    chartSystem: 'zi-wei-dou-shu',
    makeActiveBirthProfile: true,
  );
  print(jsonEncode(req.toJson()));
}
