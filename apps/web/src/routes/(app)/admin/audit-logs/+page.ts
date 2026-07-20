import { adminGetAuditLogs } from '$lib/api-client';
import type { PageLoad } from './$types';

import { supabase } from '$lib/supabase/supabase-client';

export const load: PageLoad = async () => {
  const { data: { session: rawSession } } = await supabase.auth.getSession();
  const session = rawSession ? { token: rawSession.access_token, user: rawSession.user } : null;
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
