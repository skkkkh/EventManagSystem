import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/recommendation_service.dart';
import '../../models/recommendation_model.dart';
import '../events/event_detail_screen.dart';
import '../../core/api_exception.dart';

class RecommendationsScreen extends StatefulWidget {
  const RecommendationsScreen({super.key});

  @override
  State<RecommendationsScreen> createState() => _RecommendationsScreenState();
}

class _RecommendationsScreenState extends State<RecommendationsScreen> {
  final _service = RecommendationService();
  List<RecommendationModel> _recommendations = [];
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
      final recs = await _service.getForUser(userId, auth.token);
      setState(() {
        _recommendations = recs;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Recommended For You')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(child: Text(_error!))
          : _recommendations.isEmpty
          ? const Center(child: Text('No recommendations yet'))
          : RefreshIndicator(
        onRefresh: _load,
        child: ListView.builder(
          itemCount: _recommendations.length,
          itemBuilder: (context, index) {
            final r = _recommendations[index];
            return Card(
              margin: const EdgeInsets.symmetric(
                  horizontal: 12, vertical: 6),
              child: ListTile(
                title: Text(r.event.title,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold)),
                subtitle: Text(r.reason),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => EventDetailScreen(
                          eventId: r.event.id),
                    ),
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}