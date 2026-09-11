<script lang="ts">
  import { resolve } from '$app/paths';
  import { BLOG_POSTS, BLOG_CATEGORIES } from '$lib/features/blog/blog-data';
  import type { BlogCategory } from '$lib/features/blog/types';
  import {
    Clock,
    User,
    ArrowRight,
    Sparkles,
    Compass,
    ChevronRight
  } from 'lucide-svelte';

  let selectedCategory = $state<BlogCategory['id']>('all');

  const filteredPosts = $derived(
    selectedCategory === 'all'
      ? BLOG_POSTS
      : BLOG_POSTS.filter((post) => post.category === selectedCategory)
  );

  const featuredPost = $derived(BLOG_POSTS[0]);
  const restPosts = $derived(filteredPosts.filter((p) => p.slug !== (selectedCategory === 'all' ? featuredPost?.slug : '')));
</script>

<svelte:head>
  <title>Cẩm Nang Mệnh Lý & Thuật Số Chuẩn Xác | ViOS Blog</title>
  <meta name="description" content="Khám phá kho tàng kiến thức thuật số hoàng gia: Luận giải 14 chính tinh Tử Vi, Bát Tự Tứ Trụ cân bằng Dụng Thần, Kinh Dịch Lục Hào chiêm bốc, và Nhân Tướng Học AI." />
  <link rel="canonical" href="https://tuvitoantap.vercel.app/blog" />
  
  <meta property="og:type" content="blog" />
  <meta property="og:url" content="https://tuvitoantap.vercel.app/blog" />
  <meta property="og:title" content="Cẩm Nang Mệnh Lý & Thuật Số Chuẩn Xác | ViOS Blog" />
  <meta property="og:description" content="Khám phá kho tàng kiến thức thuật số hoàng gia: Luận giải 14 chính tinh Tử Vi, Bát Tự Tứ Trụ, Kinh Dịch Lục Hào, Nhân Tướng Học AI." />
  <meta property="og:image" content="https://tuvitoantap.vercel.app/og-image.png" />
  
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Cẩm Nang Mệnh Lý & Thuật Số Chuẩn Xác | ViOS Blog" />
  <meta name="twitter:description" content="Khám phá kho tàng kiến thức thuật số hoàng gia: Luận giải 14 chính tinh Tử Vi, Bát Tự Tứ Trụ, Kinh Dịch Lục Hào, Nhân Tướng Học AI." />
  <meta name="twitter:image" content="https://tuvitoantap.vercel.app/og-image.png" />

  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
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
        }
      ]
    }
  </script>
</svelte:head>

