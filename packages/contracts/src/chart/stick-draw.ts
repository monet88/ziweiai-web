import { z } from 'zod';

// US-039 (backlog #47): hệ Xin xăm — endpoint riêng POST /draws/stick + schema riêng + cờ
// EXTENDED_SYSTEM_STICKS_ENABLED. KHÔNG nhồi vào chartSystems enum (giữ invariant nhãn 12 hệ +
// no-han test + render registry). Khuôn "rút + AI luận" giống tarot/lenormand: rút 1 trong 100
// quẻ xăm deterministic theo seed; bộ quẻ (đã dịch sẵn qua pipeline B6-0) đính kèm + LLM luận giải
// theo câu hỏi. Dữ liệu quẻ giàu cấu trúc (giải theo lĩnh vực + theo tuổi/giới) nên schema phản
// ánh đầy đủ để client hiển thị, narrative do LLM sinh là phần dẫn dắt.

export const stickLevelSchema = z.enum([
  'Thượng thượng',
  'Thượng',
  'Trung thượng',
  'Trung',
  'Trung hạ',
  'Hạ',
  'Hạ hạ',
]);

export const stickDetailedInterpretationsSchema = z.object({
  home: z.string().optional(),
  business: z.string().optional(),
  travel: z.string().optional(),
  marriage: z.string().optional(),
  wealth: z.string().optional(),
  health: z.string().optional(),
  lawsuit: z.string().optional(),
  lostItem: z.string().optional(),
  searchPerson: z.string().optional(),
  relocation: z.string().optional(),
  career: z.string().optional(),
  pregnancy: z.string().optional(),
  livestock: z.string().optional(),
  disputes: z.string().optional(),
  illness: z.string().optional(),
  transaction: z.string().optional(),
  traveler: z.string().optional(),
});

export const stickCategoriesSchema = z.object({
  career: z.string().optional(),
  love: z.string().optional(),
  health: z.string().optional(),
  wealth: z.string().optional(),
  travel: z.string().optional(),
});

export const divinationStickSchema = z.object({
  id: z.number().int().min(1).max(100),
  level: stickLevelSchema,
  title: z.string().min(1),
  poem: z.string().min(1),
  interpretation: z.string().min(1),
  advice: z.string().min(1),
  story: z.string().optional(),
  dailyPoem: z.string().optional(),
  detailedInterpretations: stickDetailedInterpretationsSchema.optional(),
  categories: stickCategoriesSchema,
});

export const stickDrawSchema = z.object({
  question: z.string().min(1),
  stick: divinationStickSchema,
  narrative: z.string().min(1), // luận giải (Việt) do LLM sinh, dẫn dắt theo câu hỏi
  seed: z.string().optional(), // seed để deterministic
});

export type StickLevel = z.infer<typeof stickLevelSchema>;
export type DivinationStick = z.infer<typeof divinationStickSchema>;
export type StickDraw = z.infer<typeof stickDrawSchema>;
