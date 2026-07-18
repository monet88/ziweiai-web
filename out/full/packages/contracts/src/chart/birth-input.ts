import { z } from 'zod';

const calendarKinds = ['gregorian', 'lunar'] as const;
const birthInputSources = ['user-entered', 'imported', 'test-fixture'] as const;
const chartSexValues = ['male', 'female', 'unknown'] as const;

export const birthDateSchema = z.object({
  year: z.number().int().min(1).max(9999),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  isLeapMonth: z.boolean().nullable(),
});

export const birthTimeSchema = z
  .object({
    hour: z.number().int().min(0).max(23).nullable(),
    minute: z.number().int().min(0).max(59).nullable(),
    isUnknown: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.isUnknown) {
      return;
    }

    if (value.hour === null || value.minute === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Known birth time requires both hour and minute.',
      });
    }
  });

export const manualCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1),
});

export const birthPlaceSchema = z
  .object({
    label: z.string().trim().min(1).nullable(),
    manual: manualCoordinatesSchema.nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.label || value.manual) {
      return;
    }

    ctx.addIssue({
      code: 'custom',
      message: 'Birth place requires a label or manual coordinates.',
    });
  });

export const birthInputSchema = z
  .object({
    calendar: z.enum(calendarKinds),
    date: birthDateSchema,
    time: birthTimeSchema,
    sexOrGenderForChart: z.enum(chartSexValues),
    place: birthPlaceSchema,
    locale: z.string().min(2),
    source: z.enum(birthInputSources),
  })
  .superRefine((value, ctx) => {
    if (value.calendar === 'lunar' && value.date.isLeapMonth === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['date', 'isLeapMonth'],
        message: 'Lunar birth input must say whether the month is leap.',
      });
    }

    if (value.calendar === 'gregorian' && value.date.isLeapMonth !== null) {
      ctx.addIssue({
        code: 'custom',
        path: ['date', 'isLeapMonth'],
        message: 'Gregorian birth input cannot set leap-month metadata.',
      });
    }
  });

export type BirthDate = z.infer<typeof birthDateSchema>;
export type BirthTime = z.infer<typeof birthTimeSchema>;
export type ManualCoordinates = z.infer<typeof manualCoordinatesSchema>;
export type BirthPlace = z.infer<typeof birthPlaceSchema>;
export type BirthInput = z.infer<typeof birthInputSchema>;
