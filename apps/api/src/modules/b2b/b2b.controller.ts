import { Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { B2bInquiryResponse } from '@ziweiai/contracts';
import { Public } from '../auth/decorators/public.decorator';
import { B2bService } from './b2b.service';

@Controller('b2b')
export class B2bController {
  constructor(private readonly b2bService: B2bService) {}

  @Public()
  @Post('inquiry')
  @HttpCode(HttpStatus.OK)
  async submitInquiry(@Req() request: Request): Promise<B2bInquiryResponse> {
    return this.b2bService.submitInquiry(request.body);
  }
}
