import { readable } from 'svelte/store';

export const page = readable({
  url: new URL('https://tuvitoantap.vercel.app/'),
  params: {},
  route: { id: '/' },
  status: 200,
  error: null,
  data: {},
  form: null,
});

export const navigating = readable(null);
export const updated = readable(false);
