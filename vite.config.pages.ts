import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standalone Vite config for GitHub Pages (no imports to avoid TS module resolution issues on CI)
export default defineConfig({
  base: '/IM-Admin-Panel/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/storage'],
        },
      },
    },
    sourcemap: false,
    minify: 'esbuild',
  },
});


