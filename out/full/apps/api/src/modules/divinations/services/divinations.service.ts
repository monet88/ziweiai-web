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
import { randomUUID } from 'node:crypto';
import { buildChartSnapshotDedupeKey } from '../../../database/idempotency';
import { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { QuotasService } from '../../quotas/quotas.service';
import { DailyQuotaExceededError, RateLimitWindowError } from '../../quotas/quota-errors';

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
    // US-026: manual number-casting for Mai Hoa / Luc Hao. The contract guarantees
    // the manual payload matches the system, so we pass both through; other adapters
    // ignore them. Time method leaves both undefined (cast by server "now").
    const snapshot = await adapter.calculateChart(birthInput, {
      meihuaManual: input.castMethod === 'manual' ? input.meihuaManual : undefined,
      liuyaoManual: input.castMethod === 'manual' ? input.liuyaoManual : undefined,
    });

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
    // The random UUID suffix guarantees a unique dedupe key even if two casts land
    // in the same millisecond for the same user (avoids a 23505 unique violation).
    const chartRecord = await this.persistenceGateway.createChartSnapshot({
      ownerUserId: userId,
      birthProfileId: null,
      snapshotDedupeKey: `${dedupeKey}-${castAt.getTime()}-${randomUUID()}`,
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
      hourCycle: 'h23',
    }).formatToParts(castAt);
    const pick = (type: string): number =>
      Number.parseInt(parts.find((part) => part.type === type)?.value ?? '0', 10);
    // hourCycle 'h23' guarantees midnight is 0 and hours stay in 0-23 across
    // platforms/Node versions (hour12:false could emit '24' on some engines).
    const hour = pick('hour');

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
      // Only typed quota errors map to 429. Unexpected failures (e.g. a DB error
      // while counting quota) must propagate, not be disguised as RATE_LIMITED.
      if (error instanceof RateLimitWindowError || error instanceof DailyQuotaExceededError) {
        throw new ApiErrorHttpException(HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED', error.message);
      }
      throw error;
    }
  }
}
