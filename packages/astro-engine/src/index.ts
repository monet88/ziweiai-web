export const astroEngineRuntime = 'server-only';

export * from './adapters/astro-adapter';
export * from './adapters/iztro-chart-adapter';
export * from './adapters/liuyao-adapter';
export * from './adapters/daliuren-adapter';
export * from './adapters/qimen-adapter';
export * from './adapters/lunar-javascript-bazi-adapter';
export * from './adapters/meihua-adapter';
export * from './fixtures/phase-3-fixture-catalog';
export * from './normalization/normalize-birth-input';

export function assertAstroEngineRunsOnServer() {
  if (typeof window !== 'undefined') {
    throw new Error('Astrology engine must run on the server only.');
  }
}
