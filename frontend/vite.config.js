import { defineConfig } from 'vite';
// @vitejs/plugin-react v6 targets Vite 8 (Rolldown-powered) and uses the oxc
// JSX transform — no deprecated esbuild/jsx options, no peer conflicts.
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    port: 5173,
  },
});
