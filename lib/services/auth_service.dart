import 'dart:convert';
import "package:http/http.dart" as http;
import '../core/api_constants.dart';
import '../core/api_exception.dart';
import '../models/auth_response_model.dart';

class AuthService {
  Future<AuthResponseModel> login(String email, String password) async {
    final response = await http.post(
      Uri.parse(ApiConstants.login),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      return AuthResponseModel.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Invalid email or password');
    }
  }

  Future<AuthResponseModel> register(
      String name,
      String email,
      String password,
      String role,
      ) async {
    final response = await http.post(
      Uri.parse(ApiConstants.register),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'role': role,
      }),
    );

    if (response.statusCode == 201) {
      return AuthResponseModel.fromJson(jsonDecode(response.body));
    } else {
      final body = jsonDecode(response.body);
      throw ApiException(body.toString());
    }
  }
}