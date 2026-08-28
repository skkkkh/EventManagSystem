class EventTemplateModel {
  final int id;
  final String name;
  final String? description;

  EventTemplateModel({
    required this.id,
    required this.name,
    this.description,
  });

  factory EventTemplateModel.fromJson(Map<String, dynamic> json) {
    return EventTemplateModel(
      id: json['id'],
      name: json['name'] ?? '',
      description: json['description'],
    );
  }
}