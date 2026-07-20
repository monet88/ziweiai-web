import { redirect } from '@sveltejs/kit';
import { adminListTransactions } from '$lib/api-client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { session } = (await parent()) as any;
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
