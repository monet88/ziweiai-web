import { z } from 'zod';

export const royalCardTypeSchema = z.enum([
  'ziwei',
  'sacredStick',
  'tarot',
  'iching',
]);

export type RoyalCardType = z.infer<typeof royalCardTypeSchema>;

export const royalAspectRatioSchema = z.enum([
  'standard',
  'story9_16',
]);

export type RoyalAspectRatio = z.infer<typeof royalAspectRatioSchema>;

export const royalGalleryShareRecordSchema = z.object({
  id: z.string().min(1),
  ownerUserId: z.string().uuid(),
  cardType: royalCardTypeSchema,
  title: z.string().min(1),
  subtitle: z.string().nullable().optional(),
  aspectRatio: royalAspectRatioSchema.default('standard'),
  customSealName: z.string().nullable().optional(),
  imagePath: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
});

export type RoyalGalleryShareRecord = z.infer<typeof royalGalleryShareRecordSchema>;

export const syncRoyalGalleryRequestSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      cardType: royalCardTypeSchema,
      title: z.string().min(1),
      subtitle: z.string().nullable().optional(),
      aspectRatio: royalAspectRatioSchema.default('standard'),
      customSealName: z.string().nullable().optional(),
      imagePath: z.string().nullable().optional(),
      imageUrl: z.string().nullable().optional(),
      payload: z.record(z.string(), z.unknown()).default({}),
      createdAt: z.string().datetime(),
    }),
  ),
});

export type SyncRoyalGalleryRequest = z.infer<typeof syncRoyalGalleryRequestSchema>;
