import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/booking_service.dart';
import '../../models/booking_models.dart';
import '../../models/event_model.dart';
import 'payment_screen.dart';

class BookingScreen extends StatefulWidget {
  final EventModel event;
  const BookingScreen({super.key, required this.event});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final _bookingService = BookingService();
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();

  List<TicketTypeModel> _ticketTypes = [];
  TicketTypeModel? _selectedTicket;
  int _quantity = 1;
  bool _isLoadingTickets = true;
  bool _isSubmitting = false;
  String? _error;

  int? _availableSeats;
  bool _isCheckingSeats = false;

  @override
  void initState() {
    super.initState();
    _loadTicketTypes();
  }

  Future<void> _loadTicketTypes() async {
    try {
      final token = context.read<AuthProvider>().token;
      final tickets = await _bookingService.getTicketTypesForEvent(
        widget.event.id,
        token,
      );
      setState(() {
        _ticketTypes = tickets;
        _selectedTicket = tickets.isNotEmpty ? tickets.first : null;
        _isLoadingTickets = false;
      });
      if (_selectedTicket != null) {
        _checkAvailableSeats(_selectedTicket!.id);
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoadingTickets = false;
      });
    }
  }

  Future<void> _checkAvailableSeats(int ticketTypeId) async {
    setState(() {
      _isCheckingSeats = true;
      _availableSeats = null;
    });
    try {
      final token = context.read<AuthProvider>().token;
      final seats =
      await _bookingService.getAvailableSeats(ticketTypeId, token);
      setState(() {
        _availableSeats = seats;
        _isCheckingSeats = false;
        if (_quantity > seats && seats > 0) {
          _quantity = seats;
        }
      });
    } catch (e) {
      setState(() => _isCheckingSeats = false);
    }
  }

  Future<void> _submitBooking() async {
    if (!_formKey.currentState!.validate() || _selectedTicket == null) return;

    if (_availableSeats != null && _quantity > _availableSeats!) {
      setState(() =>
      _error = 'Only $_availableSeats seat(s) available for this ticket');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final token = context.read<AuthProvider>().token;

      final registration = await _bookingService.createRegistration(
        fullName: _nameController.text.trim(),
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim().isEmpty
            ? null
            : _phoneController.text.trim(),
        eventId: widget.event.id,
        token: token,
      );

      final booking = await _bookingService.createBooking(
        registrationId: registration.id,
        ticketTypeId: _selectedTicket!.id,
        quantity: _quantity,
        token: token,
      );

      if (mounted) {
        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Booking Created'),
            content: Text(
              'Booking ID: ${booking.id}\nTotal Amount: Rs. ${booking.totalAmount.toStringAsFixed(2)}\n\nProceed to payment?',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pop(context);
                },
                child: const Text('Later'),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => PaymentScreen(booking: booking),
                    ),
                  );
                },
                child: const Text('Pay Now'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Book: ${widget.event.title}')),
      body: _isLoadingTickets
          ? const Center(child: CircularProgressIndicator())
          : Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Full Name'),
                validator: (v) =>
                (v == null || v.isEmpty) ? 'Name is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (v) => (v == null || !v.contains('@'))
                    ? 'Valid email is required'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(
                    labelText: 'Phone (optional)'),
              ),
              const SizedBox(height: 20),
              if (_ticketTypes.isEmpty)
                const Text('No ticket types available for this event')
              else ...[
                DropdownButtonFormField<TicketTypeModel>(
                  value: _selectedTicket,
                  decoration:
                  const InputDecoration(labelText: 'Ticket Type'),
                  items: _ticketTypes
                      .map((t) => DropdownMenuItem(
                    value: t,
                    child: Text(
                        '${t.name} - Rs. ${t.price}'),
                  ))
                      .toList(),
                  onChanged: (v) {
                    setState(() {
                      _selectedTicket = v;
                      _quantity = 1;
                    });
                    if (v != null) _checkAvailableSeats(v.id);
                  },
                ),
                const SizedBox(height: 8),
                if (_isCheckingSeats)
                  const Row(
                    children: [
                      SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      SizedBox(width: 8),
                      Text('Checking availability...'),
                    ],
                  )
                else if (_availableSeats != null)
                  Row(
                    children: [
                      Icon(
                        _availableSeats! > 0
                            ? Icons.check_circle_outline
                            : Icons.error_outline,
                        size: 16,
                        color: _availableSeats! > 0
                            ? Colors.green
                            : Colors.red,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _availableSeats! > 0
                            ? '$_availableSeats seat(s) available'
                            : 'Sold out',
                        style: TextStyle(
                          color: _availableSeats! > 0
                              ? Colors.green
                              : Colors.red,
                        ),
                      ),
                    ],
                  ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Text('Quantity:'),
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline),
                      onPressed: _quantity > 1
                          ? () => setState(() => _quantity--)
                          : null,
                    ),
                    Text('$_quantity',
                        style: const TextStyle(fontSize: 18)),
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline),
                      onPressed: (_availableSeats == null ||
                          _quantity < _availableSeats!)
                          ? () => setState(() => _quantity++)
                          : null,
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 20),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(_error!,
                      style: const TextStyle(color: Colors.red)),
                ),
              _isSubmitting
                  ? const Center(child: CircularProgressIndicator())
                  : ElevatedButton(
                onPressed: (_ticketTypes.isEmpty ||
                    (_availableSeats != null &&
                        _availableSeats! <= 0))
                    ? null
                    : _submitBooking,
                child: const Text('Confirm Booking'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}