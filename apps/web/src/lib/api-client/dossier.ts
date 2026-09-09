import {
  type DossierStatusResponse,
  type DossierUnlockResponse,
  dossierStatusResponseSchema,
  dossierUnlockResponseSchema,
} from '@ziweiai/contracts';
import { fetchJson } from './fetch-json';

export async function getDossierStatus(token: string | null, chartId: string): Promise<DossierStatusResponse> {
  return fetchJson(`/charts/${chartId}/dossier/status`, dossierStatusResponseSchema, {
    method: 'GET',
    token: token ?? undefined,
  });
}

export async function unlockDossier(token: string, chartId: string): Promise<DossierUnlockResponse> {
  return fetchJson(`/charts/${chartId}/dossier/unlock`, dossierUnlockResponseSchema, {
    method: 'POST',
    token,
  });
}
