import { z } from 'zod';
import { birthDateSchema, birthInputSchema, birthTimeSchema } from './birth-input';
import { chartSystemSchema } from './chart-system';

const calculationConfidenceLevels = ['high', 'medium', 'low', 'blocked'] as const;
const calculationConfidenceReasonCodes = [
  'UNKNOWN_BIRTH_TIME',
  'MANUAL_TIMEZONE',
  'DST_AMBIGUOUS',
  'NO_TRUE_SOLAR_TIME',
  'FIXTURE_UNVERIFIED',
  'PLACE_UNRESOLVED',
  'LUNAR_LEAP_MONTH_UNSPECIFIED',
  'UNKNOWN_CHART_GENDER',
  'XUANSHU_REFERENCE_RUNTIME_UNAVAILABLE',
] as const;
const ruleSourcePriorities = [
  'iztro-first',
  'lunar-javascript-first',
  'manual-canonical-fixture',
  'xuanshu-first',
] as const;
const trueSolarTimeStatuses = ['deferred', 'resolved', 'unavailable'] as const;

function blocksExactReading(reasons: readonly string[]): boolean {
  return (
    reasons.includes('UNKNOWN_BIRTH_TIME') ||
    reasons.includes('DST_AMBIGUOUS') ||
    reasons.includes('PLACE_UNRESOLVED') ||
    reasons.includes('LUNAR_LEAP_MONTH_UNSPECIFIED') ||
    reasons.includes('UNKNOWN_CHART_GENDER') ||
    reasons.includes('XUANSHU_REFERENCE_RUNTIME_UNAVAILABLE')
  );
}

export const calculationConfidenceSchema = z
  .object({
    level: z.enum(calculationConfidenceLevels),
    reasons: z.array(z.enum(calculationConfidenceReasonCodes)),
    visibleMessageKey: z.string().min(1),
    blocksExactReading: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.blocksExactReading !== blocksExactReading(value.reasons)) {
      ctx.addIssue({
        code: 'custom',
        message: 'blocksExactReading must match the configured reason rules.',
      });
    }
  });

export const trueSolarTimeSchema = z.object({
  status: z.enum(trueSolarTimeStatuses),
  offsetMinutes: z.number().int().nullable(),
  provider: z.string().min(1).nullable(),
  confidence: z.enum(calculationConfidenceLevels),
});

export const resolvedLocationSchema = z.object({
  label: z.string().min(1),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  timezone: z.string().min(1).nullable(),
  resolver: z.enum(['manual', 'place-label', 'unresolved']),
});

export const normalizedBirthSchema = z.object({
  originalInput: birthInputSchema,
  resolvedDateTime: z.object({
    date: birthDateSchema,
    time: birthTimeSchema,
    utcInstant: z.iso.datetime().nullable(),
  }),
  resolvedLocation: resolvedLocationSchema,
  lunarDate: z.string().min(1).nullable(),
  ganZhi: z.object({
    yearPillar: z.string().min(1).nullable(),
    monthPillar: z.string().min(1).nullable(),
    dayPillar: z.string().min(1).nullable(),
    hourPillar: z.string().min(1).nullable(),
  }),
  trueSolarTime: trueSolarTimeSchema,
  normalizationConfidence: calculationConfidenceSchema,
});

export const engineVersionSchema = z.object({
  enginePackage: z.literal('@ziweiai/astro-engine'),
  engineSemver: z.string().min(1),
  adapterVersions: z.array(
    z.object({
      name: z.string().min(1),
      version: z.string().min(1),
      configProfile: z.string().min(1),
    }),
  ),
  fixtureSetVersion: z.string().min(1),
  schemaVersion: z.string().min(1),
});

export const ruleSourceSchema = z.object({
  system: chartSystemSchema,
  canonicalLibrary: z.object({
    name: z.string().min(1),
    version: z.string().min(1),
  }),
  ruleSet: z.string().min(1),
  schoolNotes: z.string().min(1).nullable(),
  sourcePriority: z.enum(ruleSourcePriorities),
});

export const inputHashSchema = z.object({
  algorithm: z.literal('sha256'),
  digest: z.string().min(32),
  saltPolicy: z.enum(['server-pepper-required', 'not-persisted']),
});

export const chartProvenanceSchema = z.object({
  referenceRepos: z.array(z.string().min(1)),
  runtimeLibraries: z.array(
    z.object({
      name: z.string().min(1),
      version: z.string().min(1),
    }),
  ),
  adapterConfig: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string().min(1),
    }),
  ),
  fixtureEvidence: z.object({
    fixtureSetId: z.string().min(1),
    passed: z.boolean(),
  }),
  calculationTimestamp: z.iso.datetime(),
  warnings: z.array(z.string().min(1)),
});

export type CalculationConfidence = z.infer<typeof calculationConfidenceSchema>;
export type TrueSolarTime = z.infer<typeof trueSolarTimeSchema>;
export type ResolvedLocation = z.infer<typeof resolvedLocationSchema>;
export type NormalizedBirth = z.infer<typeof normalizedBirthSchema>;
export type EngineVersion = z.infer<typeof engineVersionSchema>;
export type RuleSource = z.infer<typeof ruleSourceSchema>;
export type InputHash = z.infer<typeof inputHashSchema>;
export type ChartProvenance = z.infer<typeof chartProvenanceSchema>;
