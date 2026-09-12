import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://tuvitoantap.online';
const TODAY = new Date().toISOString().split('T')[0];

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

const STATIC_ROUTES: Omit<SitemapUrl, 'loc'> & { path: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'daily', lastmod: TODAY },
  { path: '/charts', priority: '0.9', changefreq: 'daily', lastmod: TODAY },
  { path: '/bazi', priority: '0.9', changefreq: 'daily', lastmod: TODAY },
  { path: '/numerology', priority: '0.9', changefreq: 'daily', lastmod: TODAY },
  { path: '/almanac', priority: '0.9', changefreq: 'daily', lastmod: TODAY },
  { path: '/blog', priority: '0.9', changefreq: 'daily', lastmod: TODAY },
  { path: '/liuyao', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { path: '/tarot', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { path: '/stick', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { path: '/meihua', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { path: '/qimen', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { path: '/daliuren', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { path: '/palm', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { path: '/face', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { path: '/dream', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { path: '/mbti', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { path: '/hepan', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { path: '/gallery', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { path: '/pricing', priority: '0.8', changefreq: 'monthly', lastmod: TODAY },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly', lastmod: TODAY },
  { path: '/terms', priority: '0.3', changefreq: 'yearly', lastmod: TODAY },
];

const KNOWN_BLOG_POSTS = [
  { slug: 'y-nghia-14-chinh-tinh-tu-vi', publishedAt: '2026-09-08' },
  { slug: 'bat-tu-tu-tru-can-bang-ngu-hanh-dung-than', publishedAt: '2026-09-08' },
  { slug: 'huong-dan-gieo-que-kinh-dich-luc-hao', publishedAt: '2026-09-08' },
  { slug: 'nhan-tuong-hoc-khuon-mat-ai-vision', publishedAt: '2026-09-08' },
];

export function buildSitemapXml(): string {
  const urls: SitemapUrl[] = [
    ...STATIC_ROUTES.map((r) => ({
      loc: `${BASE_URL}${r.path}`,
      lastmod: r.lastmod,
      changefreq: r.changefreq,
      priority: r.priority,
    })),
    ...KNOWN_BLOG_POSTS.map((b) => ({
      loc: `${BASE_URL}/blog/${b.slug}`,
      lastmod: b.publishedAt,
      changefreq: 'weekly' as const,
      priority: '0.8',
    })),
  ];

  const xmlUrls = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>
`;
}

function main() {
  const outputPath = path.resolve(__dirname, '../apps/web/static/sitemap.xml');
  const xml = buildSitemapXml();
  fs.writeFileSync(outputPath, xml, 'utf-8');
  console.log(`[sitemap] Generated sitemap with ${STATIC_ROUTES.length + KNOWN_BLOG_POSTS.length} URLs at: ${outputPath}`);
}

main();
