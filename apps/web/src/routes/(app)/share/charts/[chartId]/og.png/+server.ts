import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import fs from 'node:fs';
import path from 'node:path';

// Local/dev OG route. Production crawlers use NestJS GET /api/og/charts/:id
// (Vercel rewrites /share/* to API). Keep visuals aligned with Ticket 2 mystical glass.

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

let fontRegular: Buffer;
let fontBold: Buffer;
let wasmReady: Promise<void> | null = null;

async function ensureWasm(): Promise<void> {
  if (!wasmReady) {
    wasmReady = (async () => {
      try {
        const wasmPath = path.resolve(
          'node_modules/@resvg/resvg-wasm/index_bg.wasm',
        );
        const wasm = fs.readFileSync(wasmPath);
        await initWasm(wasm);
      } catch {
        // Fallback: already initialized or path differs in monorepo
        try {
          await initWasm(
            fs.readFileSync(
              path.resolve(
                '../../node_modules/@resvg/resvg-wasm/index_bg.wasm',
              ),
            ),
          );
        } catch {
          // ignore double-init
        }
      }
    })();
  }
  await wasmReady;
}

export const GET: RequestHandler = async ({ params }) => {
  const chartId = params.chartId;
  if (!chartId) {
    throw error(400, 'Missing chartId');
  }

  const supabaseUrl = env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw error(500, 'Supabase credentials missing');
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
  const baseTitle = systemTitles[systemKey] || chart.title || 'Lá Số Vô Danh';
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
  const chartTitle = titleBits.join(' · ');

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

  await ensureWasm();

  const genderChip = gender
    ? `<div style="display: flex; padding: 8px 18px; border-radius: 999px; background: rgba(212,175,55,0.16); border: 1px solid rgba(212,175,55,0.35); margin-right: 12px;">
        <span style="font-size: 22px; color: #f5f1e8;">${gender}</span>
      </div>`
    : '';
  const yearChip = year
    ? `<div style="display: flex; padding: 8px 18px; border-radius: 999px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14);">
        <span style="font-size: 22px; color: #cfc7ba;">Năm ${year}</span>
      </div>`
    : '';

  const template = html`
    <div
      style="display: flex; width: 1200px; height: 630px; background-color: #0c0b12; color: #f5f1e8; font-family: 'Inter', sans-serif; position: relative; overflow: hidden;"
    >
      <div
        style="position: absolute; top: -120px; left: -80px; width: 520px; height: 520px; border-radius: 999px; background: rgba(212, 175, 55, 0.18);"
      ></div>
      <div
        style="position: absolute; bottom: -160px; right: -60px; width: 560px; height: 560px; border-radius: 999px; background: rgba(120, 96, 220, 0.16);"
      ></div>
      <div
        style="position: absolute; inset: 36px; display: flex; flex-direction: column; justify-content: space-between; border-radius: 28px; border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.06); padding: 48px 56px;"
      >
        <div style="display: flex; align-items: center;">
          <div
            style="display: flex; width: 48px; height: 48px; border-radius: 14px; background: #d4af37; align-items: center; justify-content: center; margin-right: 16px;"
          >
            <span style="font-size: 22px; font-weight: 700; color: #14110c;">TV</span>
          </div>
          <span style="font-size: 28px; font-weight: 700; color: #f5f1e8;">Tử Vi Toàn Tập</span>
        </div>

        <div style="display: flex; flex-direction: column;">
          <span
            style="font-size: 22px; font-weight: 600; color: #d4af37; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px;"
          >
            ${systemName}
          </span>
          <h1
            style="font-size: 58px; font-weight: 700; color: #f5f1e8; line-height: 1.12; margin: 0 0 18px 0; max-width: 980px;"
          >
            ${chartTitle}
          </h1>
          <div style="display: flex;">
            ${genderChip}
            ${yearChip}
          </div>
        </div>

        <div
          style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 22px;"
        >
          <span style="font-size: 22px; color: #cfc7ba;">
            Xem luận giải AI tại tuvitoantap.vercel.app
          </span>
          <div style="display: flex; padding: 12px 26px; border-radius: 999px; background: #d4af37;">
            <span style="font-size: 22px; font-weight: 700; color: #14110c;">Mở lá số</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const svg = await satori(template as never, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return new Response(Buffer.from(pngBuffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
