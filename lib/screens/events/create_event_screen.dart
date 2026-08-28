import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/event_service.dart';
import 'create_template_screen.dart';

class CreateEventScreen extends StatefulWidget {
  const CreateEventScreen({super.key});

  @override
  State<CreateEventScreen> createState() => _CreateEventScreenState();
}

class _CreateEventScreenState extends State<CreateEventScreen> {
  final _eventService = EventService();
  final _formKey = GlobalKey<FormState>();

  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _capacityController = TextEditingController();

  DateTime? _startDateTime;
  DateTime? _endDateTime;

  List<dynamic> _templates = [];
  int? _selectedTemplateId;

  bool _isLoadingTemplates = true;
  bool _isSubmitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTemplates();
  }

  Future<void> _loadTemplates() async {
    setState(() => _isLoadingTemplates = true);
    try {
      final token = context.read<AuthProvider>().token;
      final templates = await _eventService.getEventTemplates(token);
      setState(() {
        _templates = templates;
        _selectedTemplateId = templates.isNotEmpty ? templates[0]['id'] : null;
        _isLoadingTemplates = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoadingTemplates = false;
      });
    }
  }

  Future<void> _pickDateTime({required bool isStart}) async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
    );
    if (date == null) return;

    if (!mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (time == null) return;

    final combined = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );

    setState(() {
      if (isStart) {
        _startDateTime = combined;
      } else {
        _endDateTime = combined;
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_startDateTime == null || _endDateTime == null) {
      setState(() => _error = 'Please select both start and end date/time');
      return;
    }
    if (_selectedTemplateId == null) {
      setState(() => _error = 'Please select an event template');
      return;
    }
    if (_endDateTime!.isBefore(_startDateTime!)) {
      setState(() => _error = 'End date/time must be after start date/time');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final token = context.read<AuthProvider>().token;
      await _eventService.createEvent(
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
        location: _locationController.text.trim().isEmpty
            ? null
            : _locationController.text.trim(),
        startDateTime: _startDateTime!,
        endDateTime: _endDateTime!,
        capacity: int.parse(_capacityController.text.trim()),
        eventTemplateId: _selectedTemplateId!,
        token: token,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Event created successfully')),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  String _formatDateTime(DateTime? dt) {
    if (dt == null) return 'Not selected';
    return '${dt.day}/${dt.month}/${dt.year}  ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Event')),
      body: _isLoadingTemplates
          ? const Center(child: CircularProgressIndicator())
          : Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'Title'),
                validator: (v) =>
                (v == null || v.isEmpty) ? 'Title is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Description'),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _locationController,
                decoration: const InputDecoration(labelText: 'Location'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _capacityController,
                decoration: const InputDecoration(labelText: 'Capacity'),
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Capacity is required';
                  if (int.tryParse(v) == null || int.parse(v) < 1) {
                    return 'Enter a valid number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              if (_templates.isEmpty)
                const Text('No event templates available')
              else
                DropdownButtonFormField<int>(
                  value: _selectedTemplateId,
                  decoration:
                  const InputDecoration(labelText: 'Event Template'),
                  items: _templates
                      .map<DropdownMenuItem<int>>(
                        (t) => DropdownMenuItem(
                      value: t['id'] as int,
                      child: Text(t['name'] ?? ''),
                    ),
                  )
                      .toList(),
                  onChanged: (v) =>
                      setState(() => _selectedTemplateId = v),
                ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () async {
                    final created = await Navigator.push<bool>(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const CreateTemplateScreen(),
                      ),
                    );
                    if (created == true) {
                      _loadTemplates();
                    }
                  },
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('New Template'),
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Start Date & Time'),
                subtitle: Text(_formatDateTime(_startDateTime)),
                trailing: const Icon(Icons.calendar_today),
                onTap: () => _pickDateTime(isStart: true),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('End Date & Time'),
                subtitle: Text(_formatDateTime(_endDateTime)),
                trailing: const Icon(Icons.calendar_today),
                onTap: () => _pickDateTime(isStart: false),
              ),
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
                onPressed: _submit,
                child: const Text('Create Event'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}