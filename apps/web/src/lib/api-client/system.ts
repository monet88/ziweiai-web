import {
  healthResponseSchema,
  featuresResponseSchema,
  type HealthResponse,
  type FeaturesResponse,
} from '@ziweiai/contracts';
import { fetchJson } from './fetch-json';

export function fetchHealth(): Promise<HealthResponse> {
  return fetchJson('/health', healthResponseSchema);
}

export function fetchFeatures(): Promise<FeaturesResponse> {
  return fetchJson('/features', featuresResponseSchema);
}
