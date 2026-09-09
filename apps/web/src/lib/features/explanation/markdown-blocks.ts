// Parser markdown -> blocks cho phần luận giải AI.
//
// AI luận giải chỉ sinh ra một tập cú pháp hẹp (xem explanation-system-prompt.ts):
//   - Tiêu đề ATX: "## Tóm lại", "### ..." (1-3 dấu #)
//   - Đoạn văn thường
//   - Danh sách gạch đầu dòng: "- ..." hoặc "* ..."
//   - In đậm inline: **...**
// Không có bảng, ảnh, code block, link, blockquote, danh sách lồng nhau.
//
// Tách parser (thuần, test được) khỏi render (Svelte) để kiểm thử không cần DOM.
// Mọi cú pháp không nhận diện được giữ nguyên thành text thường → không bao giờ mất nội dung.

export type InlineSpan = {
  text: string;
  bold: boolean;
};

export type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3; spans: InlineSpan[] }
  | { type: 'paragraph'; spans: InlineSpan[] }
  | { type: 'list-item'; spans: InlineSpan[] }
  | { type: 'blockquote'; spans: InlineSpan[] }
  | { type: 'divider' }
  | { type: 'table'; headers: InlineSpan[][]; rows: InlineSpan[][][] };

const HEADING_PATTERN = /^(#{1,3})\s+(.*)$/;
const LIST_ITEM_PATTERN = /^[-*]\s+(.*)$/;
const BLOCKQUOTE_PATTERN = /^>\s*(.*)$/;
const DIVIDER_PATTERN = /^(\*{3,}|-{3,}|_{3,})$/;
const TABLE_ROW_PATTERN = /^\|(.+)\|$/;
const TABLE_DELIMITER_PATTERN = /^\|?(\s*:?-+:?\s*\|?)+$/;

// Tách inline **đậm** thành các span. Cặp ** không đóng được coi là text thường (giữ nguyên ký tự).
export function parseInlineSpans(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const open = text.indexOf('**', cursor);
    if (open === -1) {
      pushSpan(spans, text.slice(cursor), false);
      break;
    }

    const close = text.indexOf('**', open + 2);
    if (close === -1) {
      // Không có cặp đóng → phần còn lại là text thường (kể cả ** lẻ).
      pushSpan(spans, text.slice(cursor), false);
      break;
    }

    pushSpan(spans, text.slice(cursor, open), false);
    pushSpan(spans, text.slice(open + 2, close), true);
    cursor = close + 2;
  }

  // Đảm bảo block rỗng vẫn có ít nhất một span rỗng để render đồng nhất.
  return spans.length > 0 ? spans : [{ text: '', bold: false }];
}

function pushSpan(spans: InlineSpan[], text: string, bold: boolean): void {
  if (text.length === 0) {
    return;
  }
  spans.push({ text, bold });
}

function parseTableCells(rowText: string): string[] {
  let content = rowText.trim();
  if (content.startsWith('|')) content = content.slice(1);
  if (content.endsWith('|')) content = content.slice(0, -1);
  return content.split('|').map((cell) => cell.trim());
}

// Chuyển markdown thô thành mảng block để render tuần tự.
// Dòng trống chỉ dùng để ngắt block; nhiều dòng văn liền nhau gộp thành một đoạn.
export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  // Guard phòng thủ: nếu markdown bị truyền null/undefined/non-string (lỗi API hoặc state),
  // trả mảng rỗng thay vì để .replace ném runtime crash.
  if (typeof markdown !== 'string' || markdown.length === 0) {
    return [];
  }

  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let paragraphBuffer: string[] = [];

  const flushParagraph = (): void => {
    if (paragraphBuffer.length === 0) {
      return;
    }
    const text = paragraphBuffer.join(' ').trim();
    paragraphBuffer = [];
    if (text.length > 0) {
      blocks.push({ type: 'paragraph', spans: parseInlineSpans(text) });
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.length === 0) {
      flushParagraph();
      i++;
      continue;
    }

    // Divider check (--- hoặc ***)
    if (DIVIDER_PATTERN.test(line)) {
      flushParagraph();
      blocks.push({ type: 'divider' });
      i++;
      continue;
    }

    // Heading check (#, ##, ###)
    const headingMatch = HEADING_PATTERN.exec(line);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push({ type: 'heading', level, spans: parseInlineSpans(headingMatch[2].trim()) });
      i++;
      continue;
    }

    // Blockquote check (> ...)
    const blockquoteMatch = BLOCKQUOTE_PATTERN.exec(line);
    if (blockquoteMatch) {
      flushParagraph();
      const quoteSpans = parseInlineSpans(blockquoteMatch[1].trim());
      blocks.push({ type: 'blockquote', spans: quoteSpans });
      i++;
      continue;
    }

    // List item check (- ... hoặc * ...)
    const listMatch = LIST_ITEM_PATTERN.exec(line);
    if (listMatch) {
      flushParagraph();
      blocks.push({ type: 'list-item', spans: parseInlineSpans(listMatch[1].trim()) });
      i++;
      continue;
    }

    // Table check: line có định dạng | col1 | col2 | và line tiếp theo là delimiter |---|---|
    if (TABLE_ROW_PATTERN.test(line) && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (TABLE_ROW_PATTERN.test(nextLine) && TABLE_DELIMITER_PATTERN.test(nextLine)) {
        flushParagraph();
        const headerCells = parseTableCells(line);
        const headers = headerCells.map((c) => parseInlineSpans(c));
        const rows: InlineSpan[][][] = [];

        i += 2; // bỏ qua header và delimiter
        while (i < lines.length && TABLE_ROW_PATTERN.test(lines[i].trim())) {
          const rowCells = parseTableCells(lines[i].trim());
          rows.push(rowCells.map((c) => parseInlineSpans(c)));
          i++;
        }

        blocks.push({ type: 'table', headers, rows });
        continue;
      }
    }

    paragraphBuffer.push(line);
    i++;
  }

  flushParagraph();
  return blocks;
}
