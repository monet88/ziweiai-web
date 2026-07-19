// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'birth_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BirthDate _$BirthDateFromJson(Map<String, dynamic> json) => BirthDate(
  year: (json['year'] as num).toInt(),
  month: (json['month'] as num).toInt(),
  day: (json['day'] as num).toInt(),
  isLeapMonth: json['isLeapMonth'] as bool?,
);

Map<String, dynamic> _$BirthDateToJson(BirthDate instance) => <String, dynamic>{
  'year': instance.year,
  'month': instance.month,
  'day': instance.day,
  'isLeapMonth': instance.isLeapMonth,
};

BirthTime _$BirthTimeFromJson(Map<String, dynamic> json) => BirthTime(
  hour: (json['hour'] as num?)?.toInt(),
  minute: (json['minute'] as num?)?.toInt(),
  isUnknown: json['isUnknown'] as bool,
);

Map<String, dynamic> _$BirthTimeToJson(BirthTime instance) => <String, dynamic>{
  'hour': instance.hour,
  'minute': instance.minute,
  'isUnknown': instance.isUnknown,
};

ManualCoordinates _$ManualCoordinatesFromJson(Map<String, dynamic> json) =>
    ManualCoordinates(
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      timezone: json['timezone'] as String,
    );

Map<String, dynamic> _$ManualCoordinatesToJson(ManualCoordinates instance) =>
    <String, dynamic>{
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'timezone': instance.timezone,
    };

BirthPlace _$BirthPlaceFromJson(Map<String, dynamic> json) => BirthPlace(
  label: json['label'] as String?,
  manual: json['manual'] == null
      ? null
      : ManualCoordinates.fromJson(json['manual'] as Map<String, dynamic>),
);

Map<String, dynamic> _$BirthPlaceToJson(BirthPlace instance) =>
    <String, dynamic>{
      'label': instance.label,
      'manual': instance.manual?.toJson(),
    };

BirthInput _$BirthInputFromJson(Map<String, dynamic> json) => BirthInput(
  calendar: json['calendar'] as String,
  date: BirthDate.fromJson(json['date'] as Map<String, dynamic>),
  time: BirthTime.fromJson(json['time'] as Map<String, dynamic>),
  sexOrGenderForChart: json['sexOrGenderForChart'] as String,
  place: BirthPlace.fromJson(json['place'] as Map<String, dynamic>),
  locale: json['locale'] as String,
  source: json['source'] as String,
);

Map<String, dynamic> _$BirthInputToJson(BirthInput instance) =>
    <String, dynamic>{
      'calendar': instance.calendar,
      'date': instance.date.toJson(),
      'time': instance.time.toJson(),
      'sexOrGenderForChart': instance.sexOrGenderForChart,
      'place': instance.place.toJson(),
      'locale': instance.locale,
      'source': instance.source,
    };
