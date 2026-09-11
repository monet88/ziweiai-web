<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { getBlogPostBySlug, getRelatedPosts } from '$lib/features/blog/blog-data';
  import {
    Clock,
    User,
    Calendar,
    ChevronRight,
    Sparkles,
    Compass,
    Share2,
    CheckCircle2,
    HelpCircle,
    ArrowLeft,
    BookOpen
  } from 'lucide-svelte';

  const slug = $derived(page.params.slug);
  const post = $derived(getBlogPostBySlug(slug));
  const relatedPosts = $derived(post ? getRelatedPosts(post.slug, 3) : []);

  let copied = $state(false);

  function handleShare(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(window.location.href);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2500);
    }
  }
</script>

<svelte:head>
  <title>{post ? `${post.title} | ViOS Mệnh Lý` : 'Bài Viết Mệnh Lý | ViOS'}</title>
  <meta name="description" content={post ? post.summary : 'Khám phá tri thức mệnh lý và thuật số hoàng gia cùng ViOS.'} />
  {#if post}
    <meta name="keywords" content={post.keywords.join(', ')} />
    <link rel="canonical" href={`https://tuvitoantap.vercel.app/blog/${post.slug}`} />

    <!-- Open Graph -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content={`https://tuvitoantap.vercel.app/blog/${post.slug}`} />
    <meta property="og:title" content={`${post.title} | ViOS`} />
    <meta property="og:description" content={post.summary} />
    <meta property="og:image" content="https://tuvitoantap.vercel.app/og-image.png" />
    <meta property="article:published_time" content={post.publishedAt} />
    <meta property="article:author" content={post.author.name} />
    <meta property="article:section" content={post.categoryLabel} />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={`${post.title} | ViOS`} />
    <meta name="twitter:description" content={post.summary} />
    <meta name="twitter:image" content="https://tuvitoantap.vercel.app/og-image.png" />

    <!-- Schema.org Article & FAQPage JSON-LD -->
    {@html `
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Article",
            "headline": "${post.title}",
            "description": "${post.summary}",
            "datePublished": "${post.publishedAt}",
            "author": {
              "@type": "Person",
              "name": "${post.author.name}"
            },
            "publisher": {
              "@type": "Organization",
              "name": "ViOS — Tử Vi Toàn Tập",
              "logo": {
                "@type": "ImageObject",
                "url": "https://tuvitoantap.vercel.app/icon-192.svg"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://tuvitoantap.vercel.app/blog/${post.slug}"
            },
            "image": "https://tuvitoantap.vercel.app/og-image.png"
          },
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Trang Chủ",
                "item": "https://tuvitoantap.vercel.app/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Cẩm Nang Mệnh Lý",
                "item": "https://tuvitoantap.vercel.app/blog"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "${post.title}",
                "item": "https://tuvitoantap.vercel.app/blog/${post.slug}"
              }
            ]
          }
          ${post.faqs.length > 0 ? `,
          {
            "@type": "FAQPage",
            "mainEntity": [
              ${post.faqs.map(faq => `{
                "@type": "Question",
                "name": ${JSON.stringify(faq.question)},
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": ${JSON.stringify(faq.answer)}
                }
              }`).join(',')}
            ]
          }` : ''}
        ]
      }
    </script>
    `}
  {/if}
</svelte:head>

{#if !post}
  <div class="blog-not-found">
    <h2>Bài Viết Không Tồn Tại</h2>
    <p>Nội dung bạn đang tìm kiếm có thể đã được chuyển dời hoặc không tồn tại trong thư viện.</p>
    <a href={resolve('/blog')} class="btn-back">
      <ArrowLeft size={16} />
      <span>Trở Về Cẩm Nang Mệnh Lý</span>
    </a>
  </div>
{:else}
  <article class="blog-detail-page">
    <div class="article-container">
      <!-- Breadcrumbs -->
      <nav class="breadcrumb-nav" aria-label="Breadcrumb">
        <a href={resolve('/')} class="bc-link">Trang Chủ</a>
        <ChevronRight size={13} class="bc-sep" />
        <a href={resolve('/blog')} class="bc-link">Cẩm Nang</a>
        <ChevronRight size={13} class="bc-sep" />
        <span class="bc-current">{post.categoryLabel}</span>
      </nav>

      <!-- Post Header -->
      <header class="article-header">
        <div class="header-badge-row">
          <span class="cat-pill">{post.categoryLabel}</span>
          <span class="meta-item"><Calendar size={13} /> {post.publishedAt}</span>
          <span class="meta-item"><Clock size={13} /> {post.readTime}</span>
        </div>

        <h1 class="article-title">{post.title}</h1>
        <p class="article-subtitle">{post.subtitle}</p>

        <div class="author-share-bar">
          <div class="author-info">
            <div class="author-avatar-badge">
              <User size={16} />
            </div>
            <div>
              <span class="author-name">{post.author.name}</span>
              <small class="author-role">{post.author.role}</small>
            </div>
          </div>

          <button type="button" class="btn-share" onclick={handleShare}>
            <Share2 size={15} />
            <span>{copied ? 'Đã Sao Chép Link!' : 'Chia Sẻ Bài Viết'}</span>
          </button>
        </div>
      </header>

      <!-- Table of Contents -->
      {#if post.tableOfContents && post.tableOfContents.length > 0}
        <aside class="toc-box">
          <div class="toc-header">
            <BookOpen size={16} class="text-gold" />
            <strong>Mục Lục Bài Viết</strong>
          </div>
          <ul class="toc-list">
            {#each post.tableOfContents as item}
              <li>
                <a href={`#${item.id}`}>{item.title}</a>
              </li>
            {/each}
          </ul>
        </aside>
      {/if}

      <!-- Main Content HTML -->
      <div class="article-body">
        {@html post.contentHtml}
      </div>

      <!-- In-Article Conversion Funnel Card -->
      <section class="article-conversion-card">
        <div class="card-accent-badge">
          <Sparkles size={14} />
          <span>{post.cta.badge}</span>
        </div>
        <div class="card-body-content">
          <h3 class="conversion-card-title">{post.cta.title}</h3>
          <p class="conversion-card-desc">{post.cta.desc}</p>
        </div>
        <a href={resolve(post.cta.actionRoute as any)} class="btn-conversion-action">
          <span>{post.cta.actionLabel}</span>
          <ChevronRight size={16} />
        </a>
      </section>

      <!-- FAQs Section -->
      {#if post.faqs && post.faqs.length > 0}
        <section class="faqs-section" id="hoi-dap-faq">
          <h2 class="faq-title">
            <HelpCircle size={22} class="text-gold" />
            <span>Câu Hỏi Thường Gặp</span>
          </h2>
          <div class="faq-list">
            {#each post.faqs as faq}
              <div class="faq-item">
                <h3 class="faq-q">
                  <CheckCircle2 size={16} class="text-emerald" />
                  <span>{faq.question}</span>
                </h3>
                <p class="faq-a">{faq.answer}</p>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Keywords / Tags -->
      <div class="tags-row">
        {#each post.keywords as kw}
          <span class="kw-tag">#{kw}</span>
        {/each}
      </div>

      <!-- Related Posts -->
      {#if relatedPosts.length > 0}
        <section class="related-section">
          <h2 class="related-title">Bài Viết Cùng Chủ Đề</h2>
          <div class="related-grid">
            {#each relatedPosts as rel (rel.slug)}
              <a href={resolve(`/blog/${rel.slug}` as any)} class="rel-card">
                <span class="rel-cat">{rel.categoryLabel}</span>
                <h4 class="rel-name">{rel.title}</h4>
                <small class="rel-time"><Clock size={12} /> {rel.readTime}</small>
              </a>
            {/each}
          </div>
        </section>
      {/if}
    </div>
  </article>
{/if}

<style>
  .blog-detail-page {
    min-height: 100vh;
    padding: 32px 16px 80px;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .article-container {
    max-width: 820px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .blog-not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
    gap: 16px;
    padding: 32px;
  }

  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: var(--radius-md);
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.4);
    color: var(--celestial-gold-text);
    text-decoration: none;
    font-weight: 750;
  }

  .breadcrumb-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .bc-link {
    color: var(--color-text-muted);
    text-decoration: none;
  }

  .bc-link:hover {
    color: var(--celestial-gold-text);
  }

  .bc-current {
    color: var(--color-text-primary);
    font-weight: 600;
  }

  /* Header */
  .article-header {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.15);
  }

  .header-badge-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .cat-pill {
    font-size: 11px;
    font-weight: 800;
    color: var(--celestial-gold-text);
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.35);
    padding: 3px 10px;
    border-radius: var(--radius-pill);
    text-transform: uppercase;
  }

  :global([data-theme="light"]) .cat-pill {
    background: #fef3c7;
    color: #b45309;
    border-color: #fcd34d;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .article-title {
    font-size: clamp(24px, 4vw, 34px);
    font-weight: 850;
    line-height: 1.3;
    margin: 0;
    color: var(--color-text-primary);
  }

  .article-subtitle {
    font-size: 16px;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  .author-share-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    padding-top: 10px;
  }

  .author-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .author-avatar-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.35);
    color: var(--celestial-gold-icon);
  }

  .author-name {
    display: block;
    font-size: 13px;
    font-weight: 750;
    color: var(--color-text-primary);
  }

  .author-role {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .btn-share {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: var(--radius-pill);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--color-text-primary);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  :global([data-theme="light"]) .btn-share {
    background: #f3f4f6;
    border-color: #e5e7eb;
  }

  .btn-share:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: rgba(212, 175, 55, 0.35);
    color: var(--celestial-gold-text);
  }

  /* Table of Contents */
  .toc-box {
    padding: 18px 22px;
    border-radius: var(--radius-md);
    background: rgba(26, 20, 48, 0.5);
    border: 1px solid rgba(212, 175, 55, 0.2);
  }

  :global([data-theme="light"]) .toc-box {
    background: #faf8f5;
    border-color: rgba(180, 83, 9, 0.2);
  }

  .toc-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    margin-bottom: 12px;
  }

  .toc-list {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .toc-list li a {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 13px;
    transition: color 0.2s ease;
  }

  .toc-list li a:hover {
    color: var(--celestial-gold-text);
    text-decoration: underline;
  }

  /* Body Typography */
  .article-body {
    font-size: 16px;
    line-height: 1.8;
    color: var(--color-text-secondary);
  }

  .article-body :global(h2) {
    font-size: 22px;
    font-weight: 850;
    color: var(--color-text-primary);
    margin: 36px 0 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.15);
  }

  .article-body :global(p) {
    margin: 0 0 16px;
  }

  .article-body :global(strong) {
    color: var(--color-text-primary);
  }

  .article-body :global(ul),
  .article-body :global(ol) {
    margin: 0 0 20px;
    padding-left: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .article-body :global(li) {
    line-height: 1.65;
  }

  /* In-Article Conversion Card */
  .article-conversion-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 28px;
    border-radius: var(--radius-lg);
    background: radial-gradient(ellipse at center, rgba(40, 24, 68, 0.9) 0%, rgba(16, 12, 28, 0.95) 100%);
    border: 1px solid rgba(212, 175, 55, 0.35);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    position: relative;
    margin: 20px 0;
  }

  :global([data-theme="light"]) .article-conversion-card {
    background: linear-gradient(135deg, #ffffff 0%, #faf6ee 100%);
    border-color: rgba(180, 83, 9, 0.3);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  }

  .card-accent-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    background: rgba(16, 185, 129, 0.16);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #10b981;
    font-size: 11px;
    font-weight: 850;
    letter-spacing: 0.04em;
  }

  :global([data-theme="light"]) .card-accent-badge {
    background: #ecfdf5;
    color: #047857;
  }

  .conversion-card-title {
    font-size: 20px;
    font-weight: 850;
    margin: 0 0 6px;
    color: var(--color-text-primary);
  }

  .conversion-card-desc {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  .btn-conversion-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    align-self: flex-start;
    padding: 12px 24px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, #d4af37 0%, #aa8010 100%);
    color: #0b0914;
    font-size: 14px;
    font-weight: 850;
    text-decoration: none;
    box-shadow: 0 4px 16px rgba(212, 175, 55, 0.35);
    transition: all 0.2s ease;
  }

  .btn-conversion-action:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 22px rgba(212, 175, 55, 0.5);
  }

  /* FAQs */
  .faqs-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 10px;
  }

  .faq-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 850;
    margin: 0;
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .faq-item {
    padding: 18px 20px;
    border-radius: var(--radius-md);
    background: rgba(26, 20, 48, 0.45);
    border: 1px solid rgba(212, 175, 55, 0.15);
  }

  :global([data-theme="light"]) .faq-item {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.15);
  }

  .faq-q {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 800;
    margin: 0 0 8px;
    color: var(--color-text-primary);
  }

  .faq-a {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  /* Tags */
  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 16px 0;
    border-top: 1px solid rgba(212, 175, 55, 0.12);
  }

  .kw-tag {
    font-size: 12px;
    color: var(--color-text-muted);
    background: rgba(255, 255, 255, 0.04);
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  :global([data-theme="light"]) .kw-tag {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #6b7280;
  }

  /* Related Section */
  .related-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 10px;
  }

  .related-title {
    font-size: 18px;
    font-weight: 800;
    margin: 0;
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
  }

  .rel-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
    padding: 16px;
    border-radius: var(--radius-md);
    background: rgba(26, 20, 48, 0.45);
    border: 1px solid rgba(212, 175, 55, 0.15);
    text-decoration: none;
    transition: all 0.2s ease;
  }

  :global([data-theme="light"]) .rel-card {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.15);
  }

  .rel-card:hover {
    background: rgba(36, 28, 64, 0.6);
    border-color: rgba(255, 215, 0, 0.35);
    transform: translateY(-2px);
  }

  :global([data-theme="light"]) .rel-card:hover {
    background: #faf8f5;
  }

  .rel-cat {
    font-size: 11px;
    font-weight: 750;
    color: var(--celestial-gold-text);
  }

  :global([data-theme="light"]) .rel-cat {
    color: #b45309;
  }

  .rel-name {
    font-size: 14px;
    font-weight: 750;
    color: var(--color-text-primary);
    margin: 0;
    line-height: 1.4;
  }

  .rel-time {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--color-text-muted);
  }
</style>
