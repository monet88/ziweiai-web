import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  DaliurenAdapter,
  LiuyaoAdapter,
  MeiHuaAdapter,
  QimenAdapter,
  type AstrologyChartAdapter,
} from '@ziweiai/astro-engine';
import {
  createDivinationResponseSchema,
  type BirthInput,
  type CreateDivinationRequest,
  type CreateDivinationResponse,
  type DivinationChartSystem,
} from '@ziweiai/contracts';
import { buildChartSnapshotDedupeKey } from '../../../database/idempotency';
import { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { QuotasService } from '../../quotas/quotas.service';

// Cast moment is always the server "now" (decision 0021): no client date, no
// picker, no future. The four time-based adapters treat the BirthInput date/time
// as the casting moment, so we feed the current VN wall-clock at minute precision.
const CAST_TIMEZONE = 'Asia/Ho_Chi_Minh';
const CAST_LATITUDE = 10.8231;
const CAST_LONGITUDE = 106.6297;
const CAST_PLACE_LABEL = 'Việt Nam';

@Injectable()
export class DivinationsService {
  private readonly logger = new Logger(DivinationsService.name);
  private readonly adapters: Record<DivinationChartSystem, AstrologyChartAdapter> = {
    'mei-hua-yi-shu': new MeiHuaAdapter(),
    'liu-yao': new LiuyaoAdapter(),
    'da-liu-ren': new DaliurenAdapter(),
    'qi-men-dun-jia': new QimenAdapter(),
  };

  constructor(
    private readonly persistenceGateway: SupabasePersistenceGateway,
    private readonly quotasService: QuotasService,
  ) {}

  async createDivination(
    userId: string,
    ipAddress: string,
    input: CreateDivinationRequest,
    isAnonymous = false,
  ): Promise<CreateDivinationResponse> {
    await this.assertCanCreateChart(userId, ipAddress, isAnonymous);

    const adapter = this.adapters[input.chartSystem];
    const castAt = new Date();
    const birthInput = this.buildCastNowBirthInput(castAt);
    const snapshot = await adapter.calculateChart(birthInput);

    const dedupeKey = buildChartSnapshotDedupeKey({
      ownerUserId: userId,
      chartSystem: snapshot.chartSystem,
      inputHashDigest: snapshot.inputHash.digest,
      engineSemver: snapshot.engineVersion.engineSemver,
      ruleSourceVersion: snapshot.ruleSource.canonicalLibrary.version,
      schemaVersion: snapshot.engineVersion.schemaVersion,
    });

    // A divination is always a fresh cast for a specific question, so we never
    // dedupe-reuse here: even an identical cast moment is a new inquiry. We still
    // persist the snapshot via the same path and link a fresh context record.
    const chartRecord = await this.persistenceGateway.createChartSnapshot({
      ownerUserId: userId,
      birthProfileId: null,
      snapshotDedupeKey: `${dedupeKey}-${castAt.getTime()}`,
      snapshot,
    });

    const divinationContext = await this.persistenceGateway.createDivinationContext({
      ownerUserId: userId,
      chartSnapshotId: chartRecord.id,
      question: input.question,
      purposeKey: input.purposeKey,
      purposeCustom: input.purposeKey === 'custom' ? (input.purposeCustom ?? null) : null,
      castAt: castAt.toISOString(),
    });

    this.logger.log('Divination cast', {
      userId,
      chartSystem: input.chartSystem,
      chartSnapshotId: chartRecord.id,
      purposeKey: input.purposeKey,
    });

    return createDivinationResponseSchema.parse({
      snapshot,
      chartRecord,
      divinationContext,
      reusedExistingSnapshot: false,
    });
  }

  // Build a BirthInput whose date/time is the current VN wall-clock at minute
  // precision. For the four time-based systems the adapters read this as the
  // casting moment. Place/coords are the VN default seed (true solar time is off,
  // so coords do not affect the result; they only keep the snapshot non-blocked).
  private buildCastNowBirthInput(castAt: Date): BirthInput {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: CAST_TIMEZONE,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(castAt);
    const pick = (type: string): number =>
      Number.parseInt(parts.find((part) => part.type === type)?.value ?? '0', 10);
    // Intl can emit hour '24' at midnight under hour12:false; normalize to 0.
    const hour = pick('hour') % 24;

    return {
      calendar: 'gregorian',
      date: { year: pick('year'), month: pick('month'), day: pick('day'), isLeapMonth: null },
      time: { hour, minute: pick('minute'), isUnknown: false },
      sexOrGenderForChart: 'unknown',
      place: {
        label: CAST_PLACE_LABEL,
        manual: { latitude: CAST_LATITUDE, longitude: CAST_LONGITUDE, timezone: CAST_TIMEZONE },
      },
      locale: 'vi-VN',
      source: 'user-entered',
    };
  }

  private async assertCanCreateChart(userId: string, ipAddress: string, isAnonymous: boolean): Promise<void> {
    try {
      await this.quotasService.assertCanCreateChart(userId, ipAddress, isAnonymous);
    } catch (error) {
      throw new ApiErrorHttpException(
        HttpStatus.TOO_MANY_REQUESTS,
        'RATE_LIMITED',
        error instanceof Error ? error.message : 'Đã vượt hạn mức gieo quẻ.',
      );
    }
  }
}
