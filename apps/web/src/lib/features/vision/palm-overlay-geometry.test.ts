// US-031 (backlog #25): test hình học thuần lớp phủ Xem Tay. Không cần MediaPipe — feed landmark
// chuẩn hoá [0..1] trực tiếp, kiểm chứng phép quy đổi letterbox (object-fit: contain).
import { describe, expect, it } from 'vitest';
import {
  HAND_CONNECTIONS,
  buildOverlaySegments,
  computeContainLayout,
  projectLandmarks,
  type NormalizedLandmark,
} from './palm-overlay-geometry';

describe('computeContainLayout', () => {
  it('letterbox theo chiều dọc khi ảnh rộng hơn khung', () => {
    // Ảnh 200x100 (tỉ lệ 2:1) trong khung 200x200 -> scale 1, đệm dọc 50 trên/dưới.
    const layout = computeContainLayout({ width: 200, height: 100 }, { width: 200, height: 200 });
    expect(layout.scale).toBe(1);
    expect(layout.renderedWidth).toBe(200);
    expect(layout.renderedHeight).toBe(100);
    expect(layout.offsetX).toBe(0);
    expect(layout.offsetY).toBe(50);
  });

  it('letterbox theo chiều ngang khi ảnh cao hơn khung', () => {
    // Ảnh 100x200 trong khung 200x200 -> scale 1, đệm ngang 50 trái/phải.
    const layout = computeContainLayout({ width: 100, height: 200 }, { width: 200, height: 200 });
    expect(layout.scale).toBe(1);
    expect(layout.offsetX).toBe(50);
    expect(layout.offsetY).toBe(0);
  });

  it('thu nhỏ ảnh lớn để vừa khung và giữ tỉ lệ', () => {
    const layout = computeContainLayout({ width: 400, height: 400 }, { width: 200, height: 100 });
    expect(layout.scale).toBe(0.25);
    expect(layout.renderedWidth).toBe(100);
    expect(layout.renderedHeight).toBe(100);
    expect(layout.offsetX).toBe(50);
    expect(layout.offsetY).toBe(0);
  });

  it('trả layout rỗng (scale 0) khi kích thước không hợp lệ', () => {
    expect(computeContainLayout({ width: 0, height: 100 }, { width: 200, height: 200 }).scale).toBe(0);
    expect(computeContainLayout({ width: 100, height: 100 }, { width: 0, height: 200 }).scale).toBe(0);
  });
});

describe('projectLandmarks', () => {
  it('quy đổi toạ độ chuẩn hoá sang pixel trong khung kèm đệm letterbox', () => {
    const layout = computeContainLayout({ width: 200, height: 100 }, { width: 200, height: 200 });
    const landmarks: NormalizedLandmark[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 0.5, y: 0.5 },
    ];
    const points = projectLandmarks(landmarks, layout);
    expect(points[0]).toEqual({ x: 0, y: 50 });
    expect(points[1]).toEqual({ x: 200, y: 150 });
    expect(points[2]).toEqual({ x: 100, y: 100 });
  });
});

describe('buildOverlaySegments', () => {
  it('dựng đoạn nối theo bộ cạnh và bỏ qua chỉ số ngoài mảng điểm', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    const segments = buildOverlaySegments(points, [
      [0, 1],
      [1, 2],
      [2, 99], // chỉ số 99 không tồn tại -> bỏ qua
    ]);
    expect(segments).toEqual([
      { x1: 0, y1: 0, x2: 10, y2: 0 },
      { x1: 10, y1: 0, x2: 10, y2: 10 },
    ]);
  });

  it('bộ cạnh mặc định HAND_CONNECTIONS phủ đủ 21 landmark', () => {
    // 21 điểm trùng gốc: mỗi cạnh tạo đúng một đoạn, không rơi cạnh nào.
    const points = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));
    expect(buildOverlaySegments(points)).toHaveLength(HAND_CONNECTIONS.length);
  });
});
