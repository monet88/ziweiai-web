import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import {
  chartDetailResponseSchema,
  createChartRequestSchema,
  type AuthenticatedUser,
  type CreateChartResponse,
} from '@ziweiai/contracts';
import { z } from 'zod';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { ChartsService } from './services/charts.service';

@Controller('charts')
export class ChartsController {
  constructor(private readonly chartsService: ChartsService) {}

  @Post()
  async createChart(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<CreateChartResponse> {
    const input = createChartRequestSchema.parse(body);
    return this.chartsService.createChart(currentUser.userId, request.ip ?? 'unknown', input);
  }

  @Get(':chartSnapshotId')
  async getChartDetail(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('chartSnapshotId') chartSnapshotId: string,
  ) {
    const parsedChartSnapshotId = z.uuid().parse(chartSnapshotId);
    return chartDetailResponseSchema.parse(await this.chartsService.getChartDetail(currentUser.userId, parsedChartSnapshotId));
  }
}
