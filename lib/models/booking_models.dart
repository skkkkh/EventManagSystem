class TicketTypeModel {
  final int id;
  final String name;
  final double price;
  final int quantity;
  final int eventId;

  TicketTypeModel({
    required this.id,
    required this.name,
    required this.price,
    required this.quantity,
    required this.eventId,
  });

  factory TicketTypeModel.fromJson(Map<String, dynamic> json) {
    return TicketTypeModel(
      id: json['id'],
      name: json['name'] ?? '',
      price: (json['price'] as num).toDouble(),
      quantity: json['quantity'] ?? 0,
      eventId: json['eventId'],
    );
  }
}

class RegistrationModel {
  final int id;
  final String fullName;
  final String email;
  final String? phone;
  final int eventId;

  RegistrationModel({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    required this.eventId,
  });

  factory RegistrationModel.fromJson(Map<String, dynamic> json) {
    return RegistrationModel(
      id: json['id'],
      fullName: json['fullName'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      eventId: json['eventId'],
    );
  }
}

class BookingModel {
  final int id;
  final int registrationId;
  final int ticketTypeId;
  final int quantity;
  final double totalAmount;
  final String status;
  final DateTime bookedAt;

  BookingModel({
    required this.id,
    required this.registrationId,
    required this.ticketTypeId,
    required this.quantity,
    required this.totalAmount,
    required this.status,
    required this.bookedAt,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    return BookingModel(
      id: json['id'],
      registrationId: json['registrationId'],
      ticketTypeId: json['ticketTypeId'],
      quantity: json['quantity'],
      totalAmount: (json['totalAmount'] as num).toDouble(),
      status: json['status'] ?? '',
      bookedAt: DateTime.parse(json['bookedAt']),
    );
  }
}

class PaymentModel {
  final int id;
  final int bookingId;
  final double amount;
  final String paymentMethod;
  final String status;
  final String? transactionReference;
  final DateTime createdAt;

  PaymentModel({
    required this.id,
    required this.bookingId,
    required this.amount,
    required this.paymentMethod,
    required this.status,
    this.transactionReference,
    required this.createdAt,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      id: json['id'],
      bookingId: json['bookingId'],
      amount: (json['amount'] as num).toDouble(),
      paymentMethod: json['paymentMethod'] ?? '',
      status: json['status'] ?? '',
      transactionReference: json['transactionReference'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}