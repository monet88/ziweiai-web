export interface BlogCategory {
  id: 'all' | 'tu-vi' | 'bat-tu' | 'kinh-dich' | 'nhan-tuong';
  label: string;
}

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogCta {
  title: string;
  desc: string;
  actionLabel: string;
  actionRoute: string;
  badge: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  category: 'tu-vi' | 'bat-tu' | 'kinh-dich' | 'nhan-tuong';
  categoryLabel: string;
  publishedAt: string; // YYYY-MM-DD
  readTime: string;
  author: {
    name: string;
    role: string;
  };
  summary: string;
  keywords: string[];
  tableOfContents: Array<{
    id: string;
    title: string;
  }>;
  contentHtml: string;
  faqs: BlogFaq[];
  cta: BlogCta;
}
