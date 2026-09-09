import { describe, expect, it } from 'vitest';
import { parseInlineSpans, parseMarkdownBlocks } from './markdown-blocks';

describe('parseInlineSpans', () => {
  it('returns a single non-bold span for plain text', () => {
    expect(parseInlineSpans('xin chào')).toEqual([{ text: 'xin chào', bold: false }]);
  });

  it('splits bold segments wrapped in **', () => {
    expect(parseInlineSpans('Cung **Mệnh** chủ về')).toEqual([
      { text: 'Cung ', bold: false },
      { text: 'Mệnh', bold: true },
      { text: ' chủ về', bold: false },
    ]);
  });

  it('handles bold at the start and end', () => {
    expect(parseInlineSpans('**Lộc** và **Quyền**')).toEqual([
      { text: 'Lộc', bold: true },
      { text: ' và ', bold: false },
      { text: 'Quyền', bold: true },
    ]);
  });

  it('treats an unclosed ** as plain text (keeps the characters)', () => {
    expect(parseInlineSpans('giá 5 ** sao')).toEqual([{ text: 'giá 5 ** sao', bold: false }]);
  });

  it('returns a single empty span for an empty string', () => {
    expect(parseInlineSpans('')).toEqual([{ text: '', bold: false }]);
  });
});

describe('parseMarkdownBlocks', () => {
  it('parses ATX headings with levels 1-3', () => {
    const blocks = parseMarkdownBlocks('# Một\n## Hai\n### Ba');
    expect(blocks).toEqual([
      { type: 'heading', level: 1, spans: [{ text: 'Một', bold: false }] },
      { type: 'heading', level: 2, spans: [{ text: 'Hai', bold: false }] },
      { type: 'heading', level: 3, spans: [{ text: 'Ba', bold: false }] },
    ]);
  });

  it('parses bullet list items with - or *', () => {
    const blocks = parseMarkdownBlocks('- một\n* hai');
    expect(blocks).toEqual([
      { type: 'list-item', spans: [{ text: 'một', bold: false }] },
      { type: 'list-item', spans: [{ text: 'hai', bold: false }] },
    ]);
  });

  it('merges consecutive text lines into a single paragraph', () => {
    const blocks = parseMarkdownBlocks('dòng một\ndòng hai');
    expect(blocks).toEqual([{ type: 'paragraph', spans: [{ text: 'dòng một dòng hai', bold: false }] }]);
  });

  it('splits paragraphs on blank lines', () => {
    const blocks = parseMarkdownBlocks('đoạn một\n\nđoạn hai');
    expect(blocks).toEqual([
      { type: 'paragraph', spans: [{ text: 'đoạn một', bold: false }] },
      { type: 'paragraph', spans: [{ text: 'đoạn hai', bold: false }] },
    ]);
  });

  it('parses inline bold inside headings and list items', () => {
    const blocks = parseMarkdownBlocks('## **Tóm lại**\n- điểm **chính**');
    expect(blocks).toEqual([
      { type: 'heading', level: 2, spans: [{ text: 'Tóm lại', bold: true }] },
      { type: 'list-item', spans: [{ text: 'điểm ', bold: false }, { text: 'chính', bold: true }] },
    ]);
  });

  it('normalizes CRLF line endings', () => {
    const blocks = parseMarkdownBlocks('## Tiêu đề\r\n\r\nnội dung');
    expect(blocks).toEqual([
      { type: 'heading', level: 2, spans: [{ text: 'Tiêu đề', bold: false }] },
      { type: 'paragraph', spans: [{ text: 'nội dung', bold: false }] },
    ]);
  });

  it('treats 4+ leading # as a paragraph, not a heading', () => {
    const blocks = parseMarkdownBlocks('#### không phải heading');
    expect(blocks).toEqual([{ type: 'paragraph', spans: [{ text: '#### không phải heading', bold: false }] }]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseMarkdownBlocks('')).toEqual([]);
    expect(parseMarkdownBlocks('   \n\n  ')).toEqual([]);
  });

  it('returns an empty array for null/undefined/non-string input (defensive guard, no crash)', () => {
    expect(parseMarkdownBlocks(null as unknown as string)).toEqual([]);
    expect(parseMarkdownBlocks(undefined as unknown as string)).toEqual([]);
    expect(parseMarkdownBlocks(123 as unknown as string)).toEqual([]);
  });

  it('parses blockquotes with >', () => {
    const blocks = parseMarkdownBlocks('> Thiên cơ **bất khả lộ**, hữu duyên tương ngộ.');
    expect(blocks).toEqual([
      {
        type: 'blockquote',
        spans: [
          { text: 'Thiên cơ ', bold: false },
          { text: 'bất khả lộ', bold: true },
          { text: ', hữu duyên tương ngộ.', bold: false },
        ],
      },
    ]);
  });

  it('parses horizontal dividers with --- or ***', () => {
    const blocks = parseMarkdownBlocks('Đoạn 1\n\n---\n\nĐoạn 2\n\n***');
    expect(blocks).toEqual([
      { type: 'paragraph', spans: [{ text: 'Đoạn 1', bold: false }] },
      { type: 'divider' },
      { type: 'paragraph', spans: [{ text: 'Đoạn 2', bold: false }] },
      { type: 'divider' },
    ]);
  });

  it('parses markdown tables with headers and rows', () => {
    const markdown = [
      '| Cung | Chính Tinh | Cát Hung |',
      '| --- | --- | --- |',
      '| Mệnh | **Tử Vi** | Đại Cát |',
      '| Thân | Thất Sát | Bình Hòa |',
    ].join('\n');

    const blocks = parseMarkdownBlocks(markdown);
    expect(blocks).toEqual([
      {
        type: 'table',
        headers: [
          [{ text: 'Cung', bold: false }],
          [{ text: 'Chính Tinh', bold: false }],
          [{ text: 'Cát Hung', bold: false }],
        ],
        rows: [
          [
            [{ text: 'Mệnh', bold: false }],
            [{ text: 'Tử Vi', bold: true }],
            [{ text: 'Đại Cát', bold: false }],
          ],
          [
            [{ text: 'Thân', bold: false }],
            [{ text: 'Thất Sát', bold: false }],
            [{ text: 'Bình Hòa', bold: false }],
          ],
        ],
      },
    ]);
  });

  it('keeps a realistic mixed document in order', () => {
    const markdown = [
      '## Tổng quan',
      '',
      'Lá số của bạn cho thấy **sự nghiệp** vững vàng.',
      '',
      '- Điểm mạnh: kiên trì',
      '- Điểm cần lưu ý: nóng vội',
      '',
      '> Lời khuyên: Tu thân tích đức.',
      '',
      '---',
      '',
      '## Tóm lại',
      'Hãy giữ nhịp ổn định.',
    ].join('\n');

    const blocks = parseMarkdownBlocks(markdown);
    expect(blocks.map((b) => b.type)).toEqual([
      'heading',
      'paragraph',
      'list-item',
      'list-item',
      'blockquote',
      'divider',
      'heading',
      'paragraph',
    ]);
  });
});

