// US-031 (backlog #25): hình học thuần cho lớp phủ đường nét bàn tay (Xem Tay). Tách riêng khỏi
// MediaPipe để test được mà không cần model/wasm — chỉ nhận toạ độ landmark đã chuẩn hoá [0..1].
//
// Ảnh preview render bằng object-fit: contain nên ảnh thật bị "letterbox" trong khung hiển thị.
// Các hàm dưới đây quy đổi toạ độ chuẩn hoá -> pixel trong khung, có tính phần đệm letterbox.

/** Landmark chuẩn hoá [0..1] theo chiều rộng/cao ảnh gốc (z không dùng để vẽ 2D). */
export interface NormalizedLandmark {
  readonly x: number;
  readonly y: number;
  readonly z?: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

/** Vùng ảnh thật được vẽ bên trong khung hiển thị khi dùng object-fit: contain. */
export interface ContainLayout {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly renderedWidth: number;
  readonly renderedHeight: number;
  readonly scale: number;
}

export interface OverlayPoint {
  readonly x: number;
  readonly y: number;
}

export interface OverlaySegment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/**
 * Bộ cạnh nối 21 landmark bàn tay theo chuẩn MediaPipe HandLandmarker (HAND_CONNECTIONS).
 * Mỗi cặp là chỉ số landmark đầu - cuối của một đoạn xương ngón/lòng bàn tay.
 */
export const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

/**
 * Tính vùng ảnh thật (letterbox) khi ảnh kích thước `natural` được vẽ vừa khung `container` theo
 * object-fit: contain. Khung/ảnh kích thước <= 0 trả layout rỗng (scale 0) để caller bỏ qua an toàn.
 */
export function computeContainLayout(natural: Size, container: Size): ContainLayout {
  const empty: ContainLayout = {
    offsetX: 0,
    offsetY: 0,
    renderedWidth: 0,
    renderedHeight: 0,
    scale: 0,
  };
  if (
    natural.width <= 0 ||
    natural.height <= 0 ||
    container.width <= 0 ||
    container.height <= 0
  ) {
    return empty;
  }

  const scale = Math.min(container.width / natural.width, container.height / natural.height);
  const renderedWidth = natural.width * scale;
  const renderedHeight = natural.height * scale;
  return {
    scale,
    renderedWidth,
    renderedHeight,
    offsetX: (container.width - renderedWidth) / 2,
    offsetY: (container.height - renderedHeight) / 2,
  };
}

/** Quy đổi landmark chuẩn hoá -> điểm pixel trong khung hiển thị, theo layout contain. */
export function projectLandmarks(
  landmarks: readonly NormalizedLandmark[],
  layout: ContainLayout,
): OverlayPoint[] {
  return landmarks.map((landmark) => ({
    x: layout.offsetX + landmark.x * layout.renderedWidth,
    y: layout.offsetY + landmark.y * layout.renderedHeight,
  }));
}

/**
 * Dựng các đoạn thẳng nối từ danh sách điểm đã chiếu, theo bộ cạnh nối. Bỏ qua cặp tham chiếu
 * chỉ số nằm ngoài mảng điểm (phòng landmark thiếu) để không vẽ đoạn rác.
 */
export function buildOverlaySegments(
  points: readonly OverlayPoint[],
  connections: ReadonlyArray<readonly [number, number]> = HAND_CONNECTIONS,
): OverlaySegment[] {
  const segments: OverlaySegment[] = [];
  for (const [start, end] of connections) {
    const from = points[start];
    const to = points[end];
    if (!from || !to) continue;
    segments.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
  }
  return segments;
}
