import { describe, expect, it } from 'vitest';
import { coinSumToLineState, coinsToLineState, tossThreeCoins } from './liuyao-coin-toss';

describe('liuyao-coin-toss', () => {
  it('maps coin sums 6-9 to the canonical line states', () => {
    expect(coinSumToLineState(6)).toBe('oldYin');
    expect(coinSumToLineState(7)).toBe('youngYang');
    expect(coinSumToLineState(8)).toBe('youngYin');
    expect(coinSumToLineState(9)).toBe('oldYang');
  });

  it('rejects an out-of-range sum', () => {
    expect(() => coinSumToLineState(5)).toThrow();
    expect(() => coinSumToLineState(10)).toThrow();
  });

  it('three heads (3+3+3=9) is oldYang, three tails (2+2+2=6) is oldYin', () => {
    expect(coinsToLineState([true, true, true])).toBe('oldYang');
    expect(coinsToLineState([false, false, false])).toBe('oldYin');
  });

  it('two heads one tail (3+3+2=8) is youngYin', () => {
    expect(coinsToLineState([true, true, false])).toBe('youngYin');
  });

  it('one head two tails (3+2+2=7) is youngYang', () => {
    expect(coinsToLineState([true, false, false])).toBe('youngYang');
  });

  it('rejects a toss that is not exactly three coins', () => {
    expect(() => coinsToLineState([true, false])).toThrow();
  });

  it('tossThreeCoins is deterministic with an injected random', () => {
    // random()=0 < 0.5 => head(true) for all three => sum 9 => oldYang
    const allHeads = tossThreeCoins(() => 0);
    expect(allHeads.coins).toEqual([true, true, true]);
    expect(allHeads.state).toBe('oldYang');
    // random()=0.9 >= 0.5 => tail(false) for all three => sum 6 => oldYin
    const allTails = tossThreeCoins(() => 0.9);
    expect(allTails.coins).toEqual([false, false, false]);
    expect(allTails.state).toBe('oldYin');
  });
});
