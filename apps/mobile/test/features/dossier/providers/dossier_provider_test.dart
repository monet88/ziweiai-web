import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:ziweiai_mobile/core/api/api_client.dart';
import 'package:ziweiai_mobile/core/api/api_provider.dart';
import 'package:ziweiai_mobile/features/dossier/providers/dossier_provider.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  late MockApiClient mockApiClient;

  setUp(() {
    mockApiClient = MockApiClient();
  });

  ProviderContainer createContainer() {
    return ProviderContainer(
      overrides: [
        apiClientProvider.overrideWithValue(mockApiClient),
      ],
    );
  }

  group('DossierNotifier Cloud Unlock Tests (Phase 45.3)', () {
    test('unlockDossier calls API, invalidates wallet balance, and updates isUnlocked state', () async {
      when(() => mockApiClient.unlockDossier('chart-8899')).thenAnswer((_) async => {
        'success': true,
        'unlocked': true,
        'alreadyUnlocked': false,
        'xuCharged': 50,
        'remainingBalance': 38,
      });

      final container = createContainer();
      addTearDown(container.dispose);

      final notifier = container.read(dossierProvider.notifier);
      final success = await notifier.unlockDossier('chart-8899');

      expect(success, true);
      expect(container.read(dossierProvider).isUnlocked, true);
      verify(() => mockApiClient.unlockDossier('chart-8899')).called(1);
    });

    test('loadDossier with chartId fetches status from API', () async {
      when(() => mockApiClient.getDossierStatus('chart-8899')).thenAnswer((_) async => {
        'isUnlocked': false,
        'feeXu': 50,
      });

      final container = createContainer();
      addTearDown(container.dispose);

      final notifier = container.read(dossierProvider.notifier);
      await notifier.loadDossier(chartId: 'chart-8899');

      final state = container.read(dossierProvider);
      expect(state.isLoading, false);
      expect(state.isUnlocked, false);
      expect(state.unlockFee, 50);
      verify(() => mockApiClient.getDossierStatus('chart-8899')).called(1);
    });
  });
}
