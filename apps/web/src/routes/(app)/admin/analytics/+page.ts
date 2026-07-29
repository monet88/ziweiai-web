import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { adminGetAnalytics } from '$lib/api-client';
import { supabase } from '$lib/supabase/supabase-client';

export const load: PageLoad = async ({ url, parent }) => {
  const { session } = await parent();
  if (!session?.token) {
    throw redirect(303, '/sign-in');
  }

  const startDate = url.searchParams.get('startDate') || undefined;
  const endDate = url.searchParams.get('endDate') || undefined;

  try {
    const res = await adminGetAnalytics(session.token, { startDate, endDate });
    return { analytics: res.analytics || null, session };
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
    return { analytics: null, session };
  }
};
