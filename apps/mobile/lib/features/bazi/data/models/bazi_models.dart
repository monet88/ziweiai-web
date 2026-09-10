class BaziPillarData {
  final String name; // Trụ Năm, Trụ Tháng, Trụ Ngày, Trụ Giờ
  final String stem; // Bính, Tân, Quý...
  final String branch; // Dần, Tỵ, Ngọ...
  final String stemElement; // Hỏa, Kim, Thủy, Mộc, Thổ
  final String branchElement;
  final String tenGod; // Chính Quan, Thiên Tài, Nhật Chủ...
  final List<String> hiddenStems; // [Giáp, Bính, Mậu]
  final String lifeStage; // Trường Sinh, Mộc Dục, Đế Vượng...
  final bool isDayMaster;

  const BaziPillarData({
    required this.name,
    required this.stem,
    required this.branch,
    required this.stemElement,
    required this.branchElement,
    required this.tenGod,
    required this.hiddenStems,
    required this.lifeStage,
    this.isDayMaster = false,
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        'stem': stem,
        'branch': branch,
        'stemElement': stemElement,
        'branchElement': branchElement,
        'tenGod': tenGod,
        'hiddenStems': hiddenStems,
        'lifeStage': lifeStage,
        'isDayMaster': isDayMaster,
      };

  factory BaziPillarData.fromJson(Map<String, dynamic> json) => BaziPillarData(
        name: json['name'] as String,
        stem: json['stem'] as String,
        branch: json['branch'] as String,
        stemElement: json['stemElement'] as String,
        branchElement: json['branchElement'] as String,
        tenGod: json['tenGod'] as String,
        hiddenStems: (json['hiddenStems'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            const [],
        lifeStage: json['lifeStage'] as String,
        isDayMaster: json['isDayMaster'] as bool? ?? false,
      );
}

class ElementRatio {
  final String element; // Kim, Mộc, Thủy, Hỏa, Thổ
  final int percentage; // 0 - 100
  final String status; // Thái Quá, Vượng, Bình Hòa, Bất Cập

  const ElementRatio({
    required this.element,
    required this.percentage,
    required this.status,
  });

  Map<String, dynamic> toJson() => {
        'element': element,
        'percentage': percentage,
        'status': status,
      };

  factory ElementRatio.fromJson(Map<String, dynamic> json) => ElementRatio(
        element: json['element'] as String,
        percentage: (json['percentage'] as num).toInt(),
        status: json['status'] as String,
      );
}

class DeityDefinition {
  final String type; // Chân Dụng Thần, Hỷ Thần, Kỵ Thần
  final String element; // Thổ, Kim, Hỏa...
  final String description;

  const DeityDefinition({
    required this.type,
    required this.element,
    required this.description,
  });

  Map<String, dynamic> toJson() => {
        'type': type,
        'element': element,
        'description': description,
      };

  factory DeityDefinition.fromJson(Map<String, dynamic> json) =>
      DeityDefinition(
        type: json['type'] as String,
        element: json['element'] as String,
        description: json['description'] as String,
      );
}

class ForecastPillar {
  final String title; // Sự Nghiệp, Tài Chính, Tình Cảm, Sức Khỏe
  final int score; // 0 - 100
  final String verdict; // Đại Cát, Vượng Phát, Bình Ổn, Thận Trọng
  final String advice;

  const ForecastPillar({
    required this.title,
    required this.score,
    required this.verdict,
    required this.advice,
  });

  Map<String, dynamic> toJson() => {
        'title': title,
        'score': score,
        'verdict': verdict,
        'advice': advice,
      };

  factory ForecastPillar.fromJson(Map<String, dynamic> json) => ForecastPillar(
        title: json['title'] as String,
        score: (json['score'] as num).toInt(),
        verdict: json['verdict'] as String,
        advice: json['advice'] as String,
      );
}

class BaziChartData {
  final String clientName;
  final String solarDate;
  final String lunarDate;
  final String gender;
  final String dayMasterElement;
  final List<BaziPillarData> pillars;
  final List<ElementRatio> elementRatios;
  final DeityDefinition yongShen; // Dụng Thần
  final DeityDefinition xiShen; // Hỷ Thần
  final DeityDefinition jiShen; // Kỵ Thần
  final List<ForecastPillar> forecast2026;
  final String annualAnalysis;
  final String? aiExplanation;

  const BaziChartData({
    required this.clientName,
    required this.solarDate,
    required this.lunarDate,
    required this.gender,
    required this.dayMasterElement,
    required this.pillars,
    required this.elementRatios,
    required this.yongShen,
    required this.xiShen,
    required this.jiShen,
    required this.forecast2026,
    required this.annualAnalysis,
    this.aiExplanation,
  });

  BaziChartData copyWith({
    String? clientName,
    String? solarDate,
    String? lunarDate,
    String? gender,
    String? dayMasterElement,
    List<BaziPillarData>? pillars,
    List<ElementRatio>? elementRatios,
    DeityDefinition? yongShen,
    DeityDefinition? xiShen,
    DeityDefinition? jiShen,
    List<ForecastPillar>? forecast2026,
    String? annualAnalysis,
    String? aiExplanation,
  }) {
    return BaziChartData(
      clientName: clientName ?? this.clientName,
      solarDate: solarDate ?? this.solarDate,
      lunarDate: lunarDate ?? this.lunarDate,
      gender: gender ?? this.gender,
      dayMasterElement: dayMasterElement ?? this.dayMasterElement,
      pillars: pillars ?? this.pillars,
      elementRatios: elementRatios ?? this.elementRatios,
      yongShen: yongShen ?? this.yongShen,
      xiShen: xiShen ?? this.xiShen,
      jiShen: jiShen ?? this.jiShen,
      forecast2026: forecast2026 ?? this.forecast2026,
      annualAnalysis: annualAnalysis ?? this.annualAnalysis,
      aiExplanation: aiExplanation ?? this.aiExplanation,
    );
  }
}
