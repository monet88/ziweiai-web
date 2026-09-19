import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:ziweiai_mobile/core/api/api_client.dart';

import 'package:ziweiai_mobile/core/api/api_provider.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late ProviderContainer container;
  late ApiClient apiClient;

  setUp(() {
    container = ProviderContainer();
    apiClient = container.read(apiClientProvider);
  });

  tearDown(() {
    container.dispose();
  });

  group('ApiClient Cloud Endpoints (Phase 45.1)', () {
    test('ApiClient exposes dio instance with configured timeouts', () {
      expect(apiClient.dio.options.connectTimeout, const Duration(seconds: 30));
      expect(apiClient.dio.options.receiveTimeout, const Duration(seconds: 30));
      expect(apiClient.dio.options.headers['Content-Type'], 'application/json');
    });

    test('ApiClient contains Dossier, IChing, Stick and Chart methods', () {
      // Reflection/Signature verification
      expect(apiClient.getDossierStatus, isNotNull);
      expect(apiClient.unlockDossier, isNotNull);
      expect(apiClient.drawIChing, isNotNull);
      expect(apiClient.drawStick, isNotNull);
      expect(apiClient.getHistory, isNotNull);
      expect(apiClient.getChartDetail, isNotNull);
      expect(apiClient.createChart, isNotNull);
    });
  });
}
