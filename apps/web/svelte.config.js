import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // env.dir tro ve workspace root: $env/static/public doc PUBLIC_* tu root .env (file .env duy
    // nhat). SvelteKit dung kit.env.dir RIENG, khong theo Vite envDir — phai khai bao ca hai.
    env: {
      dir: '../..',
    },
    // SPA tĩnh: không SSR, fallback về index.html cho mọi route client-side.
    adapter: adapter({
      fallback: 'index.html',
    }),
  },
};

export default config;
