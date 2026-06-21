import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// envDir tro ve workspace root: chi giu MOT file .env duy nhat o root (PUBLIC_* cho web). Vite mac
// dinh doc .env trong thu muc app (apps/web); tro ve root de khong can .env rieng o apps/web.
const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  envDir: workspaceRoot,
  plugins: [sveltekit()],
});
