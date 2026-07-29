import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { supabase } from '$lib/supabase/supabase-client';
import { isAdminUser } from '$lib/auth/auth-store.svelte';

export const load: LayoutLoad = async () => {
  const {
    data: { session: rawSession },
  } = await supabase.auth.getSession();

  const user = rawSession?.user ?? null;

  if (!rawSession?.access_token) {
    throw redirect(303, '/sign-in');
  }

  if (!isAdminUser(user)) {
    throw redirect(303, '/');
  }
  
  return {
    session: {
      token: rawSession.access_token,
      user: rawSession.user,
    }
  };
};
