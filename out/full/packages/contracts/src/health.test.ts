import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './health';

describe('healthResponseSchema', () => {
  it('parses a valid health response', () => {
    const parsed = healthResponseSchema.parse({
      service: 'ziweiai-api',
      status: 'ok',
      timestamp: '2026-06-02T00:00:00.000Z',
      version: '0.1.0',
    });

    expect(parsed.status).toBe('ok');
  });

  it('rejects an invalid status', () => {
    const result = healthResponseSchema.safeParse({
      service: 'ziweiai-api',
      status: 'down',
      timestamp: '2026-06-02T00:00:00.000Z',
      version: '0.1.0',
    });

    expect(result.success).toBe(false);
  });
});
