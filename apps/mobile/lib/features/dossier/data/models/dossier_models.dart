enum DossierViewMode { book, scroll }

class DossierPageData {
  final int pageNumber; // 1 to 19
  final String title;
  final String category;
  final String? subTitle;
  final String dropCapLetter;
  final String content;
  final bool isCover;
  final bool hasSeal;
  final Map<String, String>? keyAttributes;

  const DossierPageData({
    required this.pageNumber,
    required this.title,
    required this.category,
    this.subTitle,
    required this.dropCapLetter,
    required this.content,
    this.isCover = false,
    this.hasSeal = false,
    this.keyAttributes,
  });

  Map<String, dynamic> toJson() => {
        'pageNumber': pageNumber,
        'title': title,
        'category': category,
        'subTitle': subTitle,
        'dropCapLetter': dropCapLetter,
        'content': content,
        'isCover': isCover,
        'hasSeal': hasSeal,
        'keyAttributes': keyAttributes,
      };

  factory DossierPageData.fromJson(Map<String, dynamic> json) =>
      DossierPageData(
        pageNumber: (json['pageNumber'] as num).toInt(),
        title: json['title'] as String,
        category: json['category'] as String,
        subTitle: json['subTitle'] as String?,
        dropCapLetter: json['dropCapLetter'] as String,
        content: json['content'] as String,
        isCover: json['isCover'] as bool? ?? false,
        hasSeal: json['hasSeal'] as bool? ?? false,
        keyAttributes: (json['keyAttributes'] as Map<String, dynamic>?)
            ?.map((k, v) => MapEntry(k, v.toString())),
      );
}

class RoyalDossierData {
  final String clientName;
  final String securityWatermark;
  final String birthInfo;
  final String lunarBirthInfo;
  final String elementAndDestiny;
  final List<DossierPageData> pages;

  const RoyalDossierData({
    required this.clientName,
    required this.securityWatermark,
    required this.birthInfo,
    required this.lunarBirthInfo,
    required this.elementAndDestiny,
    required this.pages,
  });

  int get totalPages => pages.length;
}
