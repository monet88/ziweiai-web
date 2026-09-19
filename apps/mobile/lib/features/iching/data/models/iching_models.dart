class IChingHexagram {
  final String id;
  final String name;
  final List<int> lines;

  IChingHexagram({
    required this.id,
    required this.name,
    required this.lines,
  });

  factory IChingHexagram.fromJson(Map<String, dynamic> json) {
    return IChingHexagram(
      id: json['id'] as String,
      name: json['name'] as String,
      lines: (json['lines'] as List<dynamic>).map((e) => e as int).toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'lines': lines,
    };
  }
}

class IChingDraw {
  final String question;
  final IChingHexagram baseHexagram;
  final IChingHexagram? changedHexagram;
  final List<int> changingLines;
  final String narrative;
  final List<int>? castArray;

  IChingDraw({
    required this.question,
    required this.baseHexagram,
    this.changedHexagram,
    required this.changingLines,
    required this.narrative,
    this.castArray,
  });

  factory IChingDraw.fromJson(Map<String, dynamic> json) {
    return IChingDraw(
      question: json['question'] as String,
      baseHexagram: IChingHexagram.fromJson(json['baseHexagram'] as Map<String, dynamic>),
      changedHexagram: json['changedHexagram'] != null
          ? IChingHexagram.fromJson(json['changedHexagram'] as Map<String, dynamic>)
          : null,
      changingLines: (json['changingLines'] as List<dynamic>).map((e) => e as int).toList(),
      narrative: json['narrative'] as String,
      castArray: json['cast_array'] != null 
          ? (json['cast_array'] as List<dynamic>).map((e) => e as int).toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'question': question,
      'baseHexagram': baseHexagram.toJson(),
      'changedHexagram': changedHexagram?.toJson(),
      'changingLines': changingLines,
      'narrative': narrative,
      'cast_array': castArray,
    };
  }
}
