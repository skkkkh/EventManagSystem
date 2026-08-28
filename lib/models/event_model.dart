class EventModel {
  final int id;
  final String title;
  final String? description;
  final String? location;
  final DateTime startDateTime;
  final DateTime endDateTime;
  final int capacity;
  final bool isPublished;
  final int eventTemplateId;
  final String? eventTemplateName;

  EventModel({
    required this.id,
    required this.title,
    this.description,
    this.location,
    required this.startDateTime,
    required this.endDateTime,
    required this.capacity,
    required this.isPublished,
    required this.eventTemplateId,
    this.eventTemplateName,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['id'],
      title: json['title'] ?? '',
      description: json['description'],
      location: json['location'],
      startDateTime: DateTime.parse(json['startDateTime']),
      endDateTime: DateTime.parse(json['endDateTime']),
      capacity: json['capacity'] ?? 0,
      isPublished: json['isPublished'] ?? false,
      eventTemplateId: json['eventTemplateId'] ?? 0,
      eventTemplateName: json['eventTemplateName'],
    );
  }
}