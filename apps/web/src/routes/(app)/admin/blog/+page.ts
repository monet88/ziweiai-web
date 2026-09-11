import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { supabase } from '$lib/supabase/supabase-client';

export const load: PageLoad = async () => {
  const {
    data: { session: rawSession },
  } = await supabase.auth.getSession();
  const session = rawSession ? { token: rawSession.access_token, user: rawSession.user } : null;
  if (!session?.token) {
    throw redirect(303, '/sign-in');
  }

  return { session };
};
