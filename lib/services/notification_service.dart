import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/api_constants.dart';
import '../core/api_exception.dart';
import '../models/notification_model.dart';

class NotificationService {
  Map<String, String> _headers(String? token) => {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };

  Future<List<NotificationModel>> getForUser(int userId, String? token) async {
    final response = await http.get(
      Uri.parse('${ApiConstants.notifications}/user/$userId'),
      headers: _headers(token),
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => NotificationModel.fromJson(e)).toList();
    } else {
      throw ApiException('Notifications not loaded');
    }
  }

  Future<void> markRead(int id, String? token) async {
    final response = await http.patch(
      Uri.parse('${ApiConstants.notifications}/$id/read'),
      headers: _headers(token),
    );

    if (response.statusCode != 204) {
      throw ApiException('Notification not updated');
    }
  }
}