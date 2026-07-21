import { adminGetAuditLogs } from '$lib/api-client';
import type { PageLoad } from './$types';

import { supabase } from '$lib/supabase/supabase-client';

export const load: PageLoad = async ({ url }) => {
  const { data: { session: rawSession } } = await supabase.auth.getSession();
  const session = rawSession ? { token: rawSession.access_token, user: rawSession.user } : null;
  if (!session?.token) {
    return { logs: [], count: 0, page: 1, session };
  }

  const page = parseInt(url.searchParams.get('page') || '1');
  const action = url.searchParams.get('action') || undefined;
  const startDate = url.searchParams.get('startDate') || undefined;
  const endDate = url.searchParams.get('endDate') || undefined;

  try {
    const data = await adminGetAuditLogs(session.token, { page, limit: 50, action, startDate, endDate });
    return { logs: data.logs || [], count: data.count || 0, page, session };
  } catch (err) {
    console.error('Failed to fetch audit logs', err);
    return { logs: [], count: 0, page: 1, session };
  }
};
