import 'dart:convert';
import 'lib/features/charts/data/models/birth_input.dart';
import 'lib/features/charts/data/models/create_chart_request.dart';

void main() {
  final request = CreateChartRequest(
    chartSystem: 'zi-wei-dou-shu',
    birthInput: BirthInput(
      calendar: 'gregorian',
      date: BirthDate(year: 1990, month: 1, day: 1, isLeapMonth: null),
      time: BirthTime(hour: 12, minute: 0, isUnknown: false),
      sexOrGenderForChart: 'male',
      place: BirthPlace(label: 'Hà Nội', manual: null),
      locale: 'vi-VN',
      source: 'user-entered',
    ),
  );
  
  print(jsonEncode(request.toJson()));
}
