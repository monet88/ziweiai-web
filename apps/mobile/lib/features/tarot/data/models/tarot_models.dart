class TarotCard {
  final String id;
  final String name;
  final bool reversed;
  final int position;

  TarotCard({
    required this.id,
    required this.name,
    required this.reversed,
    required this.position,
  });

  factory TarotCard.fromJson(Map<String, dynamic> json) {
    return TarotCard(
      id: json['id'] as String,
      name: json['name'] as String,
      reversed: json['reversed'] as bool? ?? false,
      position: json['position'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'reversed': reversed,
      'position': position,
    };
  }
}

class TarotDraw {
  final String question;
  final String spread;
  final List<TarotCard> cards;
  final String narrative;
  final String? seed;

  TarotDraw({
    required this.question,
    required this.spread,
    required this.cards,
    required this.narrative,
    this.seed,
  });

  factory TarotDraw.fromJson(Map<String, dynamic> json) {
    return TarotDraw(
      question: json['question'] as String,
      spread: json['spread'] as String,
      cards: (json['cards'] as List<dynamic>?)
              ?.map((e) => TarotCard.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      narrative: json['narrative'] as String,
      seed: json['seed'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'question': question,
      'spread': spread,
      'cards': cards.map((e) => e.toJson()).toList(),
      'narrative': narrative,
      'seed': seed,
    };
  }
}
