import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { adminListUsers } from '$lib/api-client';

import { supabase } from '$lib/supabase/supabase-client';

export const load: PageLoad = async () => {
  const { data: { session: rawSession } } = await supabase.auth.getSession();
  const session = rawSession ? { token: rawSession.access_token, user: rawSession.user } : null;
  if (!session?.token) {
    throw redirect(303, '/sign-in');
  }

  try {
    const res = await adminListUsers(session.token);
    return {
      users: res.users,
      session,
    };
  } catch (err) {
    const error = err as { status?: number };
    if (error.status === 403 || error.status === 401) {
      throw redirect(303, '/');
    }
    return { users: [] };
  }
};
