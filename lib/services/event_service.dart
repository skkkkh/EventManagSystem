import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/api_constants.dart';
import '../core/api_exception.dart';
import '../models/event_model.dart';

class EventService {
  Future<List<EventModel>> getAllEvents(String? token) async {
    final response = await http.get(
      Uri.parse(ApiConstants.events),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => EventModel.fromJson(e)).toList();
    } else {
      throw ApiException('Events not loaded');
    }
  }

  Future<List<EventModel>> getUpcomingEvents(String? token) async {
    final response = await http.get(
      Uri.parse(ApiConstants.upcomingEvents),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => EventModel.fromJson(e)).toList();
    } else {
      throw ApiException('Upcoming events did not load');
    }
  }

  Future<EventModel> getEventById(int id, String? token) async {
    final response = await http.get(
      Uri.parse('${ApiConstants.events}/$id'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return EventModel.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Event not found');
    }
  }
  Future<List<dynamic>> getEventTemplates(String? token) async {
    final response = await http.get(
      Uri.parse(ApiConstants.eventTemplates),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw ApiException('Event templates not loaded');
    }
  }

  Future<EventModel> createEvent({
    required String title,
    String? description,
    String? location,
    required DateTime startDateTime,
    required DateTime endDateTime,
    required int capacity,
    required int eventTemplateId,
    required String? token,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.events),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'title': title,
        'description': description,
        'location': location,
        'startDateTime': startDateTime.toIso8601String(),
        'endDateTime': endDateTime.toIso8601String(),
        'capacity': capacity,
        'eventTemplateId': eventTemplateId,
        'fieldValues': [],
      }),
    );

    if (response.statusCode == 201) {
      return EventModel.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Event not created: ${response.body}');
    }
  }
  Future<void> createEventTemplate({
    required String name,
    String? description,
    required String? token,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.eventTemplates),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'name': name,
        'description': description,
        'customFields': [],
      }),
    );

    if (response.statusCode != 201) {
      throw ApiException('Template not created: ${response.body}');
    }
  }
  Future<void> updateEvent({
    required int id,
    required String title,
    String? description,
    String? location,
    required DateTime startDateTime,
    required DateTime endDateTime,
    required int capacity,
    required bool isPublished,
    required String? token,
  }) async {
    final response = await http.put(
      Uri.parse('${ApiConstants.events}/$id'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'title': title,
        'description': description,
        'location': location,
        'startDateTime': startDateTime.toIso8601String(),
        'endDateTime': endDateTime.toIso8601String(),
        'capacity': capacity,
        'isPublished': isPublished,
        'fieldValues': [],
      }),
    );

    if (response.statusCode != 204) {
      throw ApiException('Event not updated: ${response.body}');
    }
  }

  Future<void> deleteEvent(int id, String? token) async {
    final response = await http.delete(
      Uri.parse('${ApiConstants.events}/$id'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 204) {
      throw ApiException('Event not deleted: ${response.body}');
    }
  }
}