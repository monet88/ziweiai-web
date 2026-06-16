// Hình học bàn vuông thuần (US-011): điểm neo hướng tâm + tập đoạn thẳng đường nối. Test phủ:
// ô góc lấy góc trong, ô cạnh lấy trung điểm cạnh trong, và buildAspectLines nối từ 1 ô tới
// nhiều ô đích.
import { describe, expect, it } from 'vitest';
import { getAnchorPoint, buildAspectLines } from './palace-board-geometry';

describe('getAnchorPoint', () => {
  it('ô góc trên-trái → góc trong (phải-dưới của ô)', () => {
    // col 0 → cạnh phải = (0+1)*25 - 1 = 24; row 0 → cạnh dưới = (0+1)*25 - 1 = 24.
    expect(getAnchorPoint({ row: 0, col: 0 })).toEqual({ x: 24, y: 24 });
  });

  it('ô góc dưới-phải → góc trong (trái-trên của ô)', () => {
    // col 3 → cạnh trái = 3*25 + 1 = 76; row 3 → cạnh trên = 3*25 + 1 = 76.
    expect(getAnchorPoint({ row: 3, col: 3 })).toEqual({ x: 76, y: 76 });
  });

  it('ô cạnh trên (không góc) → trung điểm cạnh dưới của ô', () => {
    // col 1 → tâm X = (1+0.5)*25 = 37.5; row 0 → cạnh dưới = 24.
    expect(getAnchorPoint({ row: 0, col: 1 })).toEqual({ x: 37.5, y: 24 });
  });

  it('ô cạnh trái (không góc) → trung điểm cạnh phải của ô', () => {
    // col 0 → cạnh phải = 24; row 1 → tâm Y = (1+0.5)*25 = 37.5.
    expect(getAnchorPoint({ row: 1, col: 0 })).toEqual({ x: 24, y: 37.5 });
  });

  it('ô cạnh phải (không góc) → trung điểm cạnh trái của ô', () => {
    expect(getAnchorPoint({ row: 2, col: 3 })).toEqual({ x: 76, y: 62.5 });
  });
});

describe('buildAspectLines', () => {
  it('nối từ ô nguồn tới từng ô đích (thứ tự giữ nguyên)', () => {
    const from = { row: 3, col: 1 }; // góc? không — row 3 + col 1 là cạnh dưới → trung điểm cạnh trên
    const lines = buildAspectLines(from, [
      { row: 0, col: 1 },
      { row: 1, col: 3 },
    ]);

    // from: cạnh dưới (row 3) → { x: 37.5, y: 76 }
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ x1: 37.5, y1: 76, x2: 37.5, y2: 24 });
    expect(lines[1]).toEqual({ x1: 37.5, y1: 76, x2: 76, y2: 37.5 });
  });

  it('không ô đích → mảng rỗng', () => {
    expect(buildAspectLines({ row: 0, col: 0 }, [])).toEqual([]);
  });
});
