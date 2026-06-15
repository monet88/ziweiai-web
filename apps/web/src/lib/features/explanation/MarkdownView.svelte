<script lang="ts">
  // MarkdownView: render markdown luận giải AI bằng element Svelte THƯỜNG (h2/h3/p/li +
  // <strong> cho span đậm). KHÔNG dùng chỉ thị render-HTML-thô — span text nội suy qua
  // {span.text} nên Svelte tự escape, chặn XSS từ nội dung do model sinh (bất biến bảo mật US-006).
  //
  // Parser thuần `parseMarkdownBlocks` (US-003) đã giới hạn cú pháp: heading 1-3, đoạn
  // văn, list-item, in đậm inline. Mọi cú pháp lạ giữ nguyên thành text → không mất nội dung.
  import { parseMarkdownBlocks, type MarkdownBlock } from './markdown-blocks';

  interface Props {
    markdown: string;
  }

  let { markdown }: Props = $props();

  const blocks = $derived<MarkdownBlock[]>(parseMarkdownBlocks(markdown));
</script>

<div class="markdown">
  {#each blocks as block, index (index)}
    {#if block.type === 'heading' && block.level === 1}
      <h2 class="heading h1">
        {#each block.spans as span, spanIndex (spanIndex)}
          {#if span.bold}<strong>{span.text}</strong>{:else}{span.text}{/if}
        {/each}
      </h2>
    {:else if block.type === 'heading' && block.level === 2}
      <h3 class="heading h2">
        {#each block.spans as span, spanIndex (spanIndex)}
          {#if span.bold}<strong>{span.text}</strong>{:else}{span.text}{/if}
        {/each}
      </h3>
    {:else if block.type === 'heading'}
      <h4 class="heading h3">
        {#each block.spans as span, spanIndex (spanIndex)}
          {#if span.bold}<strong>{span.text}</strong>{:else}{span.text}{/if}
        {/each}
      </h4>
    {:else if block.type === 'list-item'}
      <p class="list-item">
        <span class="bullet" aria-hidden="true">•</span>
        <span>
          {#each block.spans as span, spanIndex (spanIndex)}
            {#if span.bold}<strong>{span.text}</strong>{:else}{span.text}{/if}
          {/each}
        </span>
      </p>
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
  .markdown {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .heading {
    margin: 0;
    color: var(--color-text-primary);
    font-weight: 600;
    line-height: 1.3;
  }

  .heading.h1 {
    font-size: 19px;
    margin-top: var(--space-sm);
  }

  .heading.h2 {
    font-size: 16px;
    margin-top: var(--space-xs);
  }

  .heading.h3 {
    font-size: 15px;
  }

  .paragraph {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 15px;
    line-height: 1.6;
  }

  .list-item {
    display: flex;
    gap: var(--space-xs);
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 15px;
    line-height: 1.6;
  }

  .bullet {
    color: var(--color-accent-gold);
    flex-shrink: 0;
  }

  strong {
    color: var(--color-text-primary);
    font-weight: 700;
  }
</style>
