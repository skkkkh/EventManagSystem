import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/booking_service.dart';
import '../../models/booking_models.dart';
import '../../models/event_model.dart';

class ManageTicketTypesScreen extends StatefulWidget {
  final EventModel event;
  const ManageTicketTypesScreen({super.key, required this.event});

  @override
  State<ManageTicketTypesScreen> createState() =>
      _ManageTicketTypesScreenState();
}

class _ManageTicketTypesScreenState extends State<ManageTicketTypesScreen> {
  final _bookingService = BookingService();
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _priceController = TextEditingController();
  final _quantityController = TextEditingController();

  List<TicketTypeModel> _ticketTypes = [];
  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTicketTypes();
  }

  Future<void> _loadTicketTypes() async {
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final tickets = await _bookingService.getTicketTypesForEvent(
        widget.event.id,
        token,
      );
      setState(() {
        _ticketTypes = tickets;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _addTicketType() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final token = context.read<AuthProvider>().token;
      await _bookingService.createTicketType(
        name: _nameController.text.trim(),
        price: double.parse(_priceController.text.trim()),
        quantity: int.parse(_quantityController.text.trim()),
        eventId: widget.event.id,
        token: token,
      );

      _nameController.clear();
      _priceController.clear();
      _quantityController.clear();

      await _loadTicketTypes();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ticket type added')),
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
      appBar: AppBar(title: Text('Ticket Types: ${widget.event.title}')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Form(
              key: _formKey,
              child: Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(labelText: 'Name'),
                      validator: (v) =>
                      (v == null || v.isEmpty) ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: _priceController,
                      decoration: const InputDecoration(labelText: 'Price'),
                      keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Required';
                        if (double.tryParse(v) == null) return 'Invalid';
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: _quantityController,
                      decoration: const InputDecoration(labelText: 'Qty'),
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Required';
                        if (int.tryParse(v) == null || int.parse(v) < 1) {
                          return 'Invalid';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child:
                Text(_error!, style: const TextStyle(color: Colors.red)),
              ),
            _isSubmitting
                ? const Center(child: CircularProgressIndicator())
                : SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _addTicketType,
                icon: const Icon(Icons.add),
                label: const Text('Add Ticket Type'),
              ),
            ),
            const Divider(height: 32),
            const Text('Existing Ticket Types',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _ticketTypes.isEmpty
                  ? const Center(child: Text('No ticket types yet'))
                  : ListView.builder(
                itemCount: _ticketTypes.length,
                itemBuilder: (context, index) {
                  final t = _ticketTypes[index];
                  return Card(
                    child: ListTile(
                      title: Text(t.name),
                      subtitle: Text(
                          'Rs. ${t.price.toStringAsFixed(2)}  •  ${t.quantity} available'),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}