class TransactionModel {
  final String id;
  final String userId;
  final int amount;
  final int balanceAfter;
  final String description;
  final String transactionType;
  final DateTime createdAt;

  TransactionModel({
    required this.id,
    required this.userId,
    required this.amount,
    required this.balanceAfter,
    required this.description,
    required this.transactionType,
    required this.createdAt,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      amount: json['amount'] as int,
      balanceAfter: json['balanceAfter'] as int,
      description: json['description'] as String,
      transactionType: json['transactionType'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
