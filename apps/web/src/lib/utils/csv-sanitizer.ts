/**
 * Utility hàm vệ sinh ô dữ liệu CSV để phòng chống lỗ hổng CSV Injection (Formula Injection).
 * Các ứng dụng bảng tính (Excel, Google Sheets) tự động thực thi công thức nếu ô bắt đầu bằng:
 * '=', '+', '-', '@', '\t', '\r'.
 *
 * Hàm này sẽ:
 * 1. Chuyển đổi null/undefined thành chuỗi rỗng.
 * 2. Thoát ký tự nháy kép `"` thành `""`.
 * 3. Thêm tiền tố nháy đơn `'` nếu ký tự đầu là ký tự điều khiển/công thức.
 * 4. Bọc toàn bộ ô trong cặp nháy kép `"{content}"`.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  const str = String(value);

  // Thoát dấu nháy kép nội bộ
  let escaped = str.replace(/"/g, '""');

  // Kiểm tra ký tự kích hoạt Formula Injection
  const firstChar = escaped.charAt(0);
  if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@' || firstChar === '\t' || firstChar === '\r') {
    escaped = `'${escaped}`;
  }

  return `"${escaped}"`;
}
