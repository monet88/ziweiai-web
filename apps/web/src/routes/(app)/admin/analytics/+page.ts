import type { PageLoad } from './$types';
import { adminGetAnalytics } from '$lib/api-client';

import { supabase } from '$lib/supabase/supabase-client';

export const load: PageLoad = async () => {
  const { data: { session: rawSession } } = await supabase.auth.getSession();
  const session = rawSession ? { token: rawSession.access_token, user: rawSession.user } : null;
  if (!session?.token) {
    return { analytics: null };
  }

  try {
    const res = await adminGetAnalytics(session.token);
    return {
      analytics: res.analytics
    };
  } catch (error) {
    console.error('Failed to load analytics:', error);
    return { analytics: null };
  }
};
