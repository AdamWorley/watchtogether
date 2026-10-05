import { cloudflare } from '@cloudflare/vite-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte(), cloudflare()],
  // Local dev/preview only: allow access over Tailscale (`tailscale serve`) from other devices.
  server: { allowedHosts: ['.ts.net'] },
  preview: { allowedHosts: ['.ts.net'] },
  build: {
    // Hashed file names under /assets/ are served with a one-year immutable cache (see public/_headers).
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2022',
  },
});
