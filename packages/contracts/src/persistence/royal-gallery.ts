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
  storagePath: z.string().nullable().optional(),
  imagePath: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export type RoyalGalleryShareRecord = z.infer<typeof royalGalleryShareRecordSchema>;

export const syncRoyalGalleryItemInputSchema = z.object({
  id: z.string().min(1),
  cardType: royalCardTypeSchema,
  title: z.string().min(1),
  subtitle: z.string().nullable().optional(),
  aspectRatio: royalAspectRatioSchema.default('standard'),
  customSealName: z.string().nullable().optional(),
  storagePath: z.string().nullable().optional(),
  imagePath: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  isDeleted: z.boolean().default(false).optional(),
});

export type SyncRoyalGalleryItemInput = z.infer<typeof syncRoyalGalleryItemInputSchema>;

export const syncRoyalGalleryRequestSchema = z.object({
  lastSyncedAt: z.string().datetime().nullable().optional(),
  items: z.array(syncRoyalGalleryItemInputSchema).default([]),
});

export type SyncRoyalGalleryRequest = z.infer<typeof syncRoyalGalleryRequestSchema>;

export const syncRoyalGalleryResponseSchema = z.object({
  serverItems: z.array(royalGalleryShareRecordSchema),
  deletedIds: z.array(z.string()),
  syncedAt: z.string().datetime(),
});

export type SyncRoyalGalleryResponse = z.infer<typeof syncRoyalGalleryResponseSchema>;

export const royalGalleryListResponseSchema = z.object({
  items: z.array(royalGalleryShareRecordSchema),
  total: z.number().int().nonnegative().optional(),
  hasMore: z.boolean().optional(),
});

export type RoyalGalleryListResponse = z.infer<typeof royalGalleryListResponseSchema>;
