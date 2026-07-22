import { describe, expect, it } from 'vitest';
import { buildMysticalOgTree, el } from './og-element';

describe('og-element', () => {
  it('el builds a satori-compatible node', () => {
    const node = el('span', { fontSize: 16 }, 'hello');
    expect(node).toEqual({
      type: 'span',
      props: { style: { fontSize: 16 }, children: 'hello' },
    });
  });

  it('buildMysticalOgTree includes title and optional year chip', () => {
    const tree = buildMysticalOgTree({
      systemName: 'Lục Hào',
      title: 'Quẻ Lục Hào · 2026',
      genderLabel: null,
      yearLabel: '2026',
    });

    expect(tree).toMatchObject({ type: 'div' });
    const json = JSON.stringify(tree);
    expect(json).toContain('Quẻ Lục Hào · 2026');
    expect(json).toContain('Lục Hào');
    expect(json).toContain('Năm 2026');
    expect(json).toContain('Tử Vi Toàn Tập');
  });
});
