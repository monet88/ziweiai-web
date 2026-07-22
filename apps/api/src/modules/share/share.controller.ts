import { Controller, Get, Param, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { Public } from '../auth/decorators/public.decorator';
import { buildMysticalOgTree } from './og-element';
import { buildShareMeta, escapeHtml } from './share-meta';

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
