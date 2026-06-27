import { z } from 'zod';

// US-038 (backlog #42): hệ Giải mộng — endpoint riêng POST /dreams/interpret + schema riêng + cờ
// EXTENDED_SYSTEM_DREAM_ENABLED. KHÔNG nhồi vào chartSystems enum (giữ invariant nhãn 12 hệ + no-han
// test + render registry). Khác "rút bài": input là mô tả giấc mơ (text tự do); service khớp biểu
// tượng theo từ khóa (dataset 56 biểu tượng đã dịch sẵn qua pipeline B6-0) rồi LLM luận giải.

export const dreamSymbolSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1),
  meaning: z.string().min(1),
  category: z.string().min(1),
  positive: z.string().optional(),
  negative: z.string().optional(),
  advice: z.string().optional(),
});

export const dreamInterpretationSchema = z.object({
  dream: z.string().min(1), // mô tả giấc mơ của người dùng
  symbols: z.array(dreamSymbolSchema), // biểu tượng khớp được (có thể rỗng → LLM luận tự do)
  narrative: z.string().min(1), // luận giải (Việt) do LLM sinh
});

export type DreamSymbol = z.infer<typeof dreamSymbolSchema>;
export type DreamInterpretation = z.infer<typeof dreamInterpretationSchema>;
