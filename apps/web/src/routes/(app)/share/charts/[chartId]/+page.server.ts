import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

// Define the system names
const systemNames: Record<string, string> = {
  'zi-wei-dou-shu': 'Tử Vi Đẩu Số',
  'ba-zi': 'Tứ Trụ Bát Tự',
  'mei-hua': 'Mai Hoa Dịch Số',
  'liu-yao': 'Lục Hào',
  'da-liu-ren': 'Đại Lục Nhâm',
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
    .select('title, chart_system')
    .eq('id', chartId)
    .single();

  if (dbError || !chart) {
    throw error(404, 'Chart not found');
  }

  const systemName = systemNames[chart.chart_system] || 'Hệ Thuật Số';
  const title = chart.title || 'Lá Số Vô Danh';
  
  return {
    meta: {
      title: `${title} - Luận Giải ${systemName} | Tử Vi Toàn Tập`,
      description: `Khám phá chi tiết vận mệnh, tài lộc và sự nghiệp qua lá số ${systemName} trên Tử Vi Toàn Tập.`,
      ogImage: `${url.origin}/share/charts/${chartId}/og.png`,
      url: `${url.origin}/share/charts/${chartId}`,
    }
  };
};
