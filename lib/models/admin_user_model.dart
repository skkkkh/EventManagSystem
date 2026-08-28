class AdminUserModel {
  final int id;
  final String name;
  final String email;
  final String role;

  AdminUserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
  });

  factory AdminUserModel.fromJson(Map<String, dynamic> json) {
    return AdminUserModel(
      id: json['id'],
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? '',
    );
  }
}