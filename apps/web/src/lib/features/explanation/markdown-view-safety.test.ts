// US-006 acceptance: MarkdownView KHÔNG render {@html} thô (chặn XSS từ nội dung AI sinh).
// Test đọc source component để chứng minh không có chỉ thị {@html} — mọi text nội suy qua
// {span.text} nên Svelte tự escape. Bổ sung: nội dung có ký tự HTML hiểm vẫn được parser
// giữ thành text thường (không sinh block thực thi được).
import { describe, expect, it } from 'vitest';
// Vite ?raw: nạp source MarkdownView như chuỗi (không phụ thuộc scheme file:// như
// fileURLToPath, vốn lỗi dưới vitest browser-conditions). Đọc source để chứng minh tĩnh.
import markdownViewSource from './MarkdownView.svelte?raw';
import { parseMarkdownBlocks } from './markdown-blocks';

describe('MarkdownView (an toàn XSS)', () => {
  it('KHÔNG dùng {@html} thô trong template', () => {
    // Không được có chỉ thị {@html ...} — mọi text nội suy qua {span.text} (Svelte tự escape).
    expect(markdownViewSource.includes('{@html')).toBe(false);
  });

  it('parser giữ HTML hiểm thành text thường (span.text), không tạo cấu trúc thực thi', () => {
    const blocks = parseMarkdownBlocks('<img src=x onerror=alert(1)> và **đậm**');
    // Toàn bộ thẻ img nằm trong text span (sẽ được Svelte escape khi render).
    const flatText = blocks
      .flatMap((block) => ('spans' in block ? block.spans : []))
      .map((span) => span.text)
      .join('');
    expect(flatText).toContain('<img src=x onerror=alert(1)>');
    // Có nhận diện được phần **đậm** thành span bold (parser vẫn hoạt động bình thường).
    const hasBold = blocks
      .flatMap((block) => ('spans' in block ? block.spans : []))
      .some((span) => span.bold && span.text === 'đậm');
    expect(hasBold).toBe(true);
  });
});
