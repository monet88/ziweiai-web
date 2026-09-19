import { z } from 'zod';

export const ichingLineValueSchema = z.union([
  z.literal(6), // Lão Âm (động)
  z.literal(7), // Thiếu Dương (tĩnh)
  z.literal(8), // Thiếu Âm (tĩnh)
  z.literal(9), // Lão Dương (động)
]);

export const ichingHexagramSchema = z.object({
  id: z.string().min(1), // id từ 1 đến 64
  name: z.string().min(1), // Tên quẻ (VD: Thuần Càn, Thiên Hỏa Đồng Nhân)
  lines: z.array(ichingLineValueSchema).length(6), // 6 hào từ Sơ hào (index 0) đến Thượng hào (index 5)
});

export const ichingDrawSchema = z.object({
  question: z.string().min(1),
  baseHexagram: ichingHexagramSchema, // Quẻ Chủ
  changedHexagram: ichingHexagramSchema.optional(), // Quẻ Biến (chỉ có khi có hào động)
  changingLines: z.array(z.number().int().min(0).max(5)), // Index của các hào động (0 = Sơ hào)
  narrative: z.string().min(1), // Luận giải từ AI
  cast_array: z.array(ichingLineValueSchema).length(6).optional(), // Client gửi lên
});

export type IChingLineValue = z.infer<typeof ichingLineValueSchema>;
export type IChingHexagram = z.infer<typeof ichingHexagramSchema>;
export type IChingDraw = z.infer<typeof ichingDrawSchema>;
