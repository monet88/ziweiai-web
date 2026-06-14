import { describe, expect, it } from 'vitest';

import { resolveApiBuildOutputPaths } from './dev-server-path.cjs';

describe('resolveApiBuildOutputPaths', () => {
  it('points dev runtime at the Nest build entry', () => {
    const paths = resolveApiBuildOutputPaths('F:/CodeBase/ziweiai/apps/api');

    expect(paths.distRoot.replace(/\\/g, '/')).toBe('F:/CodeBase/ziweiai/apps/api/dist');
    expect(paths.entryFile.replace(/\\/g, '/')).toBe('F:/CodeBase/ziweiai/apps/api/dist/apps/api/src/main.js');
  });
});
