<script lang="ts">
  /* eslint-disable svelte/no-at-html-tags */
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { getBlogPostBySlug, getRelatedPosts } from '$lib/features/blog/blog-data';
  import {
    Clock,
    User,
    Calendar,
    ChevronRight,
    Sparkles,
    Share2,
    CheckCircle2,
    HelpCircle,
    ArrowLeft,
    BookOpen,
    Copy,
    Check
  } from 'lucide-svelte';

  const slug = $derived(page.params.slug);
  const post = $derived(getBlogPostBySlug(slug));
  const relatedPosts = $derived(post ? getRelatedPosts(post.slug, 3) : []);

  let copied = $state(false);

  function getShareUrl(): string {
    if (typeof window !== 'undefined' && window.location?.href) {
      return window.location.href;
    }
    return `https://tuvitoantap.vercel.app/blog/${slug}`;
  }

  function shareFacebook(): void {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer,width=620,height=580');
  }

  function shareZalo(): void {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://sp.zalo.me/share_inline?link=${url}`, '_blank', 'noopener,noreferrer,width=620,height=580');
  }

  function shareTwitter(): void {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(post?.title ? `${post.title} — Tử Vi Toàn Tập ViOS` : 'ViOS Mệnh Lý');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer,width=620,height=580');
  }

  function shareTelegram(): void {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(post?.title || 'ViOS Mệnh Lý');
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer,width=620,height=580');
  }

  async function shareNative(): Promise<void> {
    if (typeof navigator !== 'undefined' && (navigator as any).share && post) {
      try {
        await (navigator as any).share({
          title: post.title,
          text: post.summary,
          url: getShareUrl(),
        });
        return;
      } catch {
        // Fallback to copy link if user cancels or error
      }
    }
    handleCopyLink();
  }

  function handleCopyLink(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(getShareUrl());
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2500);
    }
  }

  const schemaOrgJson = $derived(
    post
      ? JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Article',
              headline: post.title,
              description: post.summary,
              datePublished: post.publishedAt,
              author: {
                '@type': 'Person',
                name: post.author.name,
              },
              publisher: {
                '@type': 'Organization',
                name: 'ViOS — Tử Vi Toàn Tập',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://tuvitoantap.vercel.app/icon-192.svg',
                },
              },
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `https://tuvitoantap.vercel.app/blog/${post.slug}`,
              },
              image: 'https://tuvitoantap.vercel.app/og-image.png',
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Trang Chủ',
                  item: 'https://tuvitoantap.vercel.app/',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Cẩm Nang Mệnh Lý',
                  item: 'https://tuvitoantap.vercel.app/blog',
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: post.title,
                  item: `https://tuvitoantap.vercel.app/blog/${post.slug}`,
                },
              ],
            },
            ...(post.faqs.length > 0
              ? [
                  {
                    '@type': 'FAQPage',
                    mainEntity: post.faqs.map((faq) => ({
                      '@type': 'Question',
                      name: faq.question,
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: faq.answer,
                      },
                    })),
                  },
                ]
              : []),
          ],
        })
      : null
  );
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
    {#if schemaOrgJson}
      {@html '<' + 'script type="application/ld+json">' + schemaOrgJson + '</' + 'script>'}
    {/if}
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

          <!-- Social Share Bar Header -->
          <div class="share-actions-group">
            <span class="share-label">Chia sẻ:</span>
            <button type="button" class="btn-share-icon btn-fb" title="Chia sẻ lên Facebook" aria-label="Facebook" onclick={shareFacebook}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </button>
            <button type="button" class="btn-share-icon btn-zalo" title="Chia sẻ qua Zalo" aria-label="Zalo" onclick={shareZalo}>
              <span class="zalo-pill-icon">Zalo</span>
            </button>
            <button type="button" class="btn-share-icon btn-x" title="Chia sẻ lên X (Twitter)" aria-label="X (Twitter)" onclick={shareTwitter}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </button>
            <button type="button" class="btn-share-icon btn-tg" title="Chia sẻ qua Telegram" aria-label="Telegram" onclick={shareTelegram}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
            </button>
            <button type="button" class="btn-share-copy" title="Sao chép liên kết bài viết" onclick={handleCopyLink}>
              {#if copied}
                <Check size={14} class="text-emerald" />
                <span class="text-emerald">Đã chép!</span>
              {:else}
                <Copy size={14} />
                <span>Sao chép</span>
              {/if}
            </button>
            <button type="button" class="btn-share-native" title="Chia sẻ đa kênh trên điện thoại" onclick={shareNative}>
              <Share2 size={14} />
            </button>
          </div>
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
            {#each post.tableOfContents as item (item.id)}
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
            {#each post.faqs as faq (faq.question)}
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

      <!-- Social Viral Share Box (Cuối Bài Viết) -->
      <section class="social-share-box">
        <div class="social-share-content">
          <div class="share-box-icon">
            <Share2 size={20} class="text-gold" />
          </div>
          <div>
            <h3 class="share-box-title">Lan Tỏa Tri Thức Mệnh Lý Hoàng Gia</h3>
            <p class="share-box-desc">Nếu bài viết hữu ích, hãy chia sẻ cùng bạn bè và cộng đồng nghiên cứu mệnh lý, phong thủy.</p>
          </div>
        </div>
        <div class="share-box-buttons">
          <button type="button" class="social-btn btn-fb-pill" onclick={shareFacebook}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span>Facebook</span>
          </button>
          <button type="button" class="social-btn btn-zalo-pill" onclick={shareZalo}>
            <span class="zalo-bold">Zalo</span>
            <span>Chia Sẻ</span>
          </button>
          <button type="button" class="social-btn btn-x-pill" onclick={shareTwitter}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>Twitter / X</span>
          </button>
          <button type="button" class="social-btn btn-tg-pill" onclick={shareTelegram}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
            <span>Telegram</span>
          </button>
          <button type="button" class="social-btn btn-copy-pill" onclick={handleCopyLink}>
            {#if copied}
              <Check size={16} class="text-emerald" />
              <span class="text-emerald">Đã Sao Chép!</span>
            {:else}
              <Copy size={16} />
              <span>Sao Chép Link</span>
            {/if}
          </button>
        </div>
      </section>

      <!-- Keywords / Tags -->
      <div class="tags-row">
        {#each post.keywords as kw (kw)}
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

  /* Social Share Group (Header) */
  .share-actions-group {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .share-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-muted);
    margin-right: 2px;
  }

  .btn-share-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid var(--overlay-border);
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-share-icon:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

  .btn-fb:hover {
    background: #1877f2;
    border-color: #1877f2;
    color: #ffffff;
  }

  .btn-zalo {
    font-size: 10px;
    font-weight: 800;
  }

  .zalo-pill-icon {
    font-size: 10px;
    font-weight: 900;
    letter-spacing: -0.5px;
  }

  .btn-zalo:hover {
    background: #0068ff;
    border-color: #0068ff;
    color: #ffffff;
  }

  .btn-x:hover {
    background: #000000;
    border-color: rgba(255, 255, 255, 0.4);
    color: #ffffff;
  }

  .btn-tg:hover {
    background: #229ed9;
    border-color: #229ed9;
    color: #ffffff;
  }

  .btn-share-copy {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--overlay-border);
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-share-copy:hover {
    background: rgba(212, 175, 55, 0.12);
    border-color: rgba(212, 175, 55, 0.35);
    color: var(--celestial-gold-text);
  }

  .btn-share-native {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid rgba(212, 175, 55, 0.35);
    background: rgba(212, 175, 55, 0.1);
    color: var(--celestial-gold-text);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-share-native:hover {
    background: rgba(212, 175, 55, 0.25);
    transform: translateY(-2px);
  }

  /* Social Viral Share Box (Cuối bài) */
  .social-share-box {
    margin: 40px 0 24px;
    padding: 24px;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(106, 61, 232, 0.08) 100%);
    border: 1px solid rgba(212, 175, 55, 0.28);
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  :global([data-theme="light"]) .social-share-box {
    background: linear-gradient(135deg, #fffbeb 0%, #f5f3ff 100%);
    border-color: #fde68a;
  }

  .social-share-content {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .share-box-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.35);
    flex-shrink: 0;
  }

  .share-box-title {
    font-size: 16px;
    font-weight: 800;
    margin: 0 0 4px 0;
    color: var(--color-text-primary);
  }

  .share-box-desc {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  .share-box-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .social-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 16px;
    border-radius: var(--radius-pill);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .social-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  }

  .btn-fb-pill {
    background: #1877f2;
    color: #ffffff;
  }

  .btn-zalo-pill {
    background: #0068ff;
    color: #ffffff;
  }

  .zalo-bold {
    font-weight: 900;
    letter-spacing: -0.5px;
  }

  .btn-x-pill {
    background: #111827;
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.2);
  }

  :global([data-theme="light"]) .btn-x-pill {
    background: #1f2937;
  }

  .btn-tg-pill {
    background: #229ed9;
    color: #ffffff;
  }

  .btn-copy-pill {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--overlay-border);
    color: var(--color-text-primary);
  }

  :global([data-theme="light"]) .btn-copy-pill {
    background: #f3f4f6;
    border-color: #e5e7eb;
  }

  .btn-copy-pill:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: rgba(212, 175, 55, 0.4);
    color: var(--celestial-gold-text);
  }
</style>
