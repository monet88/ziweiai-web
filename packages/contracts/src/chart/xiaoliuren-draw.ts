import { z } from 'zod';

export const xiaoLiuRenPalaceKeySchema = z.enum([
  'dai_an',
  'luu_nien',
  'toc_hy',
  'xich_khau',
  'tieu_cat',
  'khong_vong',
]);

export type XiaoLiuRenPalaceKey = z.infer<typeof xiaoLiuRenPalaceKeySchema>;

export const xiaoLiuRenAuspiceSchema = z.enum([
  'dai_cat',
  'cat',
  'tieu_cat',
  'binh',
  'hung',
  'dai_hung',
]);

export type XiaoLiuRenAuspice = z.infer<typeof xiaoLiuRenAuspiceSchema>;

export const xiaoLiuRenPalaceSchema = z.object({
  key: xiaoLiuRenPalaceKeySchema,
  index: z.number().int().min(0).max(5),
  name: z.string().min(1),
  element: z.string().min(1), // Mộc, Thủy, Hỏa, Kim, Thổ
  direction: z.string().min(1), // Đông, Tây, Nam, Bắc, Trung ương
  auspice: xiaoLiuRenAuspiceSchema,
  auspiceLabel: z.string().min(1), // Cát, Hung, Đại Cát, Tiểu Cát, Bình...
  deity: z.string().min(1), // Thanh Long, Chu Tước, Bạch Hổ, Huyền Vũ, Lục Hợp, Câu Trần
  meaning: z.string().min(1),
  poem: z.string().min(1),
  advice: z.string().min(1),
});

export type XiaoLiuRenPalace = z.infer<typeof xiaoLiuRenPalaceSchema>;

export const xiaoLiuRenMethodSchema = z.enum(['time', 'numbers']);
export type XiaoLiuRenMethod = z.infer<typeof xiaoLiuRenMethodSchema>;

export const xiaoLiuRenDrawSchema = z.object({
  question: z.string().min(1),
  method: xiaoLiuRenMethodSchema,
  numbers: z.tuple([
    z.number().int().positive(),
    z.number().int().positive(),
    z.number().int().positive(),
  ]),
  firstPalace: xiaoLiuRenPalaceSchema,
  secondPalace: xiaoLiuRenPalaceSchema,
  targetPalace: xiaoLiuRenPalaceSchema, // Quẻ chủ (kết quả chính)
  flowDescription: z.string().min(1), // Diễn giải sinh khắc ngũ hành 3 cung
  lunarDateSummary: z.string().optional(),
  narrative: z.string().min(1), // Luận giải AI
  seed: z.string().optional(),
});

export type XiaoLiuRenDraw = z.infer<typeof xiaoLiuRenDrawSchema>;

export const xiaoLiuRenDrawRequestSchema = z
  .object({
    question: z.string().trim().min(1).max(500),
    method: xiaoLiuRenMethodSchema.default('time'),
    numbers: z
      .tuple([
        z.number().int().positive(),
        z.number().int().positive(),
        z.number().int().positive(),
      ])
      .optional(),
    seed: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === 'numbers' && (!data.numbers || data.numbers.length !== 3)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng cung cấp đủ 3 số nguyên dương khi gieo quẻ theo số.',
        path: ['numbers'],
      });
    }
  });

export type XiaoLiuRenDrawRequest = z.infer<typeof xiaoLiuRenDrawRequestSchema>;
