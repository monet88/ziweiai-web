import { z } from 'zod';

export const b2bNeedTypeSchema = z.enum([
  'phong_thuy',
  'ho_so_hoang_gia',
  'mua_si_xu',
  'khac',
]);

export type B2bNeedType = z.infer<typeof b2bNeedTypeSchema>;

export const b2bInquiryRequestSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ tên không được vượt quá 100 ký tự'),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, { message: 'Số điện thoại không đúng định dạng Việt Nam' }),
  email: z
    .string()
    .trim()
    .email({ message: 'Địa chỉ email không hợp lệ' })
    .max(120, 'Email không được vượt quá 120 ký tự')
    .optional()
    .or(z.literal('')),
  company: z
    .string()
    .trim()
    .max(150, 'Tên công ty không được vượt quá 150 ký tự')
    .optional()
    .or(z.literal('')),
  need: b2bNeedTypeSchema.default('phong_thuy'),
  message: z
    .string()
    .trim()
    .max(1000, 'Nội dung tin nhắn không được vượt quá 1000 ký tự')
    .optional()
    .or(z.literal('')),
});

export type B2bInquiryRequest = z.infer<typeof b2bInquiryRequestSchema>;

export const b2bInquiryResponseSchema = z.object({
  success: z.literal(true),
  id: z.string().uuid({ message: 'ID không đúng định dạng UUID' }),
  createdAt: z.string(),
  message: z.string(),
});

export type B2bInquiryResponse = z.infer<typeof b2bInquiryResponseSchema>;
