import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  type AuthenticatedUser,
  type SyncRoyalGalleryRequest,
  syncRoyalGalleryRequestSchema,
} from '@ziweiai/contracts';
import { z } from 'zod';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RoyalGalleryProGuard } from './royal-gallery.guard';
import { RoyalGalleryService } from './royal-gallery.service';

interface UploadedImageFile {
  buffer: Buffer;
  mimetype?: string;
  size?: number;
}

@Controller('gallery')
@UseGuards(RoyalGalleryProGuard)
export class RoyalGalleryController {
  constructor(private readonly galleryService: RoyalGalleryService) {}

  @Get()
  async listGallery(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new ZodValidationPipe(z.coerce.number().int().min(1).max(100).default(50)))
    limit: number,
    @Query('offset', new ZodValidationPipe(z.coerce.number().int().min(0).default(0)))
    offset: number,
  ) {
    return this.galleryService.listShares(user.userId, limit, offset);
  }

  @Post('sync')
  async syncGallery(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(syncRoyalGalleryRequestSchema))
    body: SyncRoyalGalleryRequest,
  ) {
    return this.galleryService.syncGallery(user.userId, body);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadImage(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedImageFile | undefined,
    @Query('cardId', new ZodValidationPipe(z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/, 'ID thẻ không hợp lệ'))) cardId: string,
  ) {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Vui lòng đính kèm tệp ảnh hợp lệ để tải lên.');
    }
    const contentType = file.mimetype || 'image/png';
    return this.galleryService.uploadCardImage(
      user.userId,
      cardId,
      file.buffer,
      contentType,
    );
  }

  @Delete(':id')
  async deleteShare(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') cardId: string,
  ) {
    await this.galleryService.deleteShare(user.userId, cardId);
    return { success: true };
  }
}
