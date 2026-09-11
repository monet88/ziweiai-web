<script lang="ts">
  import { resolve } from '$app/paths';
  import { BLOG_POSTS, BLOG_CATEGORIES } from '$lib/features/blog/blog-data';
  import type { BlogPost } from '$lib/features/blog/types';
  import { toast } from '$lib/stores/toast';
  import {
    BookOpen,
    Sparkles,
    ExternalLink,
    CheckCircle2,
    Clock,
    HelpCircle,
    Layers,
    Search,
    TrendingUp,
    PlusCircle,
    Edit3,
    Trash2,
    X,
    Save
  } from 'lucide-svelte';

  let postsList = $state<BlogPost[]>([...BLOG_POSTS]);
  let searchQuery = $state('');
  let selectedCategory = $state('all');

  // Modal State
  let showModal = $state(false);
  let isEditing = $state(false);
  let editSlug = $state<string | null>(null);

  // Form Fields
  let formTitle = $state('');
  let formSubtitle = $state('');
  let formCategory = $state('tu-vi-dau-so');
  let formSlug = $state('');
  let formAuthorName = $state('ViOS Thiên Cơ Các');
  let formReadTime = $state('7 phút đọc');
  let formKeywords = $state('tử vi, số mệnh');
  let formSummary = $state('');
  let formFaqQuestion = $state('');
  let formFaqAnswer = $state('');

  const filteredPosts = $derived(
    postsList.filter((p: BlogPost) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.keywords.some((k: string) => k.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    })
  );

  const totalFaqs = $derived(postsList.reduce((acc: number, p: BlogPost) => acc + p.faqs.length, 0));
  const totalKeywords = $derived(new Set(postsList.flatMap((p: BlogPost) => p.keywords)).size);

  function openCreateModal() {
    isEditing = false;
    editSlug = null;
    formTitle = '';
    formSubtitle = '';
    formCategory = 'tu-vi';
    formSlug = '';
    formAuthorName = 'ViOS Thiên Cơ Các';
    formReadTime = '7 phút đọc';
    formKeywords = 'tử vi, phong thủy, vận mệnh';
    formSummary = '';
    formFaqQuestion = 'Lập lá số Tử Vi tại ViOS có mất phí không?';
    formFaqAnswer = 'Hoàn toàn miễn phí 100% với độ chính xác cao.';
    showModal = true;
  }

  function openEditModal(post: BlogPost) {
    isEditing = true;
    editSlug = post.slug;
    formTitle = post.title;
    formSubtitle = post.subtitle;
    formCategory = post.category;
    formSlug = post.slug;
    formAuthorName = post.author.name;
    formReadTime = post.readTime;
    formKeywords = post.keywords.join(', ');
    formSummary = post.summary;
    formFaqQuestion = post.faqs[0]?.question || '';
    formFaqAnswer = post.faqs[0]?.answer || '';
    showModal = true;
  }

  function handleDeletePost(slug: string) {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài viết "${slug}" khỏi danh sách?`)) return;
    postsList = postsList.filter((p) => p.slug !== slug);
    toast.show('Đã xóa bài viết khỏi cẩm nang!', 'info');
  }

  function handleSavePost() {
    if (!formTitle.trim() || !formSlug.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và slug URL bài viết!');
      return;
    }

    const catObj = BLOG_CATEGORIES.find((c) => c.id === formCategory);
    const categoryLabel = catObj ? catObj.label : 'Cẩm Nang';

    const keywords = formKeywords.split(',').map((k) => k.trim()).filter(Boolean);
    const faqs = formFaqQuestion.trim()
      ? [{ question: formFaqQuestion.trim(), answer: formFaqAnswer.trim() }]
      : [];

    if (isEditing && editSlug) {
      postsList = postsList.map((p) => {
        if (p.slug === editSlug) {
          return {
            ...p,
            title: formTitle.trim(),
            subtitle: formSubtitle.trim(),
            category: formCategory as any,
            categoryLabel,
            slug: formSlug.trim(),
            author: { ...p.author, name: formAuthorName.trim() },
            readTime: formReadTime.trim(),
            keywords,
            summary: formSummary.trim(),
            faqs: faqs.length > 0 ? faqs : p.faqs,
          };
        }
        return p;
      });
      toast.show(`Đã cập nhật bài viết "${formTitle}"!`, 'success');
    } else {
      const newPost: BlogPost = {
        slug: formSlug.trim().toLowerCase().replace(/\s+/g, '-'),
        title: formTitle.trim(),
        subtitle: formSubtitle.trim() || formTitle.trim(),
        category: formCategory as any,
        categoryLabel,
        publishedAt: new Date().toISOString().slice(0, 10),
        readTime: formReadTime.trim(),
        author: {
          name: formAuthorName.trim(),
          role: 'Chuyên gia Mệnh lý ViOS',
        },
        summary: formSummary.trim() || formSubtitle.trim(),
        keywords,
        tableOfContents: [
          {
            id: 'tong-quan',
            title: `Tổng Quan: ${formTitle.trim()}`,
          },
        ],
        contentHtml: `<p>${formSummary.trim() || 'Nội dung bài viết cẩm nang đang được đội ngũ chuyên gia biên soạn chi tiết.'}</p>`,
        faqs,
        cta: {
          title: 'Khám Phá Bản Mệnh Cá Nhân Cùng AI',
          desc: 'Lập lá số Tử Vi & Bát Tự trọn đời hoàn toàn miễn phí ngay hôm nay.',
          actionLabel: 'Lập Lá Số Ngay',
          actionRoute: '/charts/create',
          badge: 'Miễn phí 100%',
        },
      };

      postsList = [newPost, ...postsList];
      toast.show(`Đã thêm bài viết mới "${formTitle}"!`, 'success');
    }

    showModal = false;
  }
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
        <div class="stat-num">{postsList.length}</div>
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

  <!-- Filter & Action Bar -->
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
        Tất cả ({postsList.length})
      </button>
      {#each BLOG_CATEGORIES as cat (cat.id)}
        <button
          class="cat-filter-btn {selectedCategory === cat.id ? 'active' : ''}"
          onclick={() => (selectedCategory = cat.id)}
        >
          {cat.label}
        </button>
      {/each}
    </div>

    <button class="btn-create-post" onclick={openCreateModal}>
      <PlusCircle size={16} />
      <span>Viết Bài Mới</span>
    </button>
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
              <div class="row-actions">
                <a
                  href={resolve(`/blog/${post.slug}` as any)}
                  target="_blank"
                  rel="noreferrer"
                  class="btn-preview-link"
                  title="Xem trước bài viết trên web"
                >
                  <ExternalLink size={13} />
                  <span>Xem</span>
                </a>
                <button
                  class="btn-action-icon btn-edit"
                  onclick={() => openEditModal(post)}
                  title="Chỉnh sửa thông tin bài viết"
                >
                  <Edit3 size={13} />
                  <span>Sửa</span>
                </button>
                <button
                  class="btn-action-icon btn-delete"
                  onclick={() => handleDeletePost(post.slug)}
                  title="Xóa bài viết khỏi cẩm nang"
                >
                  <Trash2 size={13} />
                  <span>Xóa</span>
                </button>
              </div>
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

  <!-- Modal Soạn Thảo / Thêm Bài Mới -->
  {#if showModal}
    <div
      class="modal-overlay"
      onclick={() => (showModal = false)}
      onkeydown={(e) => e.key === 'Escape' && (showModal = false)}
      role="button"
      tabindex="0"
      aria-label="Đóng cửa sổ soạn thảo"
    >
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="modal-card"
        onclick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <div class="modal-header">
          <div class="modal-title-wrap">
            <Sparkles size={18} class="text-gold" />
            <h3>{isEditing ? 'Chỉnh Sửa Bài Viết Cẩm Nang' : 'Soạn Thảo Bài Viết Mới'}</h3>
          </div>
          <button class="btn-close-modal" onclick={() => (showModal = false)} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="formTitle">Tiêu Đề Bài Viết (*)</label>
              <input
                id="formTitle"
                type="text"
                class="form-input"
                bind:value={formTitle}
                placeholder="Nhập tiêu đề thu hút, chuẩn SEO..."
              />
            </div>

            <div class="form-group full-width">
              <label for="formSubtitle">Phụ Đề / Trích Ngắn</label>
              <input
                id="formSubtitle"
                type="text"
                class="form-input"
                bind:value={formSubtitle}
                placeholder="Câu tóm lược ngắn truyền cảm hứng..."
              />
            </div>

            <div class="form-group">
              <label for="formCategory">Chuyên Mục</label>
              <select id="formCategory" class="form-input" bind:value={formCategory}>
                {#each BLOG_CATEGORIES.filter((c) => c.id !== 'all') as cat (cat.id)}
                  <option value={cat.id}>{cat.label}</option>
                {/each}
              </select>
            </div>

            <div class="form-group">
              <label for="formSlug">Slug Đường Dẫn URL (*)</label>
              <input
                id="formSlug"
                type="text"
                class="form-input"
                bind:value={formSlug}
                placeholder="vd: y-nghia-14-chinh-tinh"
              />
            </div>

            <div class="form-group">
              <label for="formAuthorName">Tác Giả Biên Soạn</label>
              <input
                id="formAuthorName"
                type="text"
                class="form-input"
                bind:value={formAuthorName}
              />
            </div>

            <div class="form-group">
              <label for="formReadTime">Thời Gian Đọc</label>
              <input
                id="formReadTime"
                type="text"
                class="form-input"
                bind:value={formReadTime}
                placeholder="vd: 8 phút đọc"
              />
            </div>

            <div class="form-group full-width">
              <label for="formKeywords">Từ Khóa SEO (Phân cách bằng dấu phẩy)</label>
              <input
                id="formKeywords"
                type="text"
                class="form-input"
                bind:value={formKeywords}
                placeholder="tử vi, bát tự, phong thủy, ngũ hành"
              />
            </div>

            <div class="form-group full-width">
              <label for="formSummary">Nội Dung Mở Đầu / Tóm Tắt</label>
              <textarea
                id="formSummary"
                rows="3"
                class="form-input form-textarea"
                bind:value={formSummary}
                placeholder="Tóm tắt giá trị bài viết mang lại cho độc giả..."
              ></textarea>
            </div>

            <div class="form-group full-width faq-section">
              <div class="faq-header-tag">
                <HelpCircle size={14} class="text-emerald" />
                <span>Câu Hỏi FAQ (Google FAQ Schema)</span>
              </div>
              <input
                type="text"
                class="form-input"
                bind:value={formFaqQuestion}
                placeholder="Câu hỏi: Người mệnh Thổ nên chọn hướng nhà nào?"
              />
              <textarea
                rows="2"
                class="form-input form-textarea"
                bind:value={formFaqAnswer}
                placeholder="Câu trả lời ngắn gọn, chuẩn xác..."
              ></textarea>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" onclick={() => (showModal = false)}>Hủy</button>
          <button class="btn-save-post" onclick={handleSavePost}>
            <Save size={14} />
            <span>{isEditing ? 'Lưu Thay Đổi' : 'Xuất Bản Bài Viết'}</span>
          </button>
        </div>
      </div>
    </div>
  {/if}

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

  /* Create Post Button & Actions */
  .btn-create-post {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, #fce99f 0%, #d4af37 100%);
    color: #0f0c1b;
    font-size: 13px;
    font-weight: 800;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(212, 175, 55, 0.25);
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .btn-create-post:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(212, 175, 55, 0.35);
  }

  .row-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }

  .btn-action-icon {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }

  .btn-edit {
    background: rgba(139, 92, 246, 0.12);
    border: 1px solid rgba(139, 92, 246, 0.3);
    color: #c084fc;
  }

  .btn-edit:hover {
    background: rgba(139, 92, 246, 0.25);
    transform: translateY(-1px);
  }

  .btn-delete {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #ef4444;
  }

  .btn-delete:hover {
    background: rgba(239, 68, 68, 0.22);
    transform: translateY(-1px);
  }

  /* Modal Editor Styles */
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(10, 8, 20, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md);
    animation: fadeIn 0.2s ease-out;
  }

  .modal-card {
    width: 100%;
    max-width: 680px;
    max-height: 90vh;
    overflow-y: auto;
    background: var(--glass-bg);
    backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid var(--overlay-border-strong);
    border-radius: var(--radius-xl);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    animation: slideUp 0.25s ease-out;
  }

  .modal-header {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--overlay-border);
  }

  .modal-title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .modal-title-wrap h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
    color: var(--color-text-primary);
  }

  .btn-close-modal {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm);
  }

  .btn-close-modal:hover {
    color: var(--color-text-primary);
  }

  .modal-body {
    padding: 20px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group.full-width {
    grid-column: span 2;
  }

  .form-group label {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .form-input {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 12px;
    border-radius: var(--radius-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--overlay-border-strong);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .form-input:focus {
    border-color: #d4af37;
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  }

  .form-textarea {
    resize: vertical;
    font-family: inherit;
    line-height: 1.5;
  }

  .faq-section {
    background: rgba(16, 185, 129, 0.05);
    border: 1px dashed rgba(16, 185, 129, 0.3);
    padding: 12px;
    border-radius: var(--radius-md);
    gap: 8px;
  }

  .faq-header-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    color: #10b981;
  }

  .modal-footer {
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    border-top: 1px solid var(--overlay-border);
    background: var(--overlay-ink-wash);
  }

  .btn-cancel {
    padding: 8px 16px;
    border-radius: var(--radius-md);
    background: transparent;
    border: 1px solid var(--overlay-border);
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-cancel:hover {
    background: var(--overlay-ink-wash);
    color: var(--color-text-primary);
  }

  .btn-save-post {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, #fce99f 0%, #d4af37 100%);
    color: #0f0c1b;
    font-size: 13px;
    font-weight: 800;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
  }

  .btn-save-post:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(212, 175, 55, 0.35);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(16px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
</style>
