class UserModel {
  final int userId;
  final String name;
  final String email;
  final List<String> roles;

  UserModel({
    required this.userId,
    required this.name,
    required this.email,
    required this.roles,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      userId: json['userId'],
      name: json['name'],
      email: json['email'],
      roles: List<String>.from(json['roles'] ?? []),
    );
  }

  bool get isAdmin => roles.contains('Admin');
  bool get isOrganizer => roles.contains('Organizer');
}