<div class="blog-hub-page">
  <div class="blog-container">
    <!-- Breadcrumbs -->
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <a href={resolve('/')} class="bc-link">Trang Chủ</a>
      <ChevronRight size={14} class="bc-sep" />
      <span class="bc-current">Cẩm Nang Mệnh Lý</span>
    </nav>

    <!-- Header Banner -->
    <header class="blog-header">
      <div class="eyebrow-pill">
        <Sparkles size={14} class="text-gold" />
        <span>KHO TRI THỨC THUẬT SỐ HOÀNG GIA</span>
      </div>
      <h1 class="blog-main-title">Cẩm Nang Mệnh Lý & Tinh Hoa Học Thuật</h1>
      <p class="blog-main-sub">
        Tổng hợp những nghiên cứu sâu sắc về Tử Vi Đẩu Số, Bát Tự Tứ Trụ, Kinh Dịch Lục Hào và Nhân Tướng Học do hội đồng học thuật ViOS biên soạn chuẩn theo cổ thư chính tông.
      </p>
    </header>

    <!-- Category Selector Tabs -->
    <div class="category-tabs-bar">
      {#each BLOG_CATEGORIES as cat (cat.id)}
        <button
          type="button"
          class="cat-tab-btn {selectedCategory === cat.id ? 'active' : ''}"
          onclick={() => { selectedCategory = cat.id; }}
        >
          {cat.label}
        </button>
      {/each}
    </div>

    <!-- Featured Post (Chỉ hiện khi xem Tất Cả) -->
    {#if selectedCategory === 'all' && featuredPost}
      <article class="featured-post-card">
        <div class="featured-content">
          <div class="featured-meta">
            <span class="tag-badge badge-gold">{featuredPost.categoryLabel}</span>
            <span class="read-meta"><Clock size={13} /> {featuredPost.readTime}</span>
            <span class="read-meta"><User size={13} /> {featuredPost.author.name}</span>
          </div>
          <h2 class="featured-title">
            <a href={resolve(`/blog/${featuredPost.slug}` as any)}>
              {featuredPost.title}
            </a>
          </h2>
          <p class="featured-summary">{featuredPost.summary}</p>
          <div class="featured-footer">
            <a href={resolve(`/blog/${featuredPost.slug}` as any)} class="btn-read-featured">
              <span>Đọc Bài Viết Chi Tiết</span>
              <ArrowRight size={16} />
            </a>
            <span class="featured-offer-pill">
              <Sparkles size={13} /> {featuredPost.cta.badge}
            </span>
          </div>
        </div>
      </article>
    {/if}

    <!-- Posts Grid -->
    <section class="posts-grid-section">
      <h2 class="section-title">
        {selectedCategory === 'all' ? 'Bài Viết Mới Nhất' : BLOG_CATEGORIES.find(c => c.id === selectedCategory)?.label}
      </h2>

      <div class="posts-grid">
        {#each (selectedCategory === 'all' ? restPosts : filteredPosts) as post (post.slug)}
          <article class="post-card">
            <div class="post-card-top">
              <span class="post-category-tag">{post.categoryLabel}</span>
              <span class="post-read-time"><Clock size={12} /> {post.readTime}</span>
            </div>
            
            <h3 class="post-title">
              <a href={resolve(`/blog/${post.slug}` as any)}>{post.title}</a>
            </h3>

            <p class="post-summary">{post.summary}</p>

            <div class="post-footer">
              <div class="post-author-box">
                <small class="author-name">{post.author.name}</small>
                <small class="post-date">{post.publishedAt}</small>
              </div>
              <a href={resolve(`/blog/${post.slug}` as any)} class="read-link">
                <span>Đọc ngay</span>
                <ChevronRight size={14} />
              </a>
            </div>
          </article>
        {/each}
      </div>
    </section>

    <!-- Bottom Conversion Banner -->
    <section class="blog-bottom-funnel">
      <div class="funnel-icon-box">
        <Compass size={32} class="text-gold" />
      </div>
      <div class="funnel-text">
        <h3>Bạn Đã Sẵn Sàng Khám Phá Lá Số Cuộc Đời Mình?</h3>
        <p>Hệ thống an sao chuẩn xác theo thiên văn lịch pháp cổ truyền, tự động lập 12 cung bản vị và đại hạn 10 năm chỉ trong 30 giây.</p>
      </div>
      <a href={resolve('/charts')} class="btn-funnel-cta">
        <Sparkles size={16} />
        <span>Lập Lá Số Tử Vi Miễn Phí 100%</span>
      </a>
    </section>
  </div>
</div>

<style>
  .blog-hub-page {
    min-height: 100vh;
    padding: 32px 16px 80px;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .blog-container {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 32px;
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
    transition: color 0.2s ease;
  }

  .bc-link:hover {
    color: var(--celestial-gold-text);
  }

  .bc-current {
    color: var(--color-text-primary);
    font-weight: 600;
  }

  .blog-header {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .eyebrow-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.3);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: var(--celestial-gold-text);
  }

  .blog-main-title {
    font-size: clamp(26px, 4vw, 36px);
    font-weight: 850;
    margin: 0;
    line-height: 1.25;
    background: linear-gradient(135deg, #ffffff 30%, #e2d9bc 70%, #d4af37 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  :global([data-theme="light"]) .blog-main-title {
    background: linear-gradient(135deg, #111827 0%, #4b5563 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .blog-main-sub {
    font-size: 15px;
    color: var(--color-text-secondary);
    max-width: 780px;
    margin: 0;
    line-height: 1.6;
  }

  .category-tabs-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }

  .cat-tab-btn {
    padding: 8px 16px;
    border-radius: var(--radius-pill);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  :global([data-theme="light"]) .cat-tab-btn {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #4b5563;
  }

  .cat-tab-btn:hover {
    color: var(--color-text-primary);
    border-color: rgba(212, 175, 55, 0.4);
  }

  .cat-tab-btn.active {
    background: rgba(212, 175, 55, 0.2);
    border-color: rgba(255, 215, 0, 0.6);
    color: var(--celestial-gold-text);
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.2);
  }

  :global([data-theme="light"]) .cat-tab-btn.active {
    background: #fef3c7;
    border-color: #f59e0b;
    color: #b45309;
  }

  /* Featured Post Card */
  .featured-post-card {
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, rgba(30, 20, 55, 0.8) 0%, rgba(18, 14, 30, 0.95) 100%);
    border: 1px solid rgba(212, 175, 55, 0.35);
    padding: 32px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
    position: relative;
    overflow: hidden;
  }

  :global([data-theme="light"]) .featured-post-card {
    background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
    border-color: rgba(180, 83, 9, 0.3);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .featured-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .featured-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .tag-badge {
    font-size: 11px;
    font-weight: 800;
    padding: 3px 9px;
    border-radius: var(--radius-pill);
    text-transform: uppercase;
  }

  .tag-badge.badge-gold {
    background: rgba(245, 158, 11, 0.16);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.4);
  }

  :global([data-theme="light"]) .tag-badge.badge-gold {
    background: #fef3c7;
    color: #b45309;
    border-color: #f59e0b;
  }

  .read-meta {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .featured-title {
    font-size: clamp(20px, 3vw, 26px);
    font-weight: 850;
    margin: 0;
    line-height: 1.35;
  }

  .featured-title a {
    color: var(--color-text-primary);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .featured-title a:hover {
    color: var(--celestial-gold-text);
  }

  .featured-summary {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0;
    max-width: 880px;
  }

  .featured-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    padding-top: 12px;
    border-top: 1px solid rgba(212, 175, 55, 0.15);
  }

  .btn-read-featured {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, #d4af37 0%, #aa8010 100%);
    color: #0b0914;
    font-size: 14px;
    font-weight: 800;
    text-decoration: none;
    transition: all 0.2s ease;
    box-shadow: 0 4px 16px rgba(212, 175, 55, 0.35);
  }

  .btn-read-featured:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
  }

  .featured-offer-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 800;
    color: #10b981;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 4px 10px;
    border-radius: var(--radius-pill);
  }

  /* Grid Section */
  .posts-grid-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .section-title {
    font-size: 20px;
    font-weight: 800;
    margin: 0;
  }

  .posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .post-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 22px;
    border-radius: var(--radius-md);
    background: rgba(26, 20, 48, 0.5);
    border: 1px solid rgba(212, 175, 55, 0.15);
    transition: all 0.2s ease;
  }

  :global([data-theme="light"]) .post-card {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.15);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .post-card:hover {
    background: rgba(36, 28, 64, 0.7);
    border-color: rgba(255, 215, 0, 0.35);
    transform: translateY(-3px);
  }

  :global([data-theme="light"]) .post-card:hover {
    background: #faf8f5;
    border-color: rgba(180, 83, 9, 0.35);
  }

  .post-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .post-category-tag {
    font-size: 11px;
    font-weight: 750;
    color: var(--celestial-gold-text);
    background: rgba(212, 175, 55, 0.1);
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    border: 1px solid rgba(212, 175, 55, 0.25);
  }

  :global([data-theme="light"]) .post-category-tag {
    color: #b45309;
    background: #fef3c7;
    border-color: #fcd34d;
  }

  .post-read-time {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .post-title {
    font-size: 17px;
    font-weight: 800;
    line-height: 1.4;
    margin: 0 0 10px;
  }

  .post-title a {
    color: var(--color-text-primary);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .post-title a:hover {
    color: var(--celestial-gold-text);
  }

  .post-summary {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.55;
    margin: 0 0 16px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .post-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  :global([data-theme="light"]) .post-footer {
    border-top-color: #f3f4f6;
  }

  .post-author-box {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .author-name {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .post-date {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .read-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 750;
    color: var(--celestial-gold-text);
    text-decoration: none;
    transition: transform 0.2s ease;
  }

  .read-link:hover {
    transform: translateX(3px);
  }

  :global([data-theme="light"]) .read-link {
    color: #b45309;
  }

  /* Bottom Funnel Banner */
  .blog-bottom-funnel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 24px;
    padding: 28px 32px;
    border-radius: var(--radius-lg);
    background: radial-gradient(ellipse at center, rgba(45, 27, 78, 0.8) 0%, rgba(13, 11, 20, 0.95) 100%);
    border: 1px solid rgba(212, 175, 55, 0.35);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  }

  :global([data-theme="light"]) .blog-bottom-funnel {
    background: #fffdfa;
    border-color: rgba(180, 83, 9, 0.3);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  }

  .funnel-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #fbbf24;
  }

  .funnel-text {
    flex: 1;
    min-width: 260px;
  }

  .funnel-text h3 {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 850;
  }

  .funnel-text p {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .btn-funnel-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #ffffff;
    font-size: 14px;
    font-weight: 850;
    text-decoration: none;
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
    transition: all 0.2s ease;
  }

  .btn-funnel-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
  }
</style>
