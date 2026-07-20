import { Controller, Get, Param, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { ChartSnapshotRecord } from '@ziweiai/contracts';

// Bot User-Agents regex (Facebook, Zalo, Twitter, Google, Telegram, etc.)
const BOT_USER_AGENTS = /(bot|facebookexternalhit|zalo|discordbot|telegrambot|slackbot|vkShare|whatsapp|skype|twitterbot|linkedinbot|pinterest|applebot|yandex)/i;

// Cache font in memory for serverless
let fontBuffer: ArrayBuffer | null = null;
async function getFont(): Promise<ArrayBuffer> {
  if (fontBuffer) return fontBuffer;
  // Fetch a standard vietnamese-supported font (Inter)
  const response = await fetch('https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.woff');
  fontBuffer = await response.arrayBuffer();
  return fontBuffer;
}

@Controller()
export class ShareController {
  constructor(private readonly persistenceGateway: SupabasePersistenceGateway) {}

  @Get('share/charts/:id')
  async handleShareRedirect(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const userAgent = req.headers['user-agent'] || '';
    const isBot = BOT_USER_AGENTS.test(userAgent);

    const targetUrl = `https://tuvitoantap.vercel.app/charts/${id}`;

    if (isBot) {
      // Fetch chart summary to set accurate og:title
      const chart = await this.persistenceGateway.findPublicChartSnapshotById(id);
      
      let title = 'Lá số Tử Vi';
      let description = 'Xem luận giải chi tiết lá số tại Tử Vi Toàn Tập.';
      
      if (chart) {
        if (chart.chartSystem === 'zi-wei-dou-shu') title = 'Lá số Tử Vi';
        else if (chart.chartSystem === 'ba-zi' || chart.chartSystem === 'mangpai') title = 'Lá số Bát Tự';
        else if (chart.chartSystem === 'liu-yao') title = 'Quẻ Lục Hào';
        else if (chart.chartSystem === 'mei-hua-yi-shu') title = 'Quẻ Mai Hoa';
        else if (chart.chartSystem === 'da-liu-ren') title = 'Quẻ Đại Lục Nhâm';
        else if (chart.chartSystem === 'qi-men-dun-jia') title = 'Kỳ Môn Độn Giáp';
        
        const birth = (chart.snapshot as any).birth?.originalInput;
        // const name = birth?.name ? ` của ${birth.name}` : '';
        // title = `${title}${name}`;
      }

      const ogImageUrl = `https://tuvitoantap.vercel.app/api/og/charts/${id}`;
      
      const htmlString = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <meta property="og:title" content="${title}" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${ogImageUrl}" />
            <meta property="og:url" content="${targetUrl}" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:image" content="${ogImageUrl}" />
            <meta http-equiv="refresh" content="0; url=${targetUrl}" />
          </head>
          <body>
            Redirecting to <a href="${targetUrl}">${targetUrl}</a>...
          </body>
        </html>
      `;
      
      return res.status(HttpStatus.OK).type('text/html').send(htmlString);
    }

    // Normal user: 302 redirect
    return res.redirect(HttpStatus.FOUND, targetUrl);
  }

  @Get('og/charts/:id')
  async generateOgImage(@Param('id') id: string, @Res() res: Response) {
    try {
      const chart = await this.persistenceGateway.findPublicChartSnapshotById(id);
      if (!chart) {
        return res.status(HttpStatus.NOT_FOUND).send('Chart not found');
      }

      let title = 'Lá Số Tử Vi';
      let systemName = 'Tử Vi Đẩu Số';
      if (chart.chartSystem === 'zi-wei-dou-shu') { title = 'Lá Số Tử Vi'; systemName = 'Tử Vi Đẩu Số'; }
      else if (chart.chartSystem === 'ba-zi') { title = 'Lá Số Bát Tự'; systemName = 'Bát Tự Tứ Trụ'; }
      else if (chart.chartSystem === 'mangpai') { title = 'Lá Số Bát Tự'; systemName = 'Bát Tự Mạnh Phái'; }
      else if (chart.chartSystem === 'liu-yao') { title = 'Quẻ Lục Hào'; systemName = 'Lục Hào Dự Trắc'; }
      else if (chart.chartSystem === 'mei-hua-yi-shu') { title = 'Quẻ Mai Hoa'; systemName = 'Mai Hoa Dịch Số'; }
      else if (chart.chartSystem === 'da-liu-ren') { title = 'Quẻ Lục Nhâm'; systemName = 'Đại Lục Nhâm'; }
      else if (chart.chartSystem === 'qi-men-dun-jia') { title = 'Kỳ Môn Độn Giáp'; systemName = 'Kỳ Môn Độn Giáp'; }

      const birth = (chart.snapshot as any).birth?.originalInput;
      const name = 'Khách'; // No longer stored in ChartSnapshot
      let genderStr = '';
      if (birth?.sexOrGenderForChart === 'male') genderStr = 'Nam Mạng';
      else if (birth?.sexOrGenderForChart === 'female') genderStr = 'Nữ Mạng';

      const fontData = await getFont();
      
      // Dynamic import to avoid ERR_REQUIRE_ESM in CommonJS runtime (Vercel Node.js)
      const satoriHtml = await (eval('import("satori-html")') as Promise<any>);
      const html = satoriHtml.html;

      const template = html`
        <div style="display: flex; width: 1200px; height: 630px; background-color: #1a1a2e; color: white; font-family: 'Inter', sans-serif; align-items: center; justify-content: center; position: relative;">
          <!-- Background decoration -->
          <div style="position: absolute; top: -200px; right: -200px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(138,43,226,0.3) 0%, rgba(26,26,46,0) 70%); border-radius: 50%;"></div>
          <div style="position: absolute; bottom: -200px; left: -200px; width: 800px; height: 800px; background: radial-gradient(circle, rgba(72,61,139,0.4) 0%, rgba(26,26,46,0) 70%); border-radius: 50%;"></div>
          
          <div style="display: flex; flex-direction: column; align-items: center; z-index: 10; border: 2px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 60px 80px; background: rgba(0,0,0,0.4); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <h1 style="font-size: 64px; font-weight: bold; margin: 0 0 20px 0; color: #e9d5ff; text-align: center;">${title}</h1>
            <div style="display: flex; font-size: 36px; color: #a78bfa; margin-bottom: 40px; text-transform: uppercase; letter-spacing: 2px;">
              ${systemName}
            </div>
            
            <div style="display: flex; flex-direction: column; align-items: center; font-size: 42px; margin-bottom: 20px;">
              <span style="font-weight: bold;">${name}</span>
            </div>
            
            ${genderStr ? `
              <div style="display: flex; font-size: 32px; color: #cbd5e1; margin-bottom: 40px; background: rgba(255,255,255,0.1); padding: 8px 24px; border-radius: 99px;">
                ${genderStr}
              </div>
            ` : ''}
            
            <div style="display: flex; font-size: 28px; color: #94a3b8; margin-top: 20px;">
              Tử Vi Toàn Tập - tuvitoantap.vercel.app
            </div>
          </div>
        </div>
      `;

      const svg = await satori(template as any, {
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
        background: '#1a1a2e',
      });
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.status(HttpStatus.OK).send(pngBuffer);
      
    } catch (error) {
      console.error('Failed to generate OG image:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Failed to generate image');
    }
  }
}
