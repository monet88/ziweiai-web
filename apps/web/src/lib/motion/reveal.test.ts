import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion, revealElements, revealHexagramLines } from './reveal';

describe('reveal motion helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('prefersReducedMotion mirrors matchMedia', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, media: '(prefers-reduced-motion: reduce)' }),
    );
    expect(prefersReducedMotion()).toBe(true);
  });

  it('revealElements is a no-op cleanup when reduced motion is on', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, media: '(prefers-reduced-motion: reduce)' }),
    );
    const root = document.createElement('div');
    const child = document.createElement('div');
    child.setAttribute('data-reveal', '');
    child.style.opacity = '0';
    root.appendChild(child);
    document.body.appendChild(root);

    const cleanup = revealElements(root);
    expect(child.style.opacity).toBe('1');
    expect(() => cleanup()).not.toThrow();
  });

  it('revealHexagramLines leaves lines visible under reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, media: '(prefers-reduced-motion: reduce)' }),
    );
    const root = document.createElement('div');
    const line = document.createElement('div');
    line.setAttribute('data-reveal-line', '');
    line.style.opacity = '0';
    root.appendChild(line);
    document.body.appendChild(root);

    const cleanup = revealHexagramLines(root);
    expect(line.style.opacity).toBe('1');
    cleanup();
  });
});
