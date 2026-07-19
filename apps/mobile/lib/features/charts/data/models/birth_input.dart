import 'package:json_annotation/json_annotation.dart';

part 'birth_input.g.dart';

@JsonSerializable(explicitToJson: true)
class BirthDate {
  final int year;
  final int month;
  final int day;
  final bool? isLeapMonth;

  BirthDate({
    required this.year,
    required this.month,
    required this.day,
    this.isLeapMonth,
  });

  factory BirthDate.fromJson(Map<String, dynamic> json) => _$BirthDateFromJson(json);
  Map<String, dynamic> toJson() => _$BirthDateToJson(this);
}

@JsonSerializable(explicitToJson: true)
class BirthTime {
  final int? hour;
  final int? minute;
  final bool isUnknown;

  BirthTime({
    this.hour,
    this.minute,
    required this.isUnknown,
  });

  factory BirthTime.fromJson(Map<String, dynamic> json) => _$BirthTimeFromJson(json);
  Map<String, dynamic> toJson() => _$BirthTimeToJson(this);
}

@JsonSerializable(explicitToJson: true)
class ManualCoordinates {
  final double latitude;
  final double longitude;
  final String timezone;

  ManualCoordinates({
    required this.latitude,
    required this.longitude,
    required this.timezone,
  });

  factory ManualCoordinates.fromJson(Map<String, dynamic> json) => _$ManualCoordinatesFromJson(json);
  Map<String, dynamic> toJson() => _$ManualCoordinatesToJson(this);
}

@JsonSerializable(explicitToJson: true)
class BirthPlace {
  final String? label;
  final ManualCoordinates? manual;

  BirthPlace({
    this.label,
    this.manual,
  });

  factory BirthPlace.fromJson(Map<String, dynamic> json) => _$BirthPlaceFromJson(json);
  Map<String, dynamic> toJson() => _$BirthPlaceToJson(this);
}

@JsonSerializable(explicitToJson: true)
class BirthInput {
  final String calendar; // 'gregorian' or 'lunar'
  final BirthDate date;
  final BirthTime time;
  final String sexOrGenderForChart; // 'male', 'female', 'unknown'
  final BirthPlace place;
  final String locale;
  final String source; // 'user-entered', etc.

  BirthInput({
    required this.calendar,
    required this.date,
    required this.time,
    required this.sexOrGenderForChart,
    required this.place,
    required this.locale,
    required this.source,
  });

  factory BirthInput.fromJson(Map<String, dynamic> json) => _$BirthInputFromJson(json);
  Map<String, dynamic> toJson() => _$BirthInputToJson(this);
}
