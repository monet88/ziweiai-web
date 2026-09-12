import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  type AstrologicalSynthesisResponse,
  astrologicalSynthesisRequestSchema,
} from '@ziweiai/contracts';
import { SynthesisService } from './synthesis.service';
import { RequireXU } from '../../common/interceptors/billing.interceptor';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';

@Controller('synthesis')
export class SynthesisController {
  private readonly logger = new Logger(SynthesisController.name);

  constructor(private readonly synthesisService: SynthesisService) {}

  /**
   * Khởi tạo Đại Bản Luận Giải Tổng Hợp Tam Môn Phái (Phí: 15 XU)
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(RequireXU(15))
  async generateSynthesis(
    @Body() body: any,
    @Req() req: AuthenticatedRequest,
  ): Promise<AstrologicalSynthesisResponse> {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('Yêu cầu đăng nhập để sử dụng tính năng luận giải tổng hợp');
    }

    const parseResult = astrologicalSynthesisRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(`Dữ liệu yêu cầu không hợp lệ: ${parseResult.error.message}`);
    }

    this.logger.log(`Tạo Luận Giải Tổng Hợp cho chartId=${parseResult.data.chartId} bởi user=${userId}`);
    return this.synthesisService.generateSynthesis(parseResult.data, userId);
  }

  /**
   * Lấy bản luận giải tổng hợp đã có sẵn (Miễn phí xem lại)
   */
  @Get(':chartId')
  @HttpCode(HttpStatus.OK)
  async getExistingSynthesis(
    @Param('chartId') chartId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AstrologicalSynthesisResponse | { exists: false }> {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('Yêu cầu đăng nhập');
    }

    const result = await this.synthesisService.getExistingSynthesis(chartId, userId);
    if (!result) {
      return { exists: false };
    }
    return result;
  }
}
