import { z } from 'zod';

export const tarotSpreadSchema = z.enum(['three-card', 'celtic-cross']);

export const tarotCardSchema = z.object({
  id: z.string().min(1), // ví dụ "major_00", "minor_wands_ace"
  name: z.string().min(1), // nhãn Việt (đã dịch)
  reversed: z.boolean().default(false),
  position: z.number().int().min(0),
});

export const tarotDrawSchema = z.object({
  question: z.string().min(1),
  spread: tarotSpreadSchema,
  cards: z.array(tarotCardSchema).min(1),
  narrative: z.string().min(1), // diễn giải (Việt)
  seed: z.string().optional(), // seed để deterministic
});

export type TarotDraw = z.infer<typeof tarotDrawSchema>;
export type TarotSpread = z.infer<typeof tarotSpreadSchema>;
export type TarotCard = z.infer<typeof tarotCardSchema>;
