import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/api_constants.dart';
import '../core/api_exception.dart';
import '../models/admin_user_model.dart';

class AdminService {
  Map<String, String> _headers(String? token) => {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };

  Future<List<AdminUserModel>> getAllUsers(String? token) async {
    final response = await http.get(
      Uri.parse(ApiConstants.users),
      headers: _headers(token),
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => AdminUserModel.fromJson(e)).toList();
    } else {
      throw ApiException('Users not loaded');
    }
  }

  Future<void> updateUserRole({
    required int id,
    required String name,
    required String email,
    required String role,
    required String? token,
  }) async {
    final response = await http.put(
      Uri.parse('${ApiConstants.users}/$id'),
      headers: _headers(token),
      body: jsonEncode({
        'name': name,
        'email': email,
        'role': role,
      }),
    );

    if (response.statusCode != 204) {
      throw ApiException('User not deleted: ${response.body}');
    }
  }

  Future<void> deleteUser(int id, String? token) async {
    final response = await http.delete(
      Uri.parse('${ApiConstants.users}/$id'),
      headers: _headers(token),
    );

    if (response.statusCode != 204) {
      throw ApiException('User not deleted');
    }
  }
}