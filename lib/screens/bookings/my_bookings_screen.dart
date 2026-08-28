import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/booking_service.dart';
import '../../models/booking_models.dart';
import '../events/payment_screen.dart';

class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> {
  final _bookingService = BookingService();
  List<BookingModel> _myBookings = [];
  Map<int, TicketTypeModel> _ticketMap = {};
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final auth = context.read<AuthProvider>();
      final token = auth.token;
      final myEmail = auth.user?.email;

      final registrations = await _bookingService.getAllRegistrations(token);
      final myRegIds = registrations
          .where((r) => r.email.toLowerCase() == (myEmail ?? '').toLowerCase())
          .map((r) => r.id)
          .toSet();

      final bookings = await _bookingService.getAllBookings(token);
      final ticketMap = await _bookingService.getAllTicketTypesMap(token);

      setState(() {
        _myBookings =
            bookings.where((b) => myRegIds.contains(b.registrationId)).toList();
        _ticketMap = ticketMap;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'Confirmed':
        return Colors.green;
      case 'Cancelled':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Bookings')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(child: Text(_error!))
          : _myBookings.isEmpty
          ? const Center(child: Text('No bookings yet'))
          : RefreshIndicator(
        onRefresh: _loadData,
        child: ListView.builder(
          itemCount: _myBookings.length,
          itemBuilder: (context, index) {
            final booking = _myBookings[index];
            final ticket = _ticketMap[booking.ticketTypeId];

            return Card(
              margin: const EdgeInsets.symmetric(
                  horizontal: 12, vertical: 6),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment:
                      MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Booking #${booking.id}',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold)),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _statusColor(booking.status)
                                .withOpacity(0.15),
                            borderRadius:
                            BorderRadius.circular(6),
                          ),
                          child: Text(
                            booking.status,
                            style: TextStyle(
                              color: _statusColor(booking.status),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    if (ticket != null)
                      Text('Ticket: ${ticket.name}'),
                    Text('Quantity: ${booking.quantity}'),
                    Text(
                      'Total: Rs. ${booking.totalAmount.toStringAsFixed(2)}',
                    ),
                    Text(
                      DateFormat('dd MMM yyyy, hh:mm a')
                          .format(booking.bookedAt),
                      style: const TextStyle(
                          fontSize: 12, color: Colors.grey),
                    ),
                    if (booking.status == 'Pending')
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => PaymentScreen(
                                    booking: booking),
                              ),
                            ).then((_) => _loadData());
                          },
                          child: const Text('Pay Now'),
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}