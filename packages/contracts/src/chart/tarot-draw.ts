import { z } from 'zod';

export const tarotSpreadSchema = z.enum([
  'single',
  'three-card',
  'diamond',
  'moon',
  'horseshoe',
  'celtic-cross',
]);

// So la rut cho moi kieu trai bai. Nguon su that cho ca service (rut bai) lan
// prompt builder (nhan vi tri). Khi them spread moi, them ca o day va o
// SPREAD_POSITIONS ben api de hai ben khong lech.
export const TAROT_SPREAD_CARD_COUNTS = {
  single: 1,
  'three-card': 3,
  diamond: 4,
  moon: 4,
  horseshoe: 7,
  'celtic-cross': 10,
} as const satisfies Record<z.infer<typeof tarotSpreadSchema>, number>;

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
