import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { adminListUsers } from '$lib/api-client';

export const load: PageLoad = async ({ parent }) => {
  const { session } = (await parent()) as any;
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
