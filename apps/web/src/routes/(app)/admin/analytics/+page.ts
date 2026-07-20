import type { PageLoad } from './$types';
import { adminGetAnalytics } from '$lib/api-client';

export const load: PageLoad = async ({ parent }) => {
  const { session } = (await parent()) as any;
  if (!session?.token) {
    return { analytics: null };
  }

  try {
    const res = await adminGetAnalytics(session.token);
    return {
      analytics: res.analytics
    };
  } catch (error) {
    console.error('Failed to load analytics:', error);
    return { analytics: null };
  }
};
