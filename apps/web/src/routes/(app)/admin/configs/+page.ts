import { redirect } from '@sveltejs/kit';
import { adminGetConfigs } from '$lib/api-client/admin';;
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

  try {
    const data = await adminGetConfigs(session.token);
    return { configs: data.configs || {}, session };
  } catch (err) {
    const error = err as { status?: number; kind?: string };
    if (
      error.status === 403 ||
      error.status === 401 ||
      error.kind === 'forbidden' ||
      error.kind === 'unauthorized'
    ) {
      throw redirect(303, '/');
    }
    return { configs: {}, session };
  }
};
