import { redirect } from '@sveltejs/kit';
import { adminListTransactions } from '$lib/api-client';
import type { PageLoad } from './$types';

import { supabase } from '$lib/supabase/supabase-client';

export const load: PageLoad = async () => {
  const { data: { session: rawSession } } = await supabase.auth.getSession();
  const session = rawSession ? { token: rawSession.access_token, user: rawSession.user } : null;
  if (!session?.token) {
    throw redirect(302, '/sign-in');
  }

  try {
    const res = await adminListTransactions(session.token);
    return {
      transactions: res.transactions || [],
    };
  } catch (error) {
    console.error('Failed to load transactions:', error);
    return {
      transactions: [],
    };
  }
};
