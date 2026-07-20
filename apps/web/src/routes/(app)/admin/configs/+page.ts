import { adminGetConfigs } from '$lib/api-client';
import type { PageLoad } from './$types';

import { supabase } from '$lib/supabase/supabase-client';

export const load: PageLoad = async () => {
  const { data: { session: rawSession } } = await supabase.auth.getSession();
  const session = rawSession ? { token: rawSession.access_token, user: rawSession.user } : null;
  if (!session?.token) {
    return { configs: {}, session };
  }
  try {
    const data = await adminGetConfigs(session.token);
    return { configs: data.configs || {}, session };
  } catch (err) {
    console.error('Failed to fetch configs', err);
    return { configs: {}, session };
  }
};
