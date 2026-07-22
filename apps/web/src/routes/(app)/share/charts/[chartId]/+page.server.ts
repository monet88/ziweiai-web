import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

// Note: production crawlers hit NestJS via Vercel rewrite /share/* → /api/share/*.
// This load remains for local SvelteKit preview and keeps meta keys aligned with API.

const systemNames: Record<string, string> = {
  'zi-wei-dou-shu': 'Tử Vi Đẩu Số',
  'ba-zi': 'Bát Tự Tứ Trụ',
  mangpai: 'Bát Tự Mạnh Phái',
  'mei-hua-yi-shu': 'Mai Hoa Dịch Số',
  'liu-yao': 'Lục Hào',
  'da-liu-ren': 'Đại Lục Nhâm',
  'qi-men-dun-jia': 'Kỳ Môn Độn Giáp',
};

const systemTitles: Record<string, string> = {
  'zi-wei-dou-shu': 'Lá số Tử Vi',
  'ba-zi': 'Lá số Bát Tự',
  mangpai: 'Lá số Mạnh Phái',
  'mei-hua-yi-shu': 'Quẻ Mai Hoa',
  'liu-yao': 'Quẻ Lục Hào',
  'da-liu-ren': 'Quẻ Đại Lục Nhâm',
  'qi-men-dun-jia': 'Kỳ Môn Độn Giáp',
};

export const load: PageServerLoad = async ({ params, url }) => {
  const chartId = params.chartId;

  if (!chartId) {
    throw error(400, 'Missing chartId');
  }

  const supabaseUrl = env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw error(500, 'Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: chart, error: dbError } = await supabase
    .from('chart_snapshots')
    .select('title, chart_system, snapshot')
    .eq('id', chartId)
    .single();

  if (dbError || !chart) {
    throw error(404, 'Chart not found');
  }

  const systemKey = chart.chart_system as string;
  const systemName = systemNames[systemKey] || 'Hệ Thuật Số';
  const baseTitle = systemTitles[systemKey] || chart.title || 'Lá số thuật số';

  const snap = (chart.snapshot ?? {}) as {
    birth?: {
      originalInput?: {
        sexOrGenderForChart?: string;
        date?: { year?: number };
      };
    };
  };
  const sex = snap.birth?.originalInput?.sexOrGenderForChart;
  const year = snap.birth?.originalInput?.date?.year;
  const gender =
    sex === 'male' ? 'Nam Mạng' : sex === 'female' ? 'Nữ Mạng' : null;

  const titleBits = [baseTitle];
  if (gender) titleBits.push(gender);
  if (year) titleBits.push(String(year));
  const title = titleBits.join(' · ');

  return {
    meta: {
      title: `${title} | Tử Vi Toàn Tập`,
      description: `Xem luận giải ${systemName}${year ? `, sinh năm ${year}` : ''} trên Tử Vi Toàn Tập. Lập lá số, xem lịch sử và hỏi đáp AI.`,
      ogImage: `${url.origin}/api/og/charts/${chartId}`,
      url: `${url.origin}/share/charts/${chartId}`,
    },
  };
};
