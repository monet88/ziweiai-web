import { z } from 'zod';
import { horoscopeFrameSchema } from './horoscope-frame';

/** Envelope trả về của `POST /charts/:id/horoscope`. */
export const horoscopeResponseSchema = z.object({
  chartId: z.uuid(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  frame: horoscopeFrameSchema,
});

export type HoroscopeResponse = z.infer<typeof horoscopeResponseSchema>;
