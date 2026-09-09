class DivinationStick {
  final int id;
  final String title;
  final String level;
  final String poem;
  final String interpretation;
  final String advice;
  final String? story;
  final Map<String, dynamic>? detailedInterpretations;

  DivinationStick({
    required this.id,
    required this.title,
    required this.level,
    required this.poem,
    required this.interpretation,
    required this.advice,
    this.story,
    this.detailedInterpretations,
  });

  factory DivinationStick.fromJson(Map<String, dynamic> json) {
    return DivinationStick(
      id: json['id'] as int,
      title: json['title'] as String,
      level: json['level'] as String,
      poem: json['poem'] as String,
      interpretation: json['interpretation'] as String,
      advice: json['advice'] as String,
      story: json['story'] as String?,
      detailedInterpretations: json['detailedInterpretations'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'level': level,
      'poem': poem,
      'interpretation': interpretation,
      'advice': advice,
      if (story != null) 'story': story,
      if (detailedInterpretations != null) 'detailedInterpretations': detailedInterpretations,
    };
  }
}

class StickDraw {
  final String question;
  final DivinationStick stick;
  final String narrative;

  StickDraw({
    required this.question,
    required this.stick,
    required this.narrative,
  });

  factory StickDraw.fromJson(Map<String, dynamic> json) {
    return StickDraw(
      question: json['question'] as String? ?? '',
      stick: DivinationStick.fromJson(json['stick'] as Map<String, dynamic>),
      narrative: json['narrative'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'question': question,
      'stick': stick.toJson(),
      'narrative': narrative,
    };
  }
}
