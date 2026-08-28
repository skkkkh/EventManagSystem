class ApiConstants {
  static const String baseUrl = "http://localhost:5080/api";

  static const String register = "$baseUrl/auth/register";
  static const String login = "$baseUrl/auth/login";
  static const String events = "$baseUrl/events";
  static const String upcomingEvents = "$baseUrl/events/upcoming";
  static const String ticketTypes = "$baseUrl/tickettypes";
  static const String registrations = "$baseUrl/registrations";
  static const String bookings = "$baseUrl/bookings";
  static const String payments = "$baseUrl/payments";
  static const String eventTemplates = "$baseUrl/eventtemplates";
  static const String notifications = "$baseUrl/notifications";
  static const String recommendations = "$baseUrl/recommendations";
  static const String users = "$baseUrl/users";
}