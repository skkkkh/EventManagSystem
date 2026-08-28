import 'user_model.dart';

class AuthResponseModel {
  final UserModel user;
  final String token;
  final DateTime expiresAt;

  AuthResponseModel({
    required this.user,
    required this.token,
    required this.expiresAt,
  });

  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    return AuthResponseModel(
      user: UserModel.fromJson(json),
      token: json['token'],
      expiresAt: DateTime.parse(json['expiresAt']),
    );
  }
}