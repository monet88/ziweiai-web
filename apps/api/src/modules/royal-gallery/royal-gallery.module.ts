import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RoyalGalleryController } from './royal-gallery.controller';
import { RoyalGalleryService } from './royal-gallery.service';
import { RoyalGalleryProGuard } from './royal-gallery.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [RoyalGalleryController],
  providers: [RoyalGalleryService, RoyalGalleryProGuard],
  exports: [RoyalGalleryService],
})
export class RoyalGalleryModule {}
