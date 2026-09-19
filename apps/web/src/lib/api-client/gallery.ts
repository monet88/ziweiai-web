import {
  royalGalleryListResponseSchema,
  type RoyalGalleryListResponse,
  type SyncRoyalGalleryRequest,
  type SyncRoyalGalleryResponse,
  syncRoyalGalleryResponseSchema,
} from '@ziweiai/contracts';
import { z } from 'zod';
import { fetchJson } from './fetch-json';

export type GalleryListResponse = RoyalGalleryListResponse;

export function fetchGalleryShares(
  token: string,
  limit = 50,
  offset = 0,
): Promise<RoyalGalleryListResponse> {
  return fetchJson(`/gallery?limit=${limit}&offset=${offset}`, royalGalleryListResponseSchema, { token });
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
