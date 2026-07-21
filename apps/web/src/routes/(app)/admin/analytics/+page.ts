import type { PageLoad } from './$types';
import { adminGetAnalytics } from '$lib/api-client';

import { supabase } from '$lib/supabase/supabase-client';

export const load: PageLoad = async ({ url }) => {
  const { data: { session: rawSession } } = await supabase.auth.getSession();
  const session = rawSession ? { token: rawSession.access_token, user: rawSession.user } : null;
  if (!session?.token) {
    return { analytics: null, session };
  }

  const startDate = url.searchParams.get('startDate') || undefined;
  const endDate = url.searchParams.get('endDate') || undefined;

  try {
    const res = await adminGetAnalytics(session.token, { startDate, endDate });
    return { analytics: res.analytics || null, session };
  } catch (err) {
    console.error('Failed to fetch analytics', err);
    return { analytics: null, session };
  }
};
