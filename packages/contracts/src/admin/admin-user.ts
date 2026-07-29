import { z } from 'zod';

export const adminUserSchema = z.object({
  user_id: z.string(),
  display_name: z.string().nullable(),
  email: z.string().nullable(),
  xu_balance: z.number(),
  created_at: z.string(),
  is_anonymous: z.boolean(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminUserListResponseSchema = z.array(adminUserSchema);
export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;
