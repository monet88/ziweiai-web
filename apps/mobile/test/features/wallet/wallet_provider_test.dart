import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:ziweiai_mobile/core/api/api_client.dart';
import 'package:ziweiai_mobile/core/api/api_provider.dart';
import 'package:ziweiai_mobile/features/wallet/providers/wallet_provider.dart';

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

  group('WalletProvider Tests (Phase 45.1)', () {
    test('walletBalanceProvider returns balance on API success', () async {
      when(() => mockApiClient.getWalletBalance()).thenAnswer((_) async => 88);

      final container = createContainer();
      addTearDown(container.dispose);

      final balance = await container.read(walletBalanceProvider.future);
      expect(balance, 88);
      verify(() => mockApiClient.getWalletBalance()).called(1);
    });

    test('walletBalanceProvider falls back to 0 on API failure (graceful degradation)', () async {
      when(() => mockApiClient.getWalletBalance()).thenThrow(Exception('Network offline'));

      final container = createContainer();
      addTearDown(container.dispose);

      final balance = await container.read(walletBalanceProvider.future);
      expect(balance, 0);
    });

    test('walletTransactionsProvider returns list on API success', () async {
      when(() => mockApiClient.getWalletTransactions()).thenAnswer((_) async => {
        'data': [
          {
            'id': 'tx-001',
            'userId': 'user-123',
            'amount': -50,
            'balanceAfter': 38,
            'transactionType': 'pdf_dossier',
            'description': 'Mở khóa Hồ sơ Hoàng Gia 19 Trang',
            'createdAt': '2026-09-09T18:00:00.000Z',
          }
        ]
      });

      final container = createContainer();
      addTearDown(container.dispose);

      final txs = await container.read(walletTransactionsProvider.future);
      expect(txs.length, 1);
      expect(txs.first.id, 'tx-001');
      expect(txs.first.amount, -50);
      expect(txs.first.transactionType, 'pdf_dossier');
    });

    test('WalletController claimReward invokes API and triggers refresh', () async {
      when(() => mockApiClient.claimAdReward()).thenAnswer((_) async => {'reward': 5});
      when(() => mockApiClient.getWalletBalance()).thenAnswer((_) async => 105);

      final container = createContainer();
      addTearDown(container.dispose);

      final controller = container.read(walletControllerProvider);
      final result = await controller.claimReward();

      expect(result, true);
      verify(() => mockApiClient.claimAdReward()).called(1);
    });
  });
}
