import { describe, expect, it } from 'vitest';
import {
  assertUniqueIds,
  chunk,
  containsCjkText,
  translateUnits,
  validateTranslation,
  TranslationError,
  type BatchTranslator,
  type TranslationUnit,
} from './core';

// Fake translator: dịch theo map cố định id -> vi. Không network. Cho phép mô phỏng
// "lần đầu còn Hán, retry mới sạch" qua tham số attemptsBeforeClean.
function fakeTranslator(
  clean: Record<string, string>,
  options: { dirtyFirst?: Record<string, string> } = {},
): { translator: BatchTranslator; calls: () => number } {
  let callCount = 0;
  const dirtyServed = new Set<string>();
  const translator: BatchTranslator = async (units) => {
    callCount += 1;
    const map = new Map<string, string>();
    for (const unit of units) {
      const dirty = options.dirtyFirst?.[unit.id];
      if (dirty !== undefined && !dirtyServed.has(unit.id)) {
        dirtyServed.add(unit.id);
        map.set(unit.id, dirty);
      } else {
        map.set(unit.id, clean[unit.id] ?? `vi:${unit.id}`);
      }
    }
    return map;
  };
  return { translator, calls: () => callCount };
}

const units = (ids: string[]): TranslationUnit[] => ids.map((id) => ({ id, text: `汉${id}` }));

describe('containsCjkText', () => {
  it('phát hiện chữ Hán', () => {
    expect(containsCjkText('海中金')).toBe(true);
    expect(containsCjkText('Hải Trung Kim')).toBe(false);
  });
});

describe('chunk', () => {
  it('chia đúng kích thước, batch cuối ngắn hơn', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it('ném khi size < 1', () => {
    expect(() => chunk([1], 0)).toThrow(TranslationError);
  });
});

describe('assertUniqueIds', () => {
  it('ném khi trùng id', () => {
    expect(() => assertUniqueIds(units(['a', 'a']))).toThrow(/Trùng id/);
  });
  it('ném khi id rỗng', () => {
    expect(() => assertUniqueIds([{ id: '', text: 'x' }])).toThrow(/id rỗng/);
  });
});

describe('translateUnits', () => {
  it('dịch toàn bộ, đếm khớp, không rò Hán', async () => {
    const { translator, calls } = fakeTranslator({ a: 'A', b: 'B', c: 'C' });
    const report = await translateUnits(units(['a', 'b', 'c']), translator, { batchSize: 2 });
    expect(report.translated.size).toBe(3);
    expect(report.fromLlm).toBe(3);
    expect(report.fromCache).toBe(0);
    expect(calls()).toBe(2); // 2 batch
  });

  it('bỏ qua unit đã có trong cache sạch', async () => {
    const { translator } = fakeTranslator({ b: 'B', c: 'C' });
    const cache = new Map([['a', 'A-cached']]);
    const report = await translateUnits(units(['a', 'b', 'c']), translator, { cache });
    expect(report.fromCache).toBe(1);
    expect(report.fromLlm).toBe(2);
    expect(report.translated.get('a')).toBe('A-cached');
  });

  it('coi cache còn Hán là miss và dịch lại', async () => {
    const { translator } = fakeTranslator({ a: 'A-clean' });
    const cache = new Map([['a', '还有汉字']]);
    const report = await translateUnits(units(['a']), translator, { cache });
    expect(report.fromCache).toBe(0);
    expect(report.translated.get('a')).toBe('A-clean');
  });

  it('retry phần còn rò Hán rồi sạch', async () => {
    const { translator } = fakeTranslator({ a: 'A-clean' }, { dirtyFirst: { a: '脏' } });
    const report = await translateUnits(units(['a']), translator, { maxRetries: 2 });
    expect(report.retried).toBe(1);
    expect(report.translated.get('a')).toBe('A-clean');
  });

  it('fail-fast khi hết retry vẫn còn Hán', async () => {
    const { translator } = fakeTranslator({}, { dirtyFirst: {} });
    // translator luôn trả Hán
    const alwaysHan: BatchTranslator = async (us) =>
      new Map(us.map((u) => [u.id, '永远汉字']));
    await expect(translateUnits(units(['a']), alwaysHan, { maxRetries: 1 })).rejects.toThrow(/còn.*chữ Hán/i);
    void translator;
  });

  it('ném khi translator thiếu bản dịch cho một id', async () => {
    const partial: BatchTranslator = async () => new Map();
    await expect(translateUnits(units(['a']), partial)).rejects.toThrow(/không trả bản dịch/);
  });
});

describe('validateTranslation', () => {
  it('ném khi số bản dịch không khớp', () => {
    expect(() => validateTranslation(units(['a', 'b']), new Map([['a', 'A']]))).toThrow(/không khớp/);
  });
  it('ném khi còn rò Hán', () => {
    expect(() => validateTranslation(units(['a']), new Map([['a', '汉']]))).toThrow(/chữ Hán/);
  });
  it('qua khi sạch + đếm khớp', () => {
    expect(() => validateTranslation(units(['a']), new Map([['a', 'A']]))).not.toThrow();
  });
});
