import {
  adminUserListResponseSchema,
  type AdminUserListResponse,
  adminAnalyticsResponseSchema,
  type AdminAnalyticsResponse,
  adminTopupResponseSchema,
  adminTransactionListResponseSchema,
  adminConfigSchema,
  adminAuditLogListResponseSchema,
  adminSuccessResponseSchema,
} from '@ziweiai/contracts';
import { fetchJson } from './fetch-json';

export function adminListUsers(token: string): Promise<any> {
  return fetchJson('/admin/users', adminUserListResponseSchema, { method: 'GET', token });
}

export function adminTopupXU(token: string, userId: string, amount: number): Promise<any> {
  return fetchJson(`/admin/users/${userId}/xu`, adminTopupResponseSchema, {
    method: 'POST',
    token,
    body: { amount },
  });
}

export function adminListTransactions(token: string, params?: { page?: number; limit?: number; type?: string; startDate?: string; endDate?: string }): Promise<any> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.type) query.append('type', params.type);
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchJson(`/admin/transactions${queryString}`, adminTransactionListResponseSchema, { method: 'GET', token });
}

export function adminBanUser(token: string, userId: string): Promise<any> {
  return fetchJson(`/admin/users/${userId}/ban`, adminSuccessResponseSchema, { method: 'POST', token });
}

export function adminUnbanUser(token: string, userId: string): Promise<any> {
  return fetchJson(`/admin/users/${userId}/unban`, adminSuccessResponseSchema, { method: 'POST', token });
}

export function adminGetAnalytics(token: string, params?: { startDate?: string; endDate?: string }): Promise<AdminAnalyticsResponse> {
  const query = new URLSearchParams();
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchJson(`/admin/analytics${queryString}`, adminAnalyticsResponseSchema, { method: 'GET', token });
}

export function adminGetUsers(token: string, search?: string): Promise<AdminUserListResponse> {
  const query = new URLSearchParams();
  if (search) query.append('search', search);
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchJson(`/admin/users${queryString}`, adminUserListResponseSchema, { method: 'GET', token });
}

export function adminGetConfigs(token: string): Promise<any> {
  return fetchJson('/admin/configs', adminConfigSchema, { method: 'GET', token });
}

export function adminUpdateConfig(token: string, key: string, value: any): Promise<any> {
  return fetchJson(`/admin/configs/${key}`, adminConfigSchema, {
    method: 'POST',
    token,
    body: { value },
  });
}

export function adminGetAuditLogs(token: string, params?: { page?: number; limit?: number; action?: string; startDate?: string; endDate?: string }): Promise<any> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.action) query.append('action', params.action);
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchJson(`/admin/audit-logs${queryString}`, adminAuditLogListResponseSchema, { method: 'GET', token });
}
