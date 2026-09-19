class NumerologyExplanation {
  final String narrative;

  NumerologyExplanation({
    required this.narrative,
  });

  factory NumerologyExplanation.fromJson(Map<String, dynamic> json) {
    return NumerologyExplanation(
      narrative: json['narrative'] ?? '',
    );
  }
}
