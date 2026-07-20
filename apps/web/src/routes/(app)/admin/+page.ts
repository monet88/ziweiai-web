import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { adminListUsers } from '$lib/api-client';

export const load: PageLoad = async ({ parent }) => {
  const { session } = await parent();
  if (!session?.token) {
    throw redirect(303, '/login');
  }

  try {
    const res = await adminListUsers(session.token);
    return {
      users: res.users,
    };
  } catch (err: any) {
    if (err.status === 403 || err.status === 401) {
      throw redirect(303, '/');
    }
    return { users: [] };
  }
};
