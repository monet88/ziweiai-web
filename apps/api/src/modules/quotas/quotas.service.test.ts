import { describe, expect, it } from 'vitest';
import { QuotasService } from './quotas.service';

describe('QuotasService', () => {
  it('allows requests while usage stays under configured limits', async () => {
    const service = new QuotasService({
      countChartSnapshotsSince: async () => 0,
      countExplanationRequestsSince: async () => 0,
    } as never);

    await expect(service.assertCanCreateChart('user-a', '127.0.0.1')).resolves.toBeUndefined();
    await expect(service.assertCanCreateExplanation('user-a', '127.0.0.1')).resolves.toBeUndefined();
  });

  it('blocks when daily chart quota is exhausted', async () => {
    const service = new QuotasService({
      countChartSnapshotsSince: async () => 20,
      countExplanationRequestsSince: async () => 0,
    } as never);

    await expect(service.assertCanCreateChart('user-a', '127.0.0.1')).rejects.toThrow('Daily chart quota exceeded.');
  });
});
