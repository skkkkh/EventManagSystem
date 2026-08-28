import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/api_constants.dart';
import '../core/api_exception.dart';
import '../models/recommendation_model.dart';

class RecommendationService {
  Future<List<RecommendationModel>> getForUser(
      int userId, String? token) async {
    final response = await http.get(
      Uri.parse('${ApiConstants.recommendations}/user/$userId'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => RecommendationModel.fromJson(e)).toList();
    } else {
      throw ApiException('Recommendations not loaded');
    }
  }
}