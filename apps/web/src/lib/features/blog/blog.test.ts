import { describe, it, expect } from 'vitest';
import { BLOG_POSTS, BLOG_CATEGORIES, getBlogPostBySlug, getRelatedPosts } from './blog-data';

describe('Blog Feature Unit Tests', () => {
  it('định nghĩa đầy đủ các danh mục bài viết cơ bản', () => {
    expect(BLOG_CATEGORIES.length).toBeGreaterThanOrEqual(4);
    const catIds = BLOG_CATEGORIES.map((c) => c.id);
    expect(catIds).toContain('all');
    expect(catIds).toContain('tu-vi');
    expect(catIds).toContain('bat-tu');
    expect(catIds).toContain('kinh-dich');
    expect(catIds).toContain('nhan-tuong');
  });

  it('kho bài viết có đầy đủ dữ liệu cấu trúc chuẩn SEO', () => {
    expect(BLOG_POSTS.length).toBeGreaterThanOrEqual(4);

    const slugs = new Set<string>();

    for (const post of BLOG_POSTS) {
      expect(post.slug).toBeTruthy();
      expect(post.slug).toMatch(/^[a-z0-9-]+$/);
      expect(slugs.has(post.slug)).toBe(false);
      slugs.add(post.slug);

      expect(post.title).toBeTruthy();
      expect(post.summary).toBeTruthy();
      expect(post.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(post.readTime).toContain('phút đọc');
      expect(post.keywords.length).toBeGreaterThan(0);
      expect(post.contentHtml).toBeTruthy();
      expect(post.contentHtml).toContain('<section id=');
      expect(post.tableOfContents.length).toBeGreaterThan(0);

      // Conversion CTA
      expect(post.cta.title).toBeTruthy();
      expect(post.cta.actionLabel).toBeTruthy();
      expect(post.cta.actionRoute).toBeTruthy();
      expect(post.cta.badge).toBeTruthy();

      // FAQs Schema
      expect(post.faqs.length).toBeGreaterThanOrEqual(1);
      for (const faq of post.faqs) {
        expect(faq.question).toBeTruthy();
        expect(faq.answer).toBeTruthy();
      }
    }
  });

  it('getBlogPostBySlug tìm đúng bài viết hoặc trả về undefined', () => {
    const post = getBlogPostBySlug('y-nghia-14-chinh-tinh-tu-vi');
    expect(post).toBeDefined();
    expect(post?.category).toBe('tu-vi');

    expect(getBlogPostBySlug('non-existent-slug')).toBeUndefined();
    expect(getBlogPostBySlug(undefined)).toBeUndefined();
  });

  it('getRelatedPosts loại bỏ bài viết hiện tại và giới hạn số lượng', () => {
    const related = getRelatedPosts('y-nghia-14-chinh-tinh-tu-vi', 2);
    expect(related.length).toBeLessThanOrEqual(2);
    expect(related.some((p) => p.slug === 'y-nghia-14-chinh-tinh-tu-vi')).toBe(false);

    const fallbackRelated = getRelatedPosts(undefined, 2);
    expect(fallbackRelated.length).toBe(2);
  });
});
