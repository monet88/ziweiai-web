import { Controller, Get, Param, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { z } from 'zod';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { apiEnv } from '../../config/env';
import { reportOpsAlert } from '../../observability/ops-alert';
import { Public } from '../auth/decorators/public.decorator';
import { buildMysticalOgTree } from './og-element';
import { buildShareMeta, escapeHtml } from './share-meta';

const chartIdPipe = new ZodValidationPipe(z.uuid(), 'Mã lá số không hợp lệ.');

// Bot User-Agents regex (Facebook, Zalo, Twitter, Google, Telegram, etc.)
const BOT_USER_AGENTS =
  /(bot|facebookexternalhit|zalo|discordbot|telegrambot|slackbot|vkShare|whatsapp|skype|twitterbot|linkedinbot|pinterest|applebot|yandex)/i;

const PUBLIC_ORIGIN = 'https://tuvitoantap.vercel.app';

// jsDelivr fontsource Inter subsets (GitHub raw path 404s).
const INTER_FONT_URLS = [
  'https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-400-normal.woff',
  'https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/vietnamese-400-normal.woff',
] as const;

// Cache fonts in memory for serverless warm starts
let fontBuffers: ArrayBuffer[] | null = null;

async function getInterFonts(): Promise<ArrayBuffer[]> {
  if (fontBuffers) return fontBuffers;

  const loaded = await Promise.all(
    INTER_FONT_URLS.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch OG font (${response.status}): ${url}`);
      }
      return response.arrayBuffer();
    }),
  );

  fontBuffers = loaded;
  return loaded;
}

@Controller()
export class ShareController {
  constructor(private readonly persistenceGateway: SupabasePersistenceGateway) {}

  /** Crawler + human share entry; must stay public (global SupabaseAuthGuard). */
  @Public()
  @Get('share/charts/:id')
  async handleShareRedirect(
    @Param('id', chartIdPipe) id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const isBot = BOT_USER_AGENTS.test(userAgent);
    const targetUrl = `${PUBLIC_ORIGIN}/charts/${id}`;

    if (isBot) {
      const chart = await this.persistenceGateway.findPublicChartSnapshotById(id);

      // Missing chart: brand fallback (do not pretend default system is Tử Vi).
      // Valid chart: dynamic title/description + OG image.
      const meta = chart
        ? buildShareMeta({
            chartSystem: chart.chartSystem,
            snapshot: chart.snapshot as ShareMetaSnapshot,
          })
        : {
            title: 'Tử Vi Toàn Tập',
            documentTitle: 'Tử Vi Toàn Tập',
            description:
              'Lập lá số, xem lại lịch sử và hỏi đáp AI trên Tử Vi Toàn Tập.',
          };

      const ogImageUrl = chart ? `${PUBLIC_ORIGIN}/api/og/charts/${id}` : null;
      const safeTitle = escapeHtml(meta.documentTitle);
      const safeDescription = escapeHtml(meta.description);
      const safeOgTitle = escapeHtml(meta.title);

      const ogImageTags = ogImageUrl
        ? `    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:image" content="${ogImageUrl}" />`
        : '';

      const htmlString = `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta property="og:title" content="${safeOgTitle}" />
    <meta property="og:description" content="${safeDescription}" />
${ogImageTags}
    <meta property="og:url" content="${targetUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Tử Vi Toàn Tập" />
    <meta property="og:locale" content="vi_VN" />
    <meta name="twitter:card" content="${ogImageUrl ? 'summary_large_image' : 'summary'}" />
    <meta name="twitter:title" content="${safeOgTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
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
  async generateOgImage(
    @Param('id', chartIdPipe) id: string,
    @Res() res: Response,
  ) {
    try {
      const chart = await this.persistenceGateway.findPublicChartSnapshotById(id);
      if (!chart) {
        return res.status(HttpStatus.NOT_FOUND).send('Chart not found');
      }

      const meta = buildShareMeta({
        chartSystem: chart.chartSystem,
        snapshot: chart.snapshot as ShareMetaSnapshot,
      });

      const fonts = await getInterFonts();
      const template = buildMysticalOgTree({
        systemName: meta.systemName,
        title: meta.title,
        genderLabel: meta.genderLabel,
        yearLabel: meta.yearLabel,
      });

      const svg = await satori(template as never, {
        width: 1200,
        height: 630,
        fonts: fonts.map((data) => ({
          name: 'Inter',
          data,
          weight: 400 as const,
          style: 'normal' as const,
        })),
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
      // @Res() path bypasses ApiErrorFilter — alert explicitly (Phase 11 OG 500 lesson).
      console.error('Failed to generate OG image:', error);
      void reportOpsAlert(
        {
          level: 'error',
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate OG image',
          path: `/og/charts/${id}`,
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          cause: error,
          tags: { surface: 'og_image' },
        },
        { webhookUrl: apiEnv.OPS_ALERT_WEBHOOK_URL },
      );
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
