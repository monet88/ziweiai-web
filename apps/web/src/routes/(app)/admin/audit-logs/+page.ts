import { adminGetAuditLogs } from '$lib/api-client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { session } = (await parent()) as any;
  if (!session?.token) {
    return { logs: [], session };
  }
  try {
    const data = await adminGetAuditLogs(session.token);
    return { logs: data.logs || [], session };
  } catch (err) {
    console.error('Failed to fetch audit logs', err);
    return { logs: [], session };
  }
};
