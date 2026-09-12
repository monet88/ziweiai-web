import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import {
  annualReportRequestSchema,
  dailyFortuneRequestSchema,
  monthlyFortuneRequestSchema,
  type AnnualReportResponse,
  type AuthenticatedUser,
  type DailyFortuneResponse,
  type MonthlyFortuneResponse,
} from '@ziweiai/contracts';
import { z } from 'zod';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { AnnualReportService } from './services/annual-report.service';
import { FortuneService } from './services/fortune.service';
import { DestinyTimelineService } from './services/destiny-timeline.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { DestinyTimelineResponse } from '@ziweiai/contracts';

/**
 * Vận theo mốc thời gian (US-016): vận ngày, vận tháng (thuần đọc) + báo cáo năm (LLM gate) + timeline 12 tháng.
 *
 * Cùng prefix `/charts/:id` với các endpoint horoscope khác (decision 0011). Mọi route Bearer +
 * ownership check + chart-system guard nằm trong service. Query parse qua schema `@ziweiai/contracts`.
 */
@Controller('charts')
export class FortuneController {
  constructor(
    private readonly fortuneService: FortuneService,
    private readonly annualReportService: AnnualReportService,
    private readonly destinyTimelineService: DestinyTimelineService,
  ) {}

  @Get(':chartSnapshotId/daily')
  async getDailyFortune(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Param('chartSnapshotId', new ZodValidationPipe(z.uuid(), 'Mã lá số không hợp lệ.')) chartId: string,
    @Query(new ZodValidationPipe(dailyFortuneRequestSchema)) query: z.infer<typeof dailyFortuneRequestSchema>,
  ): Promise<DailyFortuneResponse> {
    return this.fortuneService.getDailyFortune(currentUser, request.ip ?? 'unknown', chartId, query.asOf);
  }

  @Get(':chartSnapshotId/monthly')
  async getMonthlyFortune(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Param('chartSnapshotId', new ZodValidationPipe(z.uuid(), 'Mã lá số không hợp lệ.')) chartId: string,
    @Query(new ZodValidationPipe(monthlyFortuneRequestSchema)) query: z.infer<typeof monthlyFortuneRequestSchema>,
  ): Promise<MonthlyFortuneResponse> {
    return this.fortuneService.getMonthlyFortune(currentUser, request.ip ?? 'unknown', chartId, query.asOf);
  }

  @Get(':chartSnapshotId/annual-report')
  async getAnnualReport(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('chartSnapshotId', new ZodValidationPipe(z.uuid(), 'Mã lá số không hợp lệ.')) chartId: string,
    @Query('year') yearRaw?: unknown,
  ): Promise<AnnualReportResponse | null> {
    const year = yearRaw !== undefined ? annualReportRequestSchema.parse({ year: Number(yearRaw) }).year : undefined;
    return this.annualReportService.getAnnualReport(currentUser, chartId, year);
  }

  @Post(':chartSnapshotId/annual-report')
  async createAnnualReport(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Param('chartSnapshotId', new ZodValidationPipe(z.uuid(), 'Mã lá số không hợp lệ.')) chartId: string,
    @Query('year') yearRaw: unknown,
  ): Promise<AnnualReportResponse> {
    // Query param luôn là chuỗi → coerce sang number trước khi validate khoảng 1900..2100.
    const { year } = annualReportRequestSchema.parse({ year: Number(yearRaw) });
    return this.annualReportService.createAnnualReport(currentUser, request.ip ?? 'unknown', chartId, year);
  }

  @Get(':chartSnapshotId/destiny-timeline')
  async getDestinyTimeline(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Param('chartSnapshotId', new ZodValidationPipe(z.uuid(), 'Mã lá số không hợp lệ.')) chartId: string,
    @Query('year') yearRaw?: unknown,
  ): Promise<DestinyTimelineResponse> {
    const year = yearRaw !== undefined ? Number(yearRaw) : new Date().getFullYear();
    const validYear = Math.max(1900, Math.min(2100, Number.isNaN(year) ? new Date().getFullYear() : year));
    return this.destinyTimelineService.getDestinyTimeline(currentUser, request.ip ?? 'unknown', chartId, validYear);
  }
}
