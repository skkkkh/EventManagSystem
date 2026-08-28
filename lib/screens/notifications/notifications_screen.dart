import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/notification_service.dart';
import '../../models/notification_model.dart';
import '../../core/api_exception.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _service = NotificationService();
  List<NotificationModel> _notifications = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final auth = context.read<AuthProvider>();
      final userId = auth.user?.userId;
      if (userId == null) throw ApiException('User not found');
      final notifications = await _service.getForUser(userId, auth.token);
      setState(() {
        _notifications = notifications;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _markRead(NotificationModel n) async {
    if (n.isRead) return;
    try {
      final token = context.read<AuthProvider>().token;
      await _service.markRead(n.id, token);
      _load();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(child: Text(_error!))
          : _notifications.isEmpty
          ? const Center(child: Text('No notifications'))
          : RefreshIndicator(
        onRefresh: _load,
        child: ListView.builder(
          itemCount: _notifications.length,
          itemBuilder: (context, index) {
            final n = _notifications[index];
            return ListTile(
              leading: Icon(
                n.isRead
                    ? Icons.notifications_none
                    : Icons.notifications_active,
                color: n.isRead ? Colors.grey : Colors.deepPurple,
              ),
              title: Text(n.message),
              subtitle: Text(
                '${n.type}  •  ${DateFormat('dd MMM, hh:mm a').format(n.createdAt)}',
              ),
              tileColor: n.isRead
                  ? null
                  : Colors.deepPurple.withValues(alpha:0.05),
              onTap: () => _markRead(n),
            );
          },
        ),
      ),
    );
  }
}