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

export const XIAO_LIU_REN_PALACES: readonly XiaoLiuRenPalace[] = [
  {
    key: 'dai_an',
    index: 0,
    name: 'Đại An',
    element: 'Mộc',
    direction: 'Đông',
    auspice: 'dai_cat',
    auspiceLabel: 'Đại Cát',
    deity: 'Thanh Long',
    meaning: 'Thân tâm an định, mưu sự vững bền, cầu tài ở phương Đông. Mọi sự bình an, lấy tĩnh chế động.',
    poem: 'Đại An sự sự xương, cầu mưu tại đông phương. Thất vật khứ bất viễn, trạch xá bảo an khang. Hành nhân thân vị động, bệnh giả chủ vô phương.',
    advice: 'Giữ vững tâm thế tĩnh tại, kiên định với mục tiêu đã định. Thuận theo tự nhiên, không nên nóng vội thay đổi.',
  },
  {
    key: 'luu_nien',
    index: 1,
    name: 'Lưu Niên',
    element: 'Thủy',
    direction: 'Bắc',
    auspice: 'binh',
    auspiceLabel: 'Bình (Thứ Hung)',
    deity: 'Huyền Vũ',
    meaning: 'Dây dưa chậm trễ, sự việc kéo dài chưa rõ hồi kết. Việc quan nên hoãn, người đi xa chưa về.',
    poem: 'Lưu Niên sự nan thành, cầu mưu nhật vị minh. Quan sự phàm nghi hoãn, khứ giả vị hồi trình. Thất vật nam phương kiến, cấp thảo phương tâm xưng.',
    advice: 'Kiên nhẫn chờ thời, không nên cưỡng cầu đốt cháy giai đoạn. Kiểm tra kỹ kế hoạch, đề phòng khẩu thiệt thị phi.',
  },
  {
    key: 'toc_hy',
    index: 2,
    name: 'Tốc Hỷ',
    element: 'Hỏa',
    direction: 'Nam',
    auspice: 'cat',
    auspiceLabel: 'Cát',
    deity: 'Chu Tước',
    meaning: 'Niềm vui đến mau, tin mừng báo hỷ, mưu sự cầu tài hướng Nam có lộc. Diễn tiến nhanh chóng, khởi sắc.',
    poem: 'Tốc Hỷ hỷ lai lâm, cầu tài hướng nam hành. Thất vật thân mùi ngọ, phùng nhân lộ thượng tầm. Quan sự hữu phúc đức, bệnh giả vô họa xâm.',
    advice: 'Nắm bắt thời cơ chớp nhoáng, hành động quyết đoán không chần chừ. Lan tỏa tinh thần tích cực và chia sẻ niềm vui.',
  },
  {
    key: 'xich_khau',
    index: 3,
    name: 'Xích Khẩu',
    element: 'Kim',
    direction: 'Tây',
    auspice: 'hung',
    auspiceLabel: 'Hung',
    deity: 'Bạch Hổ',
    meaning: 'Chủ về khẩu thiệt tranh chấp, thị phi, kiện tụng hoặc bất hòa. Mưu sự dễ gặp trở ngại, kinh hoảng.',
    poem: 'Xích Khẩu chủ khẩu thiệt, quan phi thiết nghi phòng. Thất vật tốc tốc thảo, hành nhân hữu kinh hoang. Lục súc đa tác quái, bệnh giả xuất tây phương.',
    advice: 'Cẩn trọng lời ăn tiếng nói, nhẫn nhịn tránh đôi co tranh cãi. Giữ mình kín kẽ, phòng ngừa rủi ro tranh chấp pháp lý.',
  },
  {
    key: 'tieu_cat',
    index: 4,
    name: 'Tiểu Cát',
    element: 'Mộc',
    direction: 'Tây Nam',
    auspice: 'tieu_cat',
    auspiceLabel: 'Tiểu Cát',
    deity: 'Lục Hợp',
    meaning: 'Gặp điều tốt lành, hòa hợp, có quý nhân tương trợ. Mưu sự thuận hòa, đón nhận tin vui hoặc cơ hội hợp tác.',
    poem: 'Tiểu Cát tối cát xương, lộ thượng hảo thương lượng. Âm nhân lai báo hỷ, thất vật tại khôn phương. Hành nhân lập tiện chí, giao quan thậm thị cường.',
    advice: 'Tích cực giao lưu kết nối, tìm kiếm sự đồng thuận và hợp tác đôi bên cùng có lợi. Lấy chân thành làm gốc.',
  },
  {
    key: 'khong_vong',
    index: 5,
    name: 'Không Vong',
    element: 'Thổ',
    direction: 'Trung ương',
    auspice: 'dai_hung',
    auspiceLabel: 'Đại Hung',
    deity: 'Câu Trần',
    meaning: 'Trống rỗng, hư hao, mưu sự khó thành, tin tức bặt tăm. Tránh xuất tiền lớn hoặc khởi sự mạo hiểm.',
    poem: 'Không Vong sự bất tường, âm nhân đa quái trương. Cầu tài vô lợi ích, hành nhân hữu tai ương. Thất vật tầm bất kiến, quan sự hữu hình thương.',
    advice: 'Thu liễm phòng thủ, bảo toàn lực lượng. Không nên đầu tư mạo hiểm hay cưỡng cầu lúc này; hãy bình tâm tu dưỡng.',
  },
] as const;

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
