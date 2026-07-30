import {
  chartDetailResponseSchema,
  createChartResponseSchema,
  horoscopeResponseSchema,
  dailyFortuneResponseSchema,
  monthlyFortuneResponseSchema,
  annualReportResponseSchema,
  type ChartDetailResponse,
  type CreateChartRequest,
  type CreateChartResponse,
  type HoroscopeResponse,
  type HoroscopeScope,
  type DailyFortuneResponse,
  type MonthlyFortuneResponse,
  type AnnualReportResponse,
} from '@ziweiai/contracts';
import { fetchJson } from './fetch-json';

export const DEFAULT_HOROSCOPE_SCOPES: HoroscopeScope[] = ['decadal', 'yearly', 'monthly', 'daily'];
export const HOROSCOPE_QUERY_STALE_MS = 60 * 60 * 1000;
export const HOROSCOPE_QUERY_GC_MS = 24 * 60 * 60 * 1000;
export const DAILY_FORTUNE_QUERY_STALE_MS = 60 * 60 * 1000;
export const MONTHLY_FORTUNE_QUERY_STALE_MS = 6 * 60 * 60 * 1000;
export const ANNUAL_REPORT_QUERY_STALE_MS = 24 * 60 * 60 * 1000;

export function createChart(
  token: string,
  request: CreateChartRequest,
): Promise<CreateChartResponse> {
  return fetchJson('/charts', createChartResponseSchema, {
    method: 'POST',
    token,
    body: request,
  });
}

export function fetchChartDetail(
  token: string,
  chartId: string,
): Promise<ChartDetailResponse> {
  return fetchJson(`/charts/${chartId}`, chartDetailResponseSchema, { token });
}

export function fetchChartHoroscope(
  token: string,
  chartId: string,
  asOf: string,
  scopes: HoroscopeScope[] = DEFAULT_HOROSCOPE_SCOPES,
): Promise<HoroscopeResponse> {
  return fetchJson(`/charts/${chartId}/horoscope`, horoscopeResponseSchema, {
    method: 'POST',
    token,
    body: { asOf, scopes },
  });
}

export function fetchDailyFortune(
  token: string,
  chartId: string,
  asOf: string,
): Promise<DailyFortuneResponse> {
  return fetchJson(`/charts/${chartId}/daily?asOf=${asOf}`, dailyFortuneResponseSchema, { token });
}

export function fetchMonthlyFortune(
  token: string,
  chartId: string,
  asOf: string,
): Promise<MonthlyFortuneResponse> {
  return fetchJson(`/charts/${chartId}/monthly?asOf=${asOf}`, monthlyFortuneResponseSchema, { token });
}

export function createAnnualReport(
  token: string,
  request: { chartId: string; year: number },
): Promise<AnnualReportResponse> {
  return fetchJson(`/charts/${request.chartId}/annual-report?year=${request.year}`, annualReportResponseSchema, {
    method: 'POST',
    token,
  });
}
