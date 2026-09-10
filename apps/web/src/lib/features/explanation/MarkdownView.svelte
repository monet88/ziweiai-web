<script lang="ts">
  // MarkdownView: render markdown luận giải AI bằng element Svelte THƯỜNG (h2/h3/p/li/blockquote/table +
  // <strong> cho span đậm). KHÔNG dùng chỉ thị render-HTML-thô — span text nội suy qua
  // {span.text} nên Svelte tự escape, chặn XSS từ nội dung do model sinh (bất biến bảo mật US-006).
  import { parseMarkdownBlocks, type MarkdownBlock } from './markdown-blocks';
  import { Sparkles, Quote, Compass } from 'lucide-svelte';

  interface Props {
    markdown: string;
  }

  let { markdown }: Props = $props();

  const blocks = $derived<MarkdownBlock[]>(parseMarkdownBlocks(markdown));
</script>

<div class="celestial-markdown">
  {#each blocks as block, index (index)}
    {#if block.type === 'heading' && block.level === 1}
      <h2 class="heading h1">
        <span class="heading-icon"><Compass size={18} /></span>
        <span class="heading-text">
          {#each block.spans as span, spanIndex (spanIndex)}
            {#if span.bold}<strong>{span.text}</strong>{:else}{span.text}{/if}
          {/each}
        </span>
      </h2>
    {:else if block.type === 'heading' && block.level === 2}
      <h3 class="heading h2">
        <span class="heading-ornament">✦</span>
        <span class="heading-text">
          {#each block.spans as span, spanIndex (spanIndex)}
            {#if span.bold}<strong>{span.text}</strong>{:else}{span.text}{/if}
          {/each}
        </span>
      </h3>
    {:else if block.type === 'heading'}
      <h4 class="heading h3">
        <span class="heading-ornament">✧</span>
        <span class="heading-text">
          {#each block.spans as span, spanIndex (spanIndex)}
            {#if span.bold}<strong>{span.text}</strong>{:else}{span.text}{/if}
          {/each}
        </span>
      </h4>
    {:else if block.type === 'blockquote'}
      <div class="celestial-quote">
        <div class="quote-icon"><Quote size={18} /></div>
        <div class="quote-content">
          {#each block.spans as span, spanIndex (spanIndex)}
            {#if span.bold}<strong>{span.text}</strong>{:else}{span.text}{/if}
          {/each}
        </div>
      </div>
    {:else if block.type === 'divider'}
      <div class="celestial-divider">
        <div class="divider-line"></div>
        <span class="divider-star">✦ ☯ ✦</span>
        <div class="divider-line"></div>
      </div>
    {:else if block.type === 'table'}
      <div class="table-wrapper">
        <table class="celestial-table">
          {#if block.headers.length > 0}
            <thead>
              <tr>
                {#each block.headers as headerCell, hIdx (hIdx)}
                  <th>
                    {#each headerCell as span, spanIndex (spanIndex)}
                      {#if span.bold}<strong>{span.text}</strong>{:else}{span.text}{/if}
                    {/each}
                  </th>
                {/each}
              </tr>
            </thead>
          {/if}
          <tbody>
            {#each block.rows as row, rIdx (rIdx)}
              <tr>
                {#each row as cell, cIdx (cIdx)}
                  <td>
                    {#each cell as span, spanIndex (spanIndex)}
                      {#if span.bold}<strong>{span.text}</strong>{:else}{span.text}{/if}
                    {/each}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else if block.type === 'list-item'}
      <div class="list-item">
        <span class="bullet" aria-hidden="true">
          <Sparkles size={13} />
        </span>
        <div class="list-content">
          {#each block.spans as span, spanIndex (spanIndex)}
            {#if span.bold}<strong>{span.text}</strong>{:else}{span.text}{/if}
          {/each}
        </div>
      </div>
    {:else}
      <p class="paragraph">
        {#each block.spans as span, spanIndex (spanIndex)}
          {#if span.bold}<strong>{span.text}</strong>{:else}{span.text}{/if}
        {/each}
      </p>
    {/if}
  {/each}
</div>

<style>
  .celestial-markdown {
    display: flex;
    flex-direction: column;
    gap: 16px;
    line-height: 1.75;
    font-size: 15.5px;
    color: var(--color-text-secondary, #d1d5db);
    letter-spacing: 0.01em;
  }

  .heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 12px 0 4px 0;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: #f7eed8;
  }

  .heading.h1 {
    font-size: 20px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.25);
    background: linear-gradient(135deg, #fef3c7 0%, #f59e0b 60%, #d97706 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .heading.h2 {
    font-size: 17.5px;
    color: #fef08a;
  }

  .heading.h3 {
    font-size: 16px;
    color: #fde047;
  }

  .heading-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fbbf24;
    filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.4));
  }

  .heading-ornament {
    color: #d97706;
    font-size: 14px;
  }

  .paragraph {
    margin: 0;
    line-height: 1.8;
  }

  .list-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 2px 0;
    line-height: 1.7;
  }

  .bullet {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fbbf24;
    margin-top: 5px;
    flex-shrink: 0;
  }

  .list-content {
    flex: 1;
  }

  /* Blockquote Hoàng Gia */
  .celestial-quote {
    display: flex;
    gap: 12px;
    padding: 14px 18px;
    background: rgba(16, 12, 34, 0.65);
    border-left: 3px solid #d4af37;
    border-radius: 4px 12px 12px 4px;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25), inset 0 0 12px rgba(212, 175, 55, 0.05);
    margin: 6px 0;
  }

  .quote-icon {
    color: #fbbf24;
    opacity: 0.8;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .quote-content {
    font-style: italic;
    color: #fef3c7;
    line-height: 1.7;
  }

  /* Divider Thiên Cơ */
  .celestial-divider {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 16px 0;
    opacity: 0.7;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4), transparent);
  }

  .divider-star {
    font-size: 13px;
    color: #fbbf24;
    letter-spacing: 4px;
    text-shadow: 0 0 8px rgba(251, 191, 36, 0.5);
  }

  /* Table Hoàng Gia */
  .table-wrapper {
    overflow-x: auto;
    margin: 12px 0;
    border-radius: 12px;
    border: 1px solid rgba(212, 175, 55, 0.25);
    background: rgba(14, 10, 28, 0.6);
  }

  .celestial-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14.5px;
    text-align: left;
  }

  .celestial-table th {
    background: rgba(212, 175, 55, 0.12);
    color: #fef08a;
    font-weight: 700;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    white-space: nowrap;
  }

  .celestial-table td {
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    color: #e5e7eb;
  }

  .celestial-table tr:last-child td {
    border-bottom: none;
  }

  .celestial-table tr:hover td {
    background: rgba(212, 175, 55, 0.04);
  }

  strong {
    color: #fde047;
    font-weight: 700;
    text-shadow: 0 0 1px rgba(253, 224, 71, 0.2);
  }

  /* Dual Theme: Light Mode Support */
  :global([data-theme="light"]) .celestial-markdown {
    color: #374151;
  }

  :global([data-theme="light"]) .heading {
    color: #78350f;
  }

  :global([data-theme="light"]) .heading.h1 {
    border-bottom-color: rgba(180, 83, 9, 0.25);
    background: linear-gradient(135deg, #78350f 0%, #b45309 60%, #92400e 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  :global([data-theme="light"]) .heading.h2 {
    color: #92400e;
  }

  :global([data-theme="light"]) .heading.h3 {
    color: #b45309;
  }

  :global([data-theme="light"]) .heading-icon,
  :global([data-theme="light"]) .bullet,
  :global([data-theme="light"]) .quote-icon,
  :global([data-theme="light"]) .divider-star {
    color: #b45309;
  }

  :global([data-theme="light"]) .celestial-quote {
    background: rgba(254, 243, 199, 0.4);
    border-left-color: #b45309;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  :global([data-theme="light"]) .quote-content {
    color: #78350f;
  }

  :global([data-theme="light"]) .table-wrapper {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.2);
  }

  :global([data-theme="light"]) .celestial-table th {
    background: #fef3c7;
    color: #78350f;
    border-bottom-color: rgba(180, 83, 9, 0.15);
  }

  :global([data-theme="light"]) .celestial-table td {
    color: #1f2937;
    border-bottom-color: #f3f4f6;
  }

  :global([data-theme="light"]) .celestial-table tr:hover td {
    background: #fffbeb;
  }

  :global([data-theme="light"]) strong {
    color: #92400e;
    text-shadow: none;
  }

  /* =========================================================================
     PRINT STYLES (@media print) - Chuẩn Mực Văn Bản Giấy A4
     ========================================================================= */
  @media print {
    .celestial-markdown {
      color: #111827 !important;
      font-size: 11pt !important;
      line-height: 1.7 !important;
      gap: 12px !important;
    }

    .paragraph {
      color: #1f2937 !important;
      margin-bottom: 8px !important;
      orphans: 3;
      widows: 3;
    }

    .heading {
      page-break-after: avoid !important;
      break-after: avoid !important;
      margin-top: 14pt !important;
      margin-bottom: 6pt !important;
    }

    .heading.h1 {
      font-size: 15pt !important;
      color: #78350f !important;
      background: none !important;
      -webkit-background-clip: initial !important;
      background-clip: initial !important;
      -webkit-text-fill-color: initial !important;
      border-bottom: 1.5pt solid #b45309 !important;
      padding-bottom: 4pt !important;
    }

    .heading.h2 {
      font-size: 13pt !important;
      color: #92400e !important;
    }

    .heading.h3 {
      font-size: 11.5pt !important;
      color: #b45309 !important;
    }

    .heading-icon,
    .heading-ornament,
    .bullet,
    .quote-icon,
    .divider-star {
      color: #b45309 !important;
    }

    .celestial-quote {
      background: #fefce8 !important;
      border-left: 3pt solid #b45309 !important;
      box-shadow: none !important;
      padding: 8pt 12pt !important;
      margin: 10pt 0 !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .quote-content {
      color: #78350f !important;
      font-style: italic !important;
    }

    .table-wrapper {
      background: #ffffff !important;
      border: 1px solid #d1d5db !important;
      box-shadow: none !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .celestial-table th {
      background: #fef3c7 !important;
      color: #78350f !important;
      border-bottom: 1.5pt solid #d1d5db !important;
      font-weight: 700 !important;
    }

    .celestial-table td {
      color: #111827 !important;
      border-bottom: 1px solid #e5e7eb !important;
    }

    .list-item {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      color: #1f2937 !important;
    }

    strong {
      color: #92400e !important;
      font-weight: 700 !important;
    }
  }
</style>

