import {
  royalGalleryShareRecordSchema,
  type SyncRoyalGalleryRequest,
  type SyncRoyalGalleryResponse,
  syncRoyalGalleryResponseSchema,
} from '@ziweiai/contracts';
import { z } from 'zod';
import { fetchJson } from './fetch-json';

const galleryListResponseSchema = z.object({
  items: z.array(royalGalleryShareRecordSchema),
});

export type GalleryListResponse = z.infer<typeof galleryListResponseSchema>;

export function fetchGalleryShares(
  token: string,
  limit = 50,
): Promise<GalleryListResponse> {
  return fetchJson(`/gallery?limit=${limit}`, galleryListResponseSchema, { token });
}

export function syncGalleryShares(
  token: string,
  body: SyncRoyalGalleryRequest,
): Promise<SyncRoyalGalleryResponse> {
  return fetchJson('/gallery/sync', syncRoyalGalleryResponseSchema, {
    token,
    method: 'POST',
    body,
  });
}

export function deleteGalleryShare(
  token: string,
  cardId: string,
): Promise<{ success: boolean }> {
  return fetchJson(`/gallery/${cardId}`, z.object({ success: z.boolean() }), {
    token,
    method: 'DELETE',
  });
}
