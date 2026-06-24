import { describe, expect, it } from 'vitest';
import { getChartDetailState, shouldRenderZiweiBoard } from './chart-detail-view-state';

describe('chart detail view state', () => {
  it('hides the ziwei board when a ziwei snapshot has no palace data', () => {
    expect(shouldRenderZiweiBoard('zi-wei-dou-shu', 0)).toBe(false);
    expect(getChartDetailState('zi-wei-dou-shu', 0)).toBe('unsupported');
  });

  it('renders the ziwei board only when the snapshot is ziwei and has palace data', () => {
    expect(shouldRenderZiweiBoard('zi-wei-dou-shu', 12)).toBe(true);
    expect(getChartDetailState('zi-wei-dou-shu', 12)).toBe('ziwei-board');
    expect(shouldRenderZiweiBoard('ba-zi', 12)).toBe(false);
  });

  it('dispatches non-ziwei systems to the right renderer mode', () => {
    expect(getChartDetailState('ba-zi', 0)).toBe('pillars');
    // US-017d: Mạnh Phái luận trên Bát Tự nhưng có chế độ render riêng (khối luận giải Mạnh Phái).
    expect(getChartDetailState('mangpai', 0)).toBe('mangpai');
    expect(getChartDetailState('mei-hua-yi-shu', 0)).toBe('hexagram');
    expect(getChartDetailState('liu-yao', 0)).toBe('liuyao');
    expect(getChartDetailState('da-liu-ren', 0)).toBe('daliuren');
    expect(getChartDetailState('qi-men-dun-jia', 0)).toBe('qimen');
  });

  it('keeps US-017 framework-only systems on unsupported renderer fallback', () => {
    // US-017d: 'mangpai' đã có chế độ render riêng → rời danh sách unsupported.
    for (const system of ['hepan', 'tarot', 'mbti', 'face', 'palm'] as const) {
      expect(getChartDetailState(system, 0)).toBe('unsupported');
    }
  });
});
