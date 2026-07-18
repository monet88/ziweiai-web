import { z } from 'zod';

// US-037 (backlog #45): hệ Lenormand — endpoint riêng POST /draws/lenormand + schema riêng + cờ
// EXTENDED_SYSTEM_LENORMAND_ENABLED. KHÔNG nhồi vào chartSystems enum (giữ nguyên invariant nhãn
// 12 hệ + no-han test + render registry); đi theo khuôn draws-tarot (chartSystem net-new dạng "rút
// + AI luận"). Dữ liệu 36 lá đã dịch sẵn sang tiếng Việt (pipeline B6-0), bài đọc do LLM sinh.

export const lenormandSpreadSchema = z.enum(['single', 'three', 'relationship', 'decision', 'nine']);

// Số lá rút cho mỗi kiểu trải bài. Nguồn sự thật chung cho service (rút bài) + prompt builder
// (nhãn vị trí). Khớp với SPREAD positions trong dataset nguồn.
export const LENORMAND_SPREAD_CARD_COUNTS = {
  single: 1,
  three: 3,
  relationship: 5,
  decision: 6,
  nine: 9,
} as const satisfies Record<z.infer<typeof lenormandSpreadSchema>, number>;

export const lenormandCardSchema = z.object({
  id: z.number().int().min(1).max(36), // id lá Lenormand cổ điển (1..36)
  name: z.string().min(1), // nhãn Việt (đã dịch)
  keywords: z.array(z.string().min(1)).min(1),
  meaning: z.string().min(1),
  reversed: z.boolean().default(false), // lá ngược (đọc như năng lượng bị chặn/hướng vào trong)
  position: z.number().int().min(0),
  positionLabel: z.string().min(1), // nhãn vị trí trong bố cục (Việt)
});

export const lenormandDrawSchema = z.object({
  question: z.string().min(1),
  spread: lenormandSpreadSchema,
  spreadName: z.string().min(1), // nhãn kiểu trải bài (Việt)
  cards: z.array(lenormandCardSchema).min(1),
  narrative: z.string().min(1), // bài đọc (Việt)
  seed: z.string().optional(), // seed để deterministic
});

export type LenormandDraw = z.infer<typeof lenormandDrawSchema>;
export type LenormandSpread = z.infer<typeof lenormandSpreadSchema>;
export type LenormandCard = z.infer<typeof lenormandCardSchema>;
