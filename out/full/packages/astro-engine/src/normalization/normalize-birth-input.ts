import { Temporal } from '@js-temporal/polyfill';
import type { BirthInput, NormalizedBirth } from '@ziweiai/contracts';

// Tùy chọn normalize theo hệ. `requiresGender` mặc định true để giữ hành vi cũ
// (Tử Vi cần giới tính); hệ bói theo thời khắc truyền false để không coi "giới
// tính chưa rõ" là lỗi chặn.
export interface NormalizeBirthOptions {
  requiresGender?: boolean;
}

function createConfidence(
  input: BirthInput,
  options?: NormalizeBirthOptions,
): NormalizedBirth['normalizationConfidence'] {
  const requiresGender = options?.requiresGender ?? true;
  const reasons: NormalizedBirth['normalizationConfidence']['reasons'] = [];

  if (input.time.isUnknown) {
    reasons.push('UNKNOWN_BIRTH_TIME');
  }

  if (input.place.manual) {
    reasons.push('MANUAL_TIMEZONE');
  }

  if (!input.place.manual) {
    reasons.push('PLACE_UNRESOLVED');
  }

  if (input.calendar === 'lunar' && input.date.isLeapMonth === null) {
    reasons.push('LUNAR_LEAP_MONTH_UNSPECIFIED');
  }

  if (requiresGender && input.sexOrGenderForChart === 'unknown') {
    reasons.push('UNKNOWN_CHART_GENDER');
  }

  const level = reasons.some((reason) =>
    ['UNKNOWN_BIRTH_TIME', 'PLACE_UNRESOLVED', 'LUNAR_LEAP_MONTH_UNSPECIFIED', 'UNKNOWN_CHART_GENDER'].includes(reason),
  )
    ? 'blocked'
    : reasons.length > 0
      ? 'medium'
      : 'high';

  return {
    level,
    reasons,
    visibleMessageKey:
      level === 'blocked'
        ? 'chart.input.requires-review'
        : input.time.isUnknown
          ? 'birth.time.unknown'
          : 'birth.time.verified',
    blocksExactReading: level === 'blocked',
  };
}

function createResolvedLocation(input: BirthInput): NormalizedBirth['resolvedLocation'] {
  if (input.place.manual) {
    return {
      label: input.place.label ?? 'Manual coordinates',
      latitude: input.place.manual.latitude,
      longitude: input.place.manual.longitude,
      timezone: input.place.manual.timezone,
      resolver: 'manual',
    };
  }

  return {
    label: input.place.label ?? 'Unresolved place',
    latitude: null,
    longitude: null,
    timezone: null,
    resolver: 'unresolved',
  };
}

function createUtcInstant(input: BirthInput): string | null {
  if (input.time.isUnknown || !input.place.manual) {
    return null;
  }

  const zonedDateTime = Temporal.ZonedDateTime.from({
    timeZone: input.place.manual.timezone,
    year: input.date.year,
    month: input.date.month,
    day: input.date.day,
    hour: input.time.hour ?? 0,
    minute: input.time.minute ?? 0,
    second: 0,
  });

  return zonedDateTime.toInstant().toString();
}

export function normalizeBirthInput(input: BirthInput, options?: NormalizeBirthOptions): NormalizedBirth {
  const normalizationConfidence = createConfidence(input, options);

  return {
    originalInput: input,
    resolvedDateTime: {
      date: input.date,
      time: input.time,
      utcInstant: createUtcInstant(input),
    },
    resolvedLocation: createResolvedLocation(input),
    lunarDate: null,
    ganZhi: {
      yearPillar: null,
      monthPillar: null,
      dayPillar: null,
      hourPillar: null,
    },
    trueSolarTime: {
      status: 'deferred',
      offsetMinutes: null,
      provider: null,
      confidence: normalizationConfidence.level,
    },
    normalizationConfidence,
  };
}
