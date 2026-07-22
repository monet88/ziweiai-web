import { Controller, Get, Param, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { Public } from '../auth/decorators/public.decorator';
import { buildShareMeta, escapeHtml } from './share-meta';

// Bot User-Agents regex (Facebook, Zalo, Twitter, Google, Telegram, etc.)
const BOT_USER_AGENTS =
  /(bot|facebookexternalhit|zalo|discordbot|telegrambot|slackbot|vkShare|whatsapp|skype|twitterbot|linkedinbot|pinterest|applebot|yandex)/i;

const PUBLIC_ORIGIN = 'https://tuvitoantap.vercel.app';

// Cache font in memory for serverless
let fontBuffer: ArrayBuffer | null = null;
async function getFont(): Promise<ArrayBuffer> {
  if (fontBuffer) return fontBuffer;
  // Inter woff has broad Latin + Vietnamese coverage for OG titles.
  const response = await fetch(
    'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.woff',
  );
  fontBuffer = await response.arrayBuffer();
  return fontBuffer;
}

@Controller()
export class ShareController {
  constructor(private readonly persistenceGateway: SupabasePersistenceGateway) {}

  /** Crawler + human share entry; must stay public (global SupabaseAuthGuard). */
  @Public()
  @Get('share/charts/:id')
  async handleShareRedirect(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const isBot = BOT_USER_AGENTS.test(userAgent);
    const targetUrl = `${PUBLIC_ORIGIN}/charts/${id}`;

    if (isBot) {
      const chart = await this.persistenceGateway.findPublicChartSnapshotById(id);
      const meta = buildShareMeta({
        chartSystem: chart?.chartSystem ?? 'zi-wei-dou-shu',
        snapshot: (chart?.snapshot as ShareMetaSnapshot | undefined) ?? null,
      });

      const ogImageUrl = `${PUBLIC_ORIGIN}/api/og/charts/${id}`;
      const safeTitle = escapeHtml(meta.documentTitle);
      const safeDescription = escapeHtml(meta.description);
      const safeOgTitle = escapeHtml(meta.title);

      const htmlString = `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta property="og:title" content="${safeOgTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${targetUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Tử Vi Toàn Tập" />
    <meta property="og:locale" content="vi_VN" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeOgTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${ogImageUrl}" />
    <meta http-equiv="refresh" content="0; url=${targetUrl}" />
  </head>
  <body>
    Redirecting to <a href="${targetUrl}">${targetUrl}</a>...
  </body>
</html>`;

      return res.status(HttpStatus.OK).type('text/html').send(htmlString);
    }

    return res.redirect(HttpStatus.FOUND, targetUrl);
  }

  /** Dynamic OG PNG for social previews; public by UUID (unguessable id). */
  @Public()
  @Get('og/charts/:id')
  async generateOgImage(@Param('id') id: string, @Res() res: Response) {
    try {
      const chart = await this.persistenceGateway.findPublicChartSnapshotById(id);
      if (!chart) {
        return res.status(HttpStatus.NOT_FOUND).send('Chart not found');
      }

      const meta = buildShareMeta({
        chartSystem: chart.chartSystem,
        snapshot: chart.snapshot as ShareMetaSnapshot,
      });

      const fontData = await getFont();

      // Dynamic import to avoid ERR_REQUIRE_ESM in CommonJS runtime (Vercel Node.js)
      const satoriHtml = await (eval('import("satori-html")') as Promise<{
        html: (strings: TemplateStringsArray, ...values: unknown[]) => unknown;
      }>);
      const html = satoriHtml.html;

      // Mystical glass card (aligned with Phase 11 Ticket 2 palette: ink + gold)
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
                ${meta.systemName}
              </span>
              <h1
                style="font-size: 58px; font-weight: 700; color: #f5f1e8; line-height: 1.12; margin: 0 0 18px 0; max-width: 980px;"
              >
                ${meta.title}
              </h1>
              <div style="display: flex; gap: 12px;">
                ${meta.genderLabel
                  ? `<div style="display: flex; padding: 8px 18px; border-radius: 999px; background: rgba(212,175,55,0.16); border: 1px solid rgba(212,175,55,0.35);">
                      <span style="font-size: 22px; color: #f5f1e8;">${meta.genderLabel}</span>
                    </div>`
                  : ''}
                ${meta.yearLabel
                  ? `<div style="display: flex; padding: 8px 18px; border-radius: 999px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14);">
                      <span style="font-size: 22px; color: #cfc7ba;">Năm ${meta.yearLabel}</span>
                    </div>`
                  : ''}
              </div>
            </div>

            <div
              style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 22px;"
            >
              <span style="font-size: 22px; color: #cfc7ba;">
                Xem luận giải AI tại tuvitoantap.vercel.app
              </span>
              <div
                style="display: flex; padding: 12px 26px; border-radius: 999px; background: #d4af37;"
              >
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
          {
            name: 'Inter',
            data: fontData,
            weight: 400,
            style: 'normal',
          },
        ],
      });

      const resvg = new Resvg(svg, {
        background: '#0c0b12',
      });
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.status(HttpStatus.OK).send(pngBuffer);
    } catch (error) {
      console.error('Failed to generate OG image:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Failed to generate image');
    }
  }
}

type ShareMetaSnapshot = {
  summary?: Record<string, unknown> | null;
  birth?: {
    originalInput?: {
      sexOrGenderForChart?: string | null;
      date?: { year?: number | null } | null;
    } | null;
    resolvedDateTime?: {
      date?: { year?: number | null } | null;
    } | null;
  } | null;
};
