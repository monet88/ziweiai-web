import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns a contract-valid health response', () => {
    const health = new HealthController().getHealth();

    expect(health.status).toBe('ok');
    expect(health.service).toBeTruthy();
    expect(health.version).toBeTruthy();
  });
});
