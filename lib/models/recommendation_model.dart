import 'event_model.dart';

class RecommendationModel {
  final EventModel event;
  final String reason;

  RecommendationModel({required this.event, required this.reason});

  factory RecommendationModel.fromJson(Map<String, dynamic> json) {
    return RecommendationModel(
      event: EventModel.fromJson(json['event']),
      reason: json['reason'] ?? '',
    );
  }
}