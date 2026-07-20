import { adminGetConfigs } from '$lib/api-client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { session } = (await parent()) as any;
  if (!session?.token) {
    return { configs: {}, session };
  }
  try {
    const data = await adminGetConfigs(session.token);
    return { configs: data.configs || {}, session };
  } catch (err) {
    console.error('Failed to fetch configs', err);
    return { configs: {}, session };
  }
};
