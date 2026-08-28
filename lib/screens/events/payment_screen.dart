import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/booking_service.dart';
import '../../models/booking_models.dart';

class PaymentScreen extends StatefulWidget {
  final BookingModel booking;
  const PaymentScreen({super.key, required this.booking});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final _bookingService = BookingService();
  String _selectedMethod = 'Card';
  bool _isSubmitting = false;
  String? _error;

  final _methods = ['Card', 'Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa'];

  Future<void> _payNow() async {
    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final token = context.read<AuthProvider>().token;
      final payment = await _bookingService.createPayment(
        bookingId: widget.booking.id,
        paymentMethod: _selectedMethod,
        token: token,
      );

      if (mounted) {
        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Payment Successful'),
            content: Text(
              'Transaction Ref: ${payment.transactionReference}\nAmount Paid: Rs. ${payment.amount.toStringAsFixed(2)}\nStatus: ${payment.status}',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                child: const Text('Done'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payment')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Booking #${widget.booking.id}',
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('Quantity: ${widget.booking.quantity}'),
                    Text(
                      'Total Amount: Rs. ${widget.booking.totalAmount.toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text('Select Payment Method',
                style: TextStyle(fontWeight: FontWeight.bold)),
            ..._methods.map((m) => RadioListTile<String>(
              title: Text(m),
              value: m,
              groupValue: _selectedMethod,
              onChanged: (v) => setState(() => _selectedMethod = v!),
            )),
            const SizedBox(height: 20),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child:
                Text(_error!, style: const TextStyle(color: Colors.red)),
              ),
            _isSubmitting
                ? const Center(child: CircularProgressIndicator())
                : SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _payNow,
                child: const Text('Pay Now'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}