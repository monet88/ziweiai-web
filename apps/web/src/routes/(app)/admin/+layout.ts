import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { supabase } from '$lib/supabase/supabase-client';

export const load: LayoutLoad = async () => {
  const {
    data: { session: rawSession },
  } = await supabase.auth.getSession();

  const user = rawSession?.user;
  const isAnonymous =
    !user ||
    user.is_anonymous === true ||
    user.app_metadata?.provider === 'anonymous' ||
    (!user.email && !user.phone);

  if (!rawSession?.access_token || isAnonymous) {
    throw redirect(303, '/sign-in');
  }
};
