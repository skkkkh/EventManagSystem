import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/api_constants.dart';
import '../core/api_exception.dart';
import '../models/booking_models.dart';

class BookingService {
  Map<String, String> _headers(String? token) => {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };

  Future<List<TicketTypeModel>> getTicketTypesForEvent(
      int eventId, String? token) async {
    final response = await http.get(
      Uri.parse(ApiConstants.ticketTypes),
      headers: _headers(token),
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data
          .map((e) => TicketTypeModel.fromJson(e))
          .where((t) => t.eventId == eventId)
          .toList();
    } else {
      throw ApiException('Ticket types not loaded');
    }
  }

  Future<RegistrationModel> createRegistration({
    required String fullName,
    required String email,
    String? phone,
    required int eventId,
    required String? token,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.registrations),
      headers: _headers(token),
      body: jsonEncode({
        'fullName': fullName,
        'email': email,
        'phone': phone,
        'eventId': eventId,
      }),
    );

    if (response.statusCode == 201) {
      return RegistrationModel.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Registration failed: ${response.body}');
    }
  }

  Future<BookingModel> createBooking({
    required int registrationId,
    required int ticketTypeId,
    required int quantity,
    required String? token,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.bookings),
      headers: _headers(token),
      body: jsonEncode({
        'registrationId': registrationId,
        'ticketTypeId': ticketTypeId,
        'quantity': quantity,
      }),
    );

    if (response.statusCode == 201) {
      return BookingModel.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Booking failed: ${response.body}');
    }
  }

  Future<PaymentModel> createPayment({
    required int bookingId,
    required String paymentMethod,
    required String? token,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.payments),
      headers: _headers(token),
      body: jsonEncode({
        'bookingId': bookingId,
        'paymentMethod': paymentMethod,
      }),
    );

    if (response.statusCode == 201) {
      return PaymentModel.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Payment failed: ${response.body}');
    }
  }

  Future<List<BookingModel>> getAllBookings(String? token) async {
    final response = await http.get(
      Uri.parse(ApiConstants.bookings),
      headers: _headers(token),
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => BookingModel.fromJson(e)).toList();
    } else {
      throw ApiException('Bookings not loaded');
    }
  }

  Future<List<RegistrationModel>> getAllRegistrations(String? token) async {
    final response = await http.get(
      Uri.parse(ApiConstants.registrations),
      headers: _headers(token),
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => RegistrationModel.fromJson(e)).toList();
    } else {
      throw ApiException('Registrations not loaded');
    }
  }

  Future<Map<int, TicketTypeModel>> getAllTicketTypesMap(String? token) async {
    final response = await http.get(
      Uri.parse(ApiConstants.ticketTypes),
      headers: _headers(token),
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      final tickets = data.map((e) => TicketTypeModel.fromJson(e)).toList();
      return {for (var t in tickets) t.id: t};
    } else {
      throw ApiException('Ticket types not loaded');
    }
  }
  Future<TicketTypeModel> createTicketType({
    required String name,
    required double price,
    required int quantity,
    required int eventId,
    required String? token,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.ticketTypes),
      headers: _headers(token),
      body: jsonEncode({
        'name': name,
        'price': price,
        'quantity': quantity,
        'eventId': eventId,
      }),
    );

    if (response.statusCode == 201) {
      return TicketTypeModel.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Ticket type not created: ${response.body}');
    }
  }
  Future<int> getAvailableSeats(int ticketTypeId, String? token) async {
    final response = await http.get(
      Uri.parse('${ApiConstants.bookings}/available-seats/$ticketTypeId'),
      headers: _headers(token),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['availableSeats'] ?? 0;
    } else {
      throw ApiException('Available seats not loaded');
    }
  }
}