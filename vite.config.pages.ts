import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import baseConfig from './vite.config';

// Vite config specifically for GitHub Pages to serve under /IM-Admin-Panel/
export default defineConfig({
  ...(baseConfig as any),
  base: '/IM-Admin-Panel/',
  plugins: [react()],
});


