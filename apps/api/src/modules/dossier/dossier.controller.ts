import { Controller, Get, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import {
  type AuthenticatedUser,
  type DossierStatusResponse,
  type DossierUnlockResponse,
} from '@ziweiai/contracts';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { DossierService } from './dossier.service';

@Controller('charts')
export class DossierController {
  constructor(private readonly dossierService: DossierService) {}

  @Get(':chartSnapshotId/dossier/status')
  async getDossierStatus(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('chartSnapshotId', new ZodValidationPipe(z.uuid(), 'Mã lá số không hợp lệ.')) chartId: string,
  ): Promise<DossierStatusResponse> {
    return this.dossierService.getDossierStatus(currentUser, chartId);
  }

  @Post(':chartSnapshotId/dossier/unlock')
  async unlockDossier(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('chartSnapshotId', new ZodValidationPipe(z.uuid(), 'Mã lá số không hợp lệ.')) chartId: string,
  ): Promise<DossierUnlockResponse> {
    return this.dossierService.unlockDossier(currentUser, chartId);
  }
}
