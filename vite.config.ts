import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
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
    minify: 'esbuild', // Using esbuild instead of terser for better compatibility
  },
  server: {
    port: 5173,
    host: true,
    open: true,
  },
});
