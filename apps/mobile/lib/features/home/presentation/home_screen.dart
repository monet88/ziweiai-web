import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../charts/data/models/birth_input.dart';
import '../../charts/data/models/create_chart_request.dart';
import '../../charts/data/models/chart_snapshot.dart';
import '../../charts/presentation/charts_provider.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../auth/data/repositories/auth_repository.dart';
import '../../vision/data/models/vision_kind.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _yearController = TextEditingController(text: '1990');
  final _monthController = TextEditingController(text: '1');
  final _dayController = TextEditingController(text: '1');
  final _hourController = TextEditingController(text: '12');
  String _gender = 'male';
  String _calendar = 'gregorian';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAndSignInAnonymously();
    });
  }

  Future<void> _checkAndSignInAnonymously() async {
    final authRepo = ref.read(authRepositoryProvider);
    if (authRepo.currentUser == null) {
      try {
        await authRepo.signInAnonymously();
      } catch (e) {
        // Suppress in production
      }
    }
  }

  void _submit() {
    final year = int.tryParse(_yearController.text) ?? 1990;
    final month = int.tryParse(_monthController.text) ?? 1;
    final day = int.tryParse(_dayController.text) ?? 1;
    final hour = int.tryParse(_hourController.text) ?? 12;

    final request = CreateChartRequest(
      chartSystem: 'zi-wei-dou-shu',
      birthInput: BirthInput(
        calendar: _calendar,
        date: BirthDate(year: year, month: month, day: day, isLeapMonth: _calendar == 'lunar' ? false : null),
        time: BirthTime(hour: hour, minute: 0, isUnknown: false),
        sexOrGenderForChart: _gender,
        place: BirthPlace(label: 'Hà Nội', manual: null),
        locale: 'vi-VN',
        source: 'user-entered',
      ),
    );

    ref.read(chartsProvider.notifier).createChart(request);
  }

  @override
  Widget build(BuildContext context) {
    final chartState = ref.watch(chartsProvider);

    ref.listen<AsyncValue<ChartDetailResponse?>>(
      chartsProvider,
      (previous, next) {
        if (next.hasValue && next.value != null) {
          if (mounted) {
            context.push('/charts/${next.value!.chartRecord.id}', extra: next.value);
          }
        } else if (next.hasError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi: ${next.error}')),
          );
        }
      },
    );

    final authState = ref.watch(authStateProvider);
    final user = authState.value;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tử Vi Toàn Tập'),
        actions: [
          if (user != null) ...[
            IconButton(
              icon: const Icon(Icons.account_balance_wallet, color: Colors.orange),
              onPressed: () {
                context.push('/wallet');
              },
            ),
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0),
                child: Text(user.email ?? 'User', style: const TextStyle(fontSize: 12)),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () {
                ref.read(authRepositoryProvider).signOut();
              },
            ),
          ] else ...[
            IconButton(
              icon: const Icon(Icons.person),
              onPressed: () {
                context.push('/auth');
              },
            ),
          ],
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Nhập thông tin sinh', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: TextField(controller: _dayController, decoration: const InputDecoration(labelText: 'Ngày'))),
                const SizedBox(width: 8),
                Expanded(child: TextField(controller: _monthController, decoration: const InputDecoration(labelText: 'Tháng'))),
                const SizedBox(width: 8),
                Expanded(child: TextField(controller: _yearController, decoration: const InputDecoration(labelText: 'Năm'))),
              ],
            ),
            const SizedBox(height: 16),
            TextField(controller: _hourController, decoration: const InputDecoration(labelText: 'Giờ (0-23)')),
            const SizedBox(height: 16),
            DropdownButton<String>(
              value: _gender,
              isExpanded: true,
              items: const [
                DropdownMenuItem(value: 'male', child: Text('Nam')),
                DropdownMenuItem(value: 'female', child: Text('Nữ')),
              ],
              onChanged: (value) => setState(() => _gender = value!),
            ),
            const SizedBox(height: 16),
            DropdownButton<String>(
              value: _calendar,
              isExpanded: true,
              items: const [
                DropdownMenuItem(value: 'gregorian', child: Text('Dương Lịch')),
                DropdownMenuItem(value: 'lunar', child: Text('Âm Lịch')),
              ],
              onChanged: (value) => setState(() => _calendar = value!),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: chartState.isLoading ? null : _submit,
              child: chartState.isLoading 
                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)) 
                : const Text('Lập lá số Tử Vi'),
            ),
            const SizedBox(height: 48),
            const Divider(),
            const SizedBox(height: 16),
            const Text('Bộ công cụ mở rộng (Web)', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.auto_awesome),
                    label: const Text('Đọc bài Tarot'),
                    onPressed: () => context.push('/vision/input', extra: VisionKind.tarot),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.face),
                    label: const Text('Xem Tướng Mặt'),
                    onPressed: () => context.push('/vision/input', extra: VisionKind.face),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.pan_tool),
                    label: const Text('Xem Chỉ Tay'),
                    onPressed: () => context.push('/vision/input', extra: VisionKind.palm),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.calculate),
                    label: const Text('Thần Số Học'),
                    onPressed: () => context.push('/numerology'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Future<void> _launchWeb(String path) async {
  //   // Should inject environment config, but using hardcoded for simplicity in this fallback.
  //   final uri = Uri.parse('https://tuvitoantap.vercel.app$path');
  //   if (await canLaunchUrl(uri)) {
  //     await launchUrl(uri, mode: LaunchMode.externalApplication);
  //   }
  // }
}
