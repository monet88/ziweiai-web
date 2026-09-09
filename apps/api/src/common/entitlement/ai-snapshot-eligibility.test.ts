import { describe, expect, it } from 'vitest';
import { assertChartSnapshotEligibleForAi } from './ai-snapshot-eligibility';
import { ApiErrorHttpException } from '../http/api-error';

describe('assertChartSnapshotEligibleForAi', () => {
  it('does not throw when calculationConfidence is missing or blocksExactReading is false', () => {
    expect(() => assertChartSnapshotEligibleForAi(null)).not.toThrow();
    expect(() => assertChartSnapshotEligibleForAi({})).not.toThrow();
    expect(() =>
      assertChartSnapshotEligibleForAi({
        calculationConfidence: { blocksExactReading: false },
      }),
    ).not.toThrow();
  });

  it('throws ApiErrorHttpException when blocksExactReading is true', () => {
    expect(() =>
      assertChartSnapshotEligibleForAi({
        calculationConfidence: { blocksExactReading: true },
      }),
    ).toThrow(ApiErrorHttpException);

    try {
      assertChartSnapshotEligibleForAi({
        calculationConfidence: { blocksExactReading: true },
      });
    } catch (err) {
      const error = err as ApiErrorHttpException;
      expect(error.getStatus()).toBe(400);
      expect((error.getResponse() as any).code).toBe('INVALID_INPUT');
      expect((error.getResponse() as any).message).toContain('chưa đủ độ tin cậy');
    }
  });
});
