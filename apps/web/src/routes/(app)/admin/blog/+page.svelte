<script lang="ts">
  import { resolve } from '$app/paths';
  import { BLOG_POSTS, BLOG_CATEGORIES } from '$lib/features/blog/blog-data';
  import type { BlogPost } from '$lib/features/blog/types';
  import {
    BookOpen,
    Sparkles,
    ExternalLink,
    CheckCircle2,
    Clock,
    FileText,
    HelpCircle,
    Layers,
    Search,
    Share2,
    TrendingUp
  } from 'lucide-svelte';

  const posts: readonly BlogPost[] = BLOG_POSTS;
  let searchQuery = $state('');
  let selectedCategory = $state('all');

  const filteredPosts = $derived(
    posts.filter((p: BlogPost) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.keywords.some((k: string) => k.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    })
  );

  const totalFaqs = posts.reduce((acc: number, p: BlogPost) => acc + p.faqs.length, 0);
  const totalKeywords = new Set(posts.flatMap((p: BlogPost) => p.keywords)).size;
</script>

<svelte:head>
  <title>Quản Trị Cẩm Nang Mệnh Lý - ViOS Admin</title>
</svelte:head>

<div class="admin-blog-page">
  <!-- Stats Top Row -->
  <div class="stats-overview-grid">
    <div class="stat-card">
      <div class="stat-icon-wrap icon-gold">
        <BookOpen size={20} />
      </div>
      <div>
        <div class="stat-num">{posts.length}</div>
        <div class="stat-title">Tổng Bài Viết Cẩm Nang</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrap icon-purple">
        <Layers size={20} />
      </div>
      <div>
        <div class="stat-num">{BLOG_CATEGORIES.length}</div>
        <div class="stat-title">Chuyên Mục Mệnh Lý</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrap icon-emerald">
        <HelpCircle size={20} />
      </div>
      <div>
        <div class="stat-num">{totalFaqs}</div>
        <div class="stat-title">Câu Hỏi FAQ Chuẩn Schema</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrap icon-blue">
        <TrendingUp size={20} />
      </div>
      <div>
        <div class="stat-num">{totalKeywords}</div>
        <div class="stat-title">Từ Khóa SEO Mục Tiêu</div>
      </div>
    </div>
  </div>

  <!-- Filter & Search Bar -->
  <div class="blog-filter-bar">
    <div class="search-input-wrap">
      <Search size={15} class="search-icon" />
      <input
        type="text"
        class="search-input"
        placeholder="Tìm bài viết theo tiêu đề, slug, từ khóa..."
        bind:value={searchQuery}
      />
    </div>

    <div class="category-filter-group">
      <button
        class="cat-filter-btn {selectedCategory === 'all' ? 'active' : ''}"
        onclick={() => (selectedCategory = 'all')}
      >
        Tất cả ({posts.length})
      </button>
      {#each BLOG_CATEGORIES as cat}
        <button
          class="cat-filter-btn {selectedCategory === cat.id ? 'active' : ''}"
          onclick={() => (selectedCategory = cat.id)}
        >
          {cat.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Blog Posts Table -->
  <div class="data-table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Bài Viết & Chuyên Mục</th>
          <th>Slug URL</th>
          <th>Tác Giả & Ngày</th>
          <th>Cấu Trúc SEO</th>
          <th>Funnel Chuyển Đổi</th>
          <th class="align-right">Thao Tác</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredPosts as post (post.slug)}
          <tr class="data-row">
            <td class="article-cell">
              <span class="category-tag">{post.categoryLabel}</span>
              <h4 class="post-table-title">{post.title}</h4>
              <small class="post-table-sub">{post.subtitle}</small>
            </td>
            <td>
              <code class="slug-code">/blog/{post.slug}</code>
            </td>
            <td>
              <div class="author-cell">
                <strong>{post.author.name}</strong>
                <small><Clock size={11} /> {post.readTime} • {post.publishedAt}</small>
              </div>
            </td>
            <td>
              <div class="seo-badges">
                <span class="seo-pill pill-green" title="Schema Article + FAQPage">
                  <CheckCircle2 size={12} />
                  <span>Schema.org OK</span>
                </span>
                <span class="seo-pill pill-gold">
                  <span>{post.faqs.length} FAQs</span>
                </span>
              </div>
            </td>
            <td>
              <div class="cta-preview">
                <span class="cta-badge">{post.cta.badge}</span>
                <span class="cta-label">{post.cta.actionLabel}</span>
              </div>
            </td>
            <td class="align-right">
              <a
                href={resolve(`/blog/${post.slug}` as any)}
                target="_blank"
                rel="noreferrer"
                class="btn-preview-link"
                title="Xem trực tiếp trên web"
              >
                <span>Xem trước</span>
                <ExternalLink size={13} />
              </a>
            </td>
          </tr>
        {/each}
        {#if filteredPosts.length === 0}
          <tr>
            <td colspan="6" class="empty-cell">Không tìm thấy bài viết cẩm nang phù hợp.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <!-- Editorial Guidelines Card -->
  <div class="guideline-card">
    <div class="guideline-header">
      <Sparkles size={18} class="text-gold" />
      <h3>Đặc Tả Kiến Trúc & Biên Tập Cẩm Nang Mệnh Lý</h3>
    </div>
    <div class="guideline-grid">
      <div class="guide-item">
        <strong>1. Tối Ưu Tốc Độ Tuyệt Đối (SSG):</strong>
        <p>Tất cả bài cẩm nang được biên soạn code-first tại <code>blog-data.ts</code> để Vercel Edge Server render tức thì (0ms database query, tải &lt; 50ms), giúp Googlebot index dễ dàng.</p>
      </div>
      <div class="guide-item">
        <strong>2. Schema.org Tự Động:</strong>
        <p>Mỗi bài tự động sinh thẻ <code>Article</code>, <code>BreadcrumbList</code> và <code>FAQPage</code> để giành Rich Snippets hiển thị sao đánh giá và câu hỏi trên Google Search.</p>
      </div>
      <div class="guide-item">
        <strong>3. Phễu Chuyển Đổi In-Article (CTA Funnel):</strong>
        <p>Mỗi bài tích hợp 1 thẻ Conversion Card điều hướng người đọc sang lập lá số Tử Vi, gieo quẻ Kinh Dịch hoặc Bát Tự, giúp tăng tỷ lệ tạo tài khoản tự nhiên.</p>
      </div>
    </div>
  </div>
</div>

<style>
  .admin-blog-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  .stats-overview-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: var(--space-md);
  }

  @media (min-width: 640px) {
    .stats-overview-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .stats-overview-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 20px;
    border-radius: var(--radius-lg);
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--overlay-border);
    box-shadow: var(--shadow-card);
  }

  .stat-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-gold {
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.35);
    color: var(--celestial-gold-icon);
  }

  .icon-purple {
    background: rgba(139, 92, 246, 0.12);
    border: 1px solid rgba(139, 92, 246, 0.35);
    color: #a78bfa;
  }

  .icon-emerald {
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.35);
    color: #34d399;
  }

  .icon-blue {
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.35);
    color: #60a5fa;
  }

  .stat-num {
    font-size: 24px;
    font-weight: 850;
    color: var(--color-text-primary);
    line-height: 1.2;
  }

  .stat-title {
    font-size: 12px;
    color: var(--color-text-secondary);
    font-weight: 600;
  }

  /* Filter Bar */
  .blog-filter-bar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: var(--radius-lg);
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    border: 1px solid var(--overlay-border);
  }

  @media (min-width: 768px) {
    .blog-filter-bar {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .search-input-wrap {
    position: relative;
    flex: 1;
    max-width: 420px;
  }

  .search-input-wrap :global(.search-icon) {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-muted);
  }

  .search-input {
    width: 100%;
    padding: 8px 12px 8px 36px;
    border-radius: var(--radius-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--overlay-border-strong);
    color: var(--color-text-primary);
    font-size: 13px;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--celestial-gold-border);
  }

  .category-filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .cat-filter-btn {
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 700;
    border: 1px solid var(--overlay-border);
    background: rgba(255, 255, 255, 0.04);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cat-filter-btn:hover {
    background: rgba(212, 175, 55, 0.1);
    color: var(--celestial-gold-text);
  }

  .cat-filter-btn.active {
    background: rgba(212, 175, 55, 0.15);
    border-color: rgba(212, 175, 55, 0.4);
    color: var(--celestial-gold-text);
  }

  /* Table */
  .data-table-container {
    overflow-x: auto;
    border-radius: var(--radius-lg);
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    border: 1px solid var(--overlay-border);
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .data-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 11px;
    font-weight: 750;
    text-transform: uppercase;
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--overlay-border);
    background: rgba(0, 0, 0, 0.15);
  }

  :global([data-theme="light"]) .data-table th {
    background: #f9fafb;
  }

  .data-row td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--overlay-border);
    vertical-align: middle;
  }

  .category-tag {
    display: inline-block;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(212, 175, 55, 0.12);
    color: var(--celestial-gold-text);
    border: 1px solid rgba(212, 175, 55, 0.25);
    margin-bottom: 4px;
  }

  .post-table-title {
    font-size: 14px;
    font-weight: 750;
    color: var(--color-text-primary);
    margin: 0 0 2px 0;
  }

  .post-table-sub {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .slug-code {
    font-family: monospace;
    font-size: 12px;
    color: var(--color-text-secondary);
    background: rgba(255, 255, 255, 0.05);
    padding: 3px 6px;
    border-radius: 4px;
  }

  .author-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .author-cell small {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--color-text-muted);
    font-size: 11px;
  }

  .seo-badges {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .seo-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 10px;
    width: fit-content;
  }

  .pill-green {
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  .pill-gold {
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.25);
    color: var(--celestial-gold-text);
  }

  .cta-preview {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .cta-badge {
    font-size: 10px;
    font-weight: 800;
    color: #a78bfa;
    text-transform: uppercase;
  }

  .cta-label {
    font-size: 11px;
    color: var(--color-text-secondary);
  }

  .btn-preview-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: var(--celestial-gold-text);
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .btn-preview-link:hover {
    background: rgba(212, 175, 55, 0.25);
    transform: translateY(-1px);
  }

  .empty-cell {
    text-align: center;
    padding: 32px;
    color: var(--color-text-muted);
  }

  .align-right {
    text-align: right;
  }

  /* Guideline Card */
  .guideline-card {
    padding: 24px;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
    border: 1px solid rgba(212, 175, 55, 0.25);
  }

  .guideline-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .guideline-header h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
    color: var(--color-text-primary);
  }

  .guideline-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 16px;
  }

  @media (min-width: 768px) {
    .guideline-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .guide-item strong {
    display: block;
    font-size: 13px;
    color: var(--celestial-gold-text);
    margin-bottom: 4px;
  }

  .guide-item p {
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .guide-item code {
    background: rgba(255, 255, 255, 0.08);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 11px;
  }
</style>
