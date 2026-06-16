// Hình học thuần cho lớp SVG đường nối tam phương tứ chính trên bàn vuông 4×4 (US-011).
// Toạ độ trong viewBox 0–100 (preserveAspectRatio="none" → khớp lưới CSS co giãn). Đây là
// lớp TRÌNH BÀY thuần: KHÔNG import core/astro-engine, chỉ tính từ vị trí ô (row/col).
//
// Port `getAnchorPoint` của taibu (ZiweiChartGrid.tsx): mỗi ô neo điểm về phía tâm bàn để
// đường nối ôm sát cạnh trong thay vì cắt ngang nội dung ô. 12 cung nằm trên viền (trung
// cung 2×2 ở giữa dành cho tóm tắt) nên ô luôn thuộc hàng/cột biên.

/** Ô trên lưới 4×4, 0-indexed (row/col 0..3). row 0 = trên, row 3 = dưới. */
export interface GridCell {
  row: number;
  col: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface AspectLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Mỗi ô chiếm 25% bề rộng/cao bàn; lùi 1 đơn vị khỏi viền để đường không dính mép ô.
const CELL_SIZE = 25;
const EDGE_PADDING = 1;

/**
 * Điểm neo của một ô viền, hướng về tâm bàn: ô góc → góc trong gần tâm; ô cạnh → trung điểm
 * cạnh trong. Ô không thuộc viền (về lý thuyết không xảy ra với 12 cung) → tâm ô.
 */
export function getAnchorPoint(cell: GridCell): Point {
  const isTop = cell.row === 0;
  const isBottom = cell.row === 3;
  const isLeft = cell.col === 0;
  const isRight = cell.col === 3;
  const centerX = (cell.col + 0.5) * CELL_SIZE;
  const centerY = (cell.row + 0.5) * CELL_SIZE;

  // Ô góc: lấy góc trong (gần tâm bàn nhất).
  if ((isTop || isBottom) && (isLeft || isRight)) {
    const x = isLeft ? (cell.col + 1) * CELL_SIZE - EDGE_PADDING : cell.col * CELL_SIZE + EDGE_PADDING;
    const y = isTop ? (cell.row + 1) * CELL_SIZE - EDGE_PADDING : cell.row * CELL_SIZE + EDGE_PADDING;
    return { x, y };
  }

  // Ô cạnh: trung điểm cạnh trong.
  if (isTop) return { x: centerX, y: (cell.row + 1) * CELL_SIZE - EDGE_PADDING };
  if (isBottom) return { x: centerX, y: cell.row * CELL_SIZE + EDGE_PADDING };
  if (isLeft) return { x: (cell.col + 1) * CELL_SIZE - EDGE_PADDING, y: centerY };
  if (isRight) return { x: cell.col * CELL_SIZE + EDGE_PADDING, y: centerY };

  return { x: centerX, y: centerY };
}

/**
 * Tập đoạn thẳng nối từ ô cung đang hiệu lực tới từng ô tam phương tứ chính. Caller đã loại
 * chính cung khỏi `toCells` (không tự nối vào mình).
 */
export function buildAspectLines(fromCell: GridCell, toCells: GridCell[]): AspectLine[] {
  const from = getAnchorPoint(fromCell);
  return toCells.map((cell) => {
    const to = getAnchorPoint(cell);
    return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
  });
}
