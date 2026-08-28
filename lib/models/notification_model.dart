class NotificationModel {
  final int id;
  final int userId;
  final String message;
  final DateTime createdAt;
  final bool isRead;
  final String type;

  NotificationModel({
    required this.id,
    required this.userId,
    required this.message,
    required this.createdAt,
    required this.isRead,
    required this.type,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'],
      userId: json['userId'],
      message: json['message'] ?? '',
      createdAt: DateTime.parse(json['createdAt']),
      isRead: json['isRead'] ?? false,
      type: json['type']?.toString() ?? 'General',
    );
  }
}