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

/**
 * Vận theo mốc thời gian (US-016): vận ngày, vận tháng (thuần đọc) + báo cáo năm (LLM gate).
 *
 * Cùng prefix `/charts/:id` với các endpoint horoscope khác (decision 0011). Mọi route Bearer +
 * ownership check + chart-system guard nằm trong service. Query parse qua schema `@ziweiai/contracts`.
 */
@Controller('charts')
export class FortuneController {
  constructor(
    private readonly fortuneService: FortuneService,
    private readonly annualReportService: AnnualReportService,
  ) {}

  @Get(':chartSnapshotId/daily')
  async getDailyFortune(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Param('chartSnapshotId') chartSnapshotId: string,
    @Query() query: unknown,
  ): Promise<DailyFortuneResponse> {
    const chartId = z.uuid().parse(chartSnapshotId);
    const { asOf } = dailyFortuneRequestSchema.parse(query);
    return this.fortuneService.getDailyFortune(currentUser, request.ip ?? 'unknown', chartId, asOf);
  }

  @Get(':chartSnapshotId/monthly')
  async getMonthlyFortune(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Param('chartSnapshotId') chartSnapshotId: string,
    @Query() query: unknown,
  ): Promise<MonthlyFortuneResponse> {
    const chartId = z.uuid().parse(chartSnapshotId);
    const { asOf } = monthlyFortuneRequestSchema.parse(query);
    return this.fortuneService.getMonthlyFortune(currentUser, request.ip ?? 'unknown', chartId, asOf);
  }

  @Post(':chartSnapshotId/annual-report')
  async createAnnualReport(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Param('chartSnapshotId') chartSnapshotId: string,
    @Query('year') yearRaw: unknown,
  ): Promise<AnnualReportResponse> {
    const chartId = z.uuid().parse(chartSnapshotId);
    // Query param luôn là chuỗi → coerce sang number trước khi validate khoảng 1900..2100.
    const { year } = annualReportRequestSchema.parse({ year: Number(yearRaw) });
    return this.annualReportService.createAnnualReport(currentUser, request.ip ?? 'unknown', chartId, year);
  }
}
