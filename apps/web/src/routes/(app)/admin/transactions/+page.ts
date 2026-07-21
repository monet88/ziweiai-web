import { redirect } from '@sveltejs/kit';
import { adminListTransactions } from '$lib/api-client';
import type { PageLoad } from './$types';

import { supabase } from '$lib/supabase/supabase-client';

export const load: PageLoad = async ({ url }) => {
  const { data: { session: rawSession } } = await supabase.auth.getSession();
  const session = rawSession ? { token: rawSession.access_token, user: rawSession.user } : null;
  if (!session?.token) {
    throw redirect(302, '/sign-in');
  }

  const page = parseInt(url.searchParams.get('page') || '1');
  const type = url.searchParams.get('type') || undefined;
  const startDate = url.searchParams.get('startDate') || undefined;
  const endDate = url.searchParams.get('endDate') || undefined;

  try {
    const res = await adminListTransactions(session.token, { page, limit: 50, type, startDate, endDate });
    return {
      transactions: res.transactions || [],
      count: res.count || 0,
      page,
    };
  } catch (error) {
    console.error('Failed to load transactions:', error);
    return {
      transactions: [],
      count: 0,
      page: 1,
    };
  }
};
