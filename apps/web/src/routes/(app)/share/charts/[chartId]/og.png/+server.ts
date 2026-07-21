import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-wasm';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import fs from 'node:fs';
import path from 'node:path';

// Define the system names
const systemNames: Record<string, string> = {
  'zi-wei-dou-shu': 'Tử Vi Đẩu Số',
  'ba-zi': 'Tứ Trụ Bát Tự',
  'mei-hua': 'Mai Hoa Dịch Số',
  'liu-yao': 'Lục Hào',
  'da-liu-ren': 'Đại Lục Nhâm',
  'qi-men-dun-jia': 'Kỳ Môn Độn Giáp',
};

// We will load the font lazily
let fontRegular: Buffer;
let fontBold: Buffer;

export const GET: RequestHandler = async ({ params, fetch }) => {
  const chartId = params.chartId;
  if (!chartId) {
    throw error(400, 'Missing chartId');
  }

  // 1. Fetch Chart Data using Supabase
  const supabaseUrl = env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw error(500, 'Supabase credentials missing');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: chart, error: dbError } = await supabase
    .from('chart_snapshots')
    .select('title, chart_system, owner_user_id')
    .eq('id', chartId)
    .single();

  if (dbError || !chart) {
    // Return a default image or throw 404
    throw error(404, 'Chart not found');
  }

  const systemName = systemNames[chart.chart_system] || 'Hệ Thuật Số';
  const chartTitle = chart.title || 'Lá Số Vô Danh';

  // 2. Load Fonts
  try {
    if (!fontRegular) {
      fontRegular = fs.readFileSync(path.resolve('static/fonts/Inter-Regular.ttf'));
    }
    if (!fontBold) {
      fontBold = fs.readFileSync(path.resolve('static/fonts/Inter-Bold.ttf'));
    }
  } catch (e) {
    console.error('Could not load fonts from static/fonts/', e);
    throw error(500, 'Could not load fonts');
  }

  // 3. Construct HTML for Satori
  const template = html`
    <div style="display: flex; flex-direction: column; width: 1200px; height: 630px; background-color: #0f172a; color: white; padding: 60px; font-family: 'Inter', sans-serif;">
      
      <!-- Background Graphic (Subtle Pattern/Gradient) -->
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); z-index: 0;"></div>
      
      <!-- Glow effect -->
      <div style="position: absolute; top: -100px; right: -100px; width: 600px; height: 600px; background: rgba(139, 92, 246, 0.15); border-radius: 50%; filter: blur(80px); z-index: 1;"></div>
      <div style="position: absolute; bottom: -100px; left: -100px; width: 500px; height: 500px; background: rgba(59, 130, 246, 0.15); border-radius: 50%; filter: blur(80px); z-index: 1;"></div>

      <div style="display: flex; flex-direction: column; z-index: 10; height: 100%; justify-content: space-between;">
        
        <!-- Header: Logo / Brand -->
        <div style="display: flex; align-items: center;">
          <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background-color: #8b5cf6; margin-right: 16px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
          <span style="font-size: 32px; font-weight: 700; color: #f8fafc; letter-spacing: -0.5px;">Tử Vi Toàn Tập</span>
        </div>

        <!-- Main Content -->
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 36px; font-weight: 600; color: #a78bfa; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px;">
            Luận Giải ${systemName}
          </span>
          <h1 style="font-size: 72px; font-weight: 700; color: white; line-height: 1.1; margin: 0 0 20px 0; max-width: 900px;">
            ${chartTitle}
          </h1>
          <p style="font-size: 32px; color: #94a3b8; max-width: 800px; margin: 0; line-height: 1.4;">
            Khám phá chi tiết vận mệnh, tài lộc và sự nghiệp qua hệ thống luận giải AI chuẩn xác.
          </p>
        </div>

        <!-- Footer -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 2px solid rgba(255, 255, 255, 0.1); padding-top: 30px;">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 24px; color: #f1f5f9; font-weight: 600;">Xem chi tiết lá số này miễn phí tại tuvitoantap.vercel.app</span>
          </div>
          <div style="display: flex; padding: 12px 24px; background-color: #8b5cf6; border-radius: 999px;">
            <span style="font-size: 24px; font-weight: 600; color: white;">Xem ngay</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // 4. Generate SVG with Satori
  const svg = await satori(template as any, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Inter',
        data: fontRegular,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: fontBold,
        weight: 700,
        style: 'normal',
      },
    ],
  });

  // 5. Convert SVG to PNG with Resvg
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return new Response(pngBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